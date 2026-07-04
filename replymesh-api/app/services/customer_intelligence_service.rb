# frozen_string_literal: true

class CustomerIntelligenceService
  CACHE_GROUP = :customer_intelligence
  CACHE_ENDPOINT = :summary
  CACHE_TTL = 5.minutes
  PROFILE_LIMIT = 120

  RISK_LABELS = {
    low: "Baixa",
    medium: "Media",
    high: "Alta",
    critical: "Muito Alta"
  }.freeze

  OPPORTUNITY_LABELS = {
    low: "Baixo",
    medium: "Medio",
    high: "Alto",
    very_high: "Muito Alto"
  }.freeze

  class << self
    def call(company:, now: Time.current)
      new(company: company, now: now).call
    end
  end

  def initialize(company:, now: Time.current)
    @company = company
    @now = now
  end

  def call
    ReplymeshCacheService.fetch(
      company: company,
      group: CACHE_GROUP,
      endpoint: CACHE_ENDPOINT,
      expires_in: CACHE_TTL
    ) { build_payload }
  end

  private

  attr_reader :company, :now

  def build_payload
    customers = company.customers
      .includes(:sales_recovery_events)
      .order(Arel.sql("last_order_at DESC NULLS LAST"), created_at: :desc)
      .limit(PROFILE_LIMIT)
      .to_a

    orders = company.orders
      .includes(:order_items, :coupon)
      .where.not(status: "cancelled")
      .where.not(customer_id: nil)
      .order(created_at: :desc)
      .limit(2_000)
      .to_a

    orders_by_customer = orders.group_by(&:customer_id)
    profiles = customers.map { |customer| profile_for(customer, orders_by_customer[customer.id] || []) }
    summary = build_summary(profiles)

    {
      generated_at: now.iso8601,
      summary: summary,
      profiles: profiles.first(50),
      segments: segment_counts(profiles),
      risk_distribution: distribution(profiles, :risk_level),
      opportunity_distribution: distribution(profiles, :opportunity_level),
      favorite_products: top_products(orders),
      favorite_categories: top_categories(orders),
      insights: build_insights(profiles, summary),
      source: "customer_intelligence_service"
    }
  rescue StandardError => e
    Rails.logger.warn("[CustomerIntelligenceService] fallback company=#{company&.id}: #{e.class} #{e.message}")
    fallback_payload(e)
  end

  def profile_for(customer, orders)
    completed_orders = orders.select { |order| order.status == "completed" }
    total_orders = customer.total_orders.to_i.positive? ? customer.total_orders.to_i : orders.size
    total_spent = customer.total_spent_cents.to_i.positive? ? customer.total_spent_cents.to_i : completed_orders.sum(&:total_cents)
    average_ticket = total_orders.positive? ? total_spent / total_orders : 0
    last_order_at = customer.last_order_at || orders.map(&:created_at).compact.max
    first_order_at = customer.first_order_at || orders.map(&:created_at).compact.min
    days_since_last = last_order_at.present? ? ((now - last_order_at) / 1.day).floor : nil

    score = customer_score(customer, orders, total_orders, total_spent, days_since_last, first_order_at)
    profile = profile_label(total_orders, score, days_since_last)
    risk = risk_level(total_orders, days_since_last, score)
    opportunity = opportunity_level(total_orders, total_spent, average_ticket, score, risk)

    {
      customer_id: customer.id,
      label: "Cliente ##{customer.id}",
      profile: profile,
      customer_score: score,
      risk_level: risk,
      opportunity_level: opportunity,
      total_orders: total_orders,
      total_spent_cents: total_spent,
      average_ticket_cents: average_ticket,
      days_since_last_order: days_since_last,
      last_order_at: last_order_at&.iso8601,
      attributes: customer_attributes(customer, orders, total_orders, average_ticket, days_since_last),
      favorite_products: favorite_products_for(orders),
      favorite_categories: favorite_categories_for(orders),
      payment_preference: preferred_value(orders.map(&:payment_method)),
      order_type_preference: preferred_value(orders.map(&:order_type)),
      insights: customer_insights(customer, orders, profile, risk, opportunity, days_since_last, average_ticket)
    }
  end

  def customer_score(customer, orders, total_orders, total_spent, days_since_last, first_order_at)
    frequency_score = [[total_orders * 8, 30].min, 0].max
    value_score = [[total_spent / 1_000, 25].min, 0].max
    recency_score = case days_since_last
                    when nil then 5
                    when 0..7 then 25
                    when 8..30 then 18
                    when 31..60 then 10
                    else 3
                    end
    loyalty_days = first_order_at.present? ? ((now - first_order_at) / 1.day).floor : 0
    loyalty_score = [[loyalty_days / 15, 10].min, 0].max
    recovery_score = customer.sales_recovery_events.any? { |event| event.status == "recovered" } ? 10 : 0
    coupon_penalty = orders.count { |order| order.coupon_id.present? } > (orders.size / 2.0) ? -5 : 0

    [[frequency_score + value_score + recency_score + loyalty_score + recovery_score + coupon_penalty, 0].max, 100].min
  end

  def profile_label(total_orders, score, days_since_last)
    return "Novo" if total_orders.zero? || days_since_last.nil?
    return "Perdido" if days_since_last > 120
    return "Inativo" if days_since_last > 60
    return "Em risco" if days_since_last > 30
    return "VIP" if score >= 80
    return "Recorrente" if total_orders >= 3

    "Ativo"
  end

  def risk_level(total_orders, days_since_last, score)
    return RISK_LABELS[:low] if total_orders.zero? || days_since_last.nil?
    return RISK_LABELS[:critical] if days_since_last > 120
    return RISK_LABELS[:high] if days_since_last > 60
    return RISK_LABELS[:medium] if days_since_last > 30 || score < 35

    RISK_LABELS[:low]
  end

  def opportunity_level(total_orders, total_spent, average_ticket, score, risk)
    return OPPORTUNITY_LABELS[:very_high] if risk.in?([RISK_LABELS[:high], RISK_LABELS[:critical]]) && total_spent >= 10_000
    return OPPORTUNITY_LABELS[:very_high] if score >= 80 || average_ticket >= 8_000
    return OPPORTUNITY_LABELS[:high] if total_orders >= 3 || total_spent >= 5_000
    return OPPORTUNITY_LABELS[:medium] if total_orders.positive?

    OPPORTUNITY_LABELS[:low]
  end

  def customer_attributes(_customer, orders, total_orders, average_ticket, days_since_last)
    attributes = []
    attributes << "Cliente Premium" if average_ticket >= 8_000 || total_orders >= 8
    attributes << "Sensivel a desconto" if orders.count { |order| order.coupon_id.present? } >= 2
    attributes << "Compra por impulso" if total_orders == 1 && days_since_last.to_i <= 7
    attributes << "Compra somente fim de semana" if dominant_weekend?(orders)
    attributes << "Compra somente almoco" if dominant_period?(orders, 10..15)
    attributes << "Compra somente jantar" if dominant_period?(orders, 18..23)
    attributes << "Prefere retirada" if preferred_value(orders.map(&:order_type)) == "pickup"
    attributes << "Prefere delivery" if preferred_value(orders.map(&:order_type)) == "delivery"
    attributes << "Cliente sazonal" if total_orders >= 2 && days_since_last.to_i > 45
    attributes << "Cliente recorrente" if total_orders >= 2
    attributes.presence || ["Sem padrao suficiente"]
  end

  def customer_insights(_customer, orders, profile, risk, opportunity, days_since_last, average_ticket)
    insights = []
    weekday = preferred_weekday(orders)
    insights << "Cliente costuma comprar em #{weekday}." if weekday.present?
    insights << "Cliente esta #{profile.downcase}; vale acompanhar a recorrencia." if profile.in?(["Em risco", "Inativo", "Perdido"])
    insights << "Cliente aumentou potencial de crescimento." if opportunity.in?([OPPORTUNITY_LABELS[:high], OPPORTUNITY_LABELS[:very_high]])
    insights << "Risco de abandono #{risk.downcase}." unless risk == RISK_LABELS[:low]
    insights << "Ticket medio acima da media esperada." if average_ticket >= 8_000
    insights << "Sem compra ha #{days_since_last} dias." if days_since_last.to_i >= 30
    insights.first(4)
  end

  def build_summary(profiles)
    {
      total_customers: profiles.size,
      vip_customers: profiles.count { |item| item[:profile] == "VIP" },
      at_risk_customers: profiles.count { |item| item[:risk_level].in?([RISK_LABELS[:medium], RISK_LABELS[:high], RISK_LABELS[:critical]]) },
      recurring_customers: profiles.count { |item| item[:total_orders].to_i >= 2 },
      new_customers: profiles.count { |item| item[:profile] == "Novo" },
      average_customer_score: average(profiles.map { |item| item[:customer_score] }),
      biggest_opportunity: biggest_opportunity(profiles)
    }
  end

  def build_insights(profiles, summary)
    insights = []
    insights << "#{summary[:vip_customers]} cliente(s) VIP identificados." if summary[:vip_customers].positive?
    insights << "#{summary[:at_risk_customers]} cliente(s) precisam de atencao antes de ficarem inativos." if summary[:at_risk_customers].positive?
    insights << "Score medio da base: #{summary[:average_customer_score]}/100." if profiles.any?
    top_profile = segment_counts(profiles).max_by { |_label, count| count }
    insights << "Perfil mais comum da base: #{top_profile.first}." if top_profile.present?
    insights.presence || ["Ainda nao ha dados suficientes para gerar inteligencia de clientes."]
  end

  def top_products(orders)
    aggregate_items(orders.flat_map(&:order_items), :product_name).first(8)
  end

  def top_categories(orders)
    product_ids = orders.flat_map(&:order_items).map(&:product_id).compact.uniq
    return [] if product_ids.blank?

    products = company.products.includes(:category).where(id: product_ids).index_by(&:id)
    rows = orders.flat_map(&:order_items).filter_map do |item|
      product = products[item.product_id]
      next if product.blank?

      { label: product.category&.name.to_s.presence || "Sem categoria", quantity: item.quantity.to_i, value_cents: item.total_price_cents.to_i }
    end

    aggregate_rows(rows).first(8)
  end

  def favorite_products_for(orders)
    aggregate_items(orders.flat_map(&:order_items), :product_name).first(3)
  end

  def favorite_categories_for(orders)
    top_categories(orders).first(3)
  end

  def aggregate_items(items, label_method)
    rows = items.map do |item|
      { label: item.public_send(label_method).to_s, quantity: item.quantity.to_i, value_cents: item.total_price_cents.to_i }
    end
    aggregate_rows(rows)
  end

  def aggregate_rows(rows)
    rows.group_by { |row| row[:label].presence || "Nao identificado" }.map do |label, grouped|
      {
        label: label,
        quantity: grouped.sum { |row| row[:quantity].to_i },
        value_cents: grouped.sum { |row| row[:value_cents].to_i }
      }
    end.sort_by { |row| [-row[:quantity], -row[:value_cents], row[:label].to_s] }
  end

  def segment_counts(profiles)
    profiles.group_by { |item| item[:profile] }.transform_values(&:size)
  end

  def distribution(profiles, key)
    profiles.group_by { |item| item[key] }.transform_values(&:size)
  end

  def biggest_opportunity(profiles)
    selected = profiles.max_by { |item| [opportunity_weight(item[:opportunity_level]), item[:customer_score].to_i, item[:total_spent_cents].to_i] }
    return "Aguardando dados" if selected.blank?

    "#{selected[:label]} - #{selected[:opportunity_level]}"
  end

  def opportunity_weight(label)
    { "Muito Alto" => 4, "Alto" => 3, "Medio" => 2, "Baixo" => 1 }.fetch(label, 0)
  end

  def preferred_value(values)
    values.compact_blank.tally.max_by { |_value, count| count }&.first
  end

  def preferred_weekday(orders)
    weekday = preferred_value(orders.map { |order| order.created_at&.strftime("%A") })
    {
      "Monday" => "segunda-feira",
      "Tuesday" => "terca-feira",
      "Wednesday" => "quarta-feira",
      "Thursday" => "quinta-feira",
      "Friday" => "sexta-feira",
      "Saturday" => "sabado",
      "Sunday" => "domingo"
    }[weekday]
  end

  def dominant_weekend?(orders)
    return false if orders.size < 2

    weekend = orders.count { |order| order.created_at&.saturday? || order.created_at&.sunday? }
    weekend >= (orders.size * 0.7)
  end

  def dominant_period?(orders, hour_range)
    return false if orders.size < 2

    count = orders.count { |order| order.created_at.present? && hour_range.cover?(order.created_at.hour) }
    count >= (orders.size * 0.7)
  end

  def average(values)
    values = values.compact.map(&:to_f)
    return 0 if values.blank?

    (values.sum / values.size).round(1)
  end

  def fallback_payload(error)
    {
      generated_at: now.iso8601,
      summary: {
        total_customers: 0,
        vip_customers: 0,
        at_risk_customers: 0,
        recurring_customers: 0,
        new_customers: 0,
        average_customer_score: 0,
        biggest_opportunity: "Aguardando dados"
      },
      profiles: [],
      segments: {},
      risk_distribution: {},
      opportunity_distribution: {},
      favorite_products: [],
      favorite_categories: [],
      insights: ["Nao foi possivel calcular a inteligencia de clientes agora."]
    }
  end
end
