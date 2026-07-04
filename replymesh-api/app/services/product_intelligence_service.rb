# frozen_string_literal: true

require "set"

class ProductIntelligenceService
  CACHE_GROUP = :product_intelligence
  CACHE_ENDPOINT = :summary
  CACHE_TTL = 5.minutes
  CURRENT_WINDOW = 30.days
  PREVIOUS_WINDOW = 60.days
  PRODUCT_LIMIT = 180

  PERIODS = {
    "almoco" => 10..14,
    "tarde" => 15..17,
    "jantar" => 18..23,
    "madrugada" => 0..5
  }.freeze

  WEEKDAYS = {
    0 => "Domingo",
    1 => "Segunda",
    2 => "Terca",
    3 => "Quarta",
    4 => "Quinta",
    5 => "Sexta",
    6 => "Sabado"
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
    products = company.products
      .includes(:category, :product_option_groups, :stock_item)
      .order(:sort_order, :name)
      .limit(PRODUCT_LIMIT)
      .to_a

    current_orders = scoped_orders(current_start...now).includes(order_items: :product).to_a
    previous_orders = scoped_orders(previous_start...current_start).includes(:order_items).to_a
    current_items = active_items(current_orders)
    previous_items = active_items(previous_orders)

    current_stats = aggregate_product_stats(current_items, products)
    previous_stats = aggregate_product_stats(previous_items, products)
    bundles = sold_together(current_orders)
    profiles = products.map { |product| profile_for(product, current_stats, previous_stats, bundles) }
    orphan_profiles = orphan_item_profiles(current_stats, previous_stats, products, bundles)
    profiles = (profiles + orphan_profiles)
      .sort_by { |item| [-item[:product_score].to_i, -item[:sold_quantity].to_i, item[:label].to_s] }

    summary = build_summary(profiles, bundles)

    {
      generated_at: now.iso8601,
      summary: summary,
      products: profiles.first(80),
      star_products: profiles.select { |item| item[:classification] == "Campeao de vendas" }.first(10),
      growing_products: profiles.select { |item| item[:classification] == "Em crescimento" }.first(10),
      declining_products: profiles.select { |item| item[:classification] == "Em queda" }.first(10),
      forgotten_products: profiles.select { |item| item[:classification] == "Esquecido" }.first(12),
      bundles: bundles.first(12),
      insights: build_insights(profiles, summary, bundles),
      source: "product_intelligence_service"
    }
  rescue StandardError => e
    Rails.logger.warn("[ProductIntelligenceService] fallback company=#{company&.id}: #{e.class} #{e.message}")
    fallback_payload(e)
  end

  def scoped_orders(range)
    company.orders
      .where(created_at: range)
      .where.not(status: "cancelled")
      .order(created_at: :desc)
      .limit(3_000)
  end

  def active_items(orders)
    orders.flat_map(&:order_items).reject { |item| item.status == "cancelled" }
  end

  def aggregate_product_stats(items, products)
    products_by_id = products.index_by(&:id)

    items.each_with_object({}) do |item, memo|
      key = product_key(item)
      product = products_by_id[item.product_id]
      row = memo[key] ||= {
        product_id: item.product_id,
        label: product&.name.presence || item.product_name.to_s.presence || "Produto sem nome",
        category: product&.category&.name.to_s.presence || "Sem categoria",
        quantity: 0,
        revenue_cents: 0,
        cost_cents: 0,
        order_ids: Set.new,
        hours: Hash.new(0),
        weekdays: Hash.new(0)
      }

      order = item.order
      quantity = item.quantity.to_i
      row[:quantity] += quantity
      row[:revenue_cents] += item.total_price_cents.to_i
      row[:cost_cents] += item.total_cost_cents.to_i
      row[:order_ids] << item.order_id
      row[:hours][order.created_at.in_time_zone.hour] += quantity if order&.created_at
      row[:weekdays][order.created_at.in_time_zone.wday] += quantity if order&.created_at
    end
  end

  def profile_for(product, current_stats, previous_stats, bundles)
    key = "product:#{product.id}"
    current = current_stats[key] || empty_stats(product)
    previous = previous_stats[key] || empty_stats(product)
    trend_percent = percentage_change(current[:quantity], previous[:quantity])
    score = product_score(product, current, trend_percent)
    classification = classify_product(product, current, previous, score, trend_percent)

    {
      product_id: product.id,
      label: product.name,
      category: product.category&.name.to_s.presence || "Sem categoria",
      is_active: truthy?(product.is_active),
      is_featured: truthy?(product.is_featured),
      price_cents: product.price_cents.to_i,
      cost_price_cents: product.cost_price_cents.to_i,
      margin_percent: safe_margin(product),
      sold_quantity: current[:quantity].to_i,
      revenue_cents: current[:revenue_cents].to_i,
      orders_count: current[:order_ids].size,
      average_ticket_cents: average_ticket(current),
      product_score: score,
      classification: classification,
      trend: trend_label(trend_percent, current[:quantity], previous[:quantity]),
      trend_percent: trend_percent,
      potential: potential_for(product, current, score, trend_percent, classification),
      best_period: best_period(current[:hours]),
      best_day: best_day(current[:weekdays]),
      sold_together: bundles.select { |bundle| bundle[:primary] == product.name || bundle[:secondary] == product.name }.first(5),
      insights: product_insights(product, current, classification, trend_percent, score)
    }
  end

  def orphan_item_profiles(current_stats, previous_stats, products, bundles)
    known_keys = products.map { |product| "product:#{product.id}" }.to_set

    current_stats.reject { |key, _row| known_keys.include?(key) }.map do |key, current|
      previous = previous_stats[key] || empty_stats(nil)
      trend_percent = percentage_change(current[:quantity], previous[:quantity])
      score = [[current[:quantity].to_i * 8 + current[:revenue_cents].to_i / 1_000, 100].min, 0].max

      {
        product_id: current[:product_id],
        label: current[:label],
        category: current[:category],
        is_active: false,
        is_featured: false,
        price_cents: 0,
        cost_price_cents: 0,
        margin_percent: nil,
        sold_quantity: current[:quantity].to_i,
        revenue_cents: current[:revenue_cents].to_i,
        orders_count: current[:order_ids].size,
        average_ticket_cents: average_ticket(current),
        product_score: score,
        classification: "Popular",
        trend: trend_label(trend_percent, current[:quantity], previous[:quantity]),
        trend_percent: trend_percent,
        potential: score >= 70 ? "Alto" : "Medio",
        best_period: best_period(current[:hours]),
        best_day: best_day(current[:weekdays]),
        sold_together: bundles.select { |bundle| bundle[:primary] == current[:label] || bundle[:secondary] == current[:label] }.first(5),
        insights: ["Produto apareceu em pedidos recentes, mas nao esta vinculado ao cadastro atual."]
      }
    end
  end

  def product_score(product, current, trend_percent)
    quantity_score = [[current[:quantity].to_i * 7, 35].min, 0].max
    revenue_score = [[current[:revenue_cents].to_i / 1_000, 25].min, 0].max
    order_score = [[current[:order_ids].size * 5, 20].min, 0].max
    trend_score = trend_percent.to_f.positive? ? [[trend_percent / 3, 15].min, 0].max : 0
    featured_score = truthy?(product.is_featured) ? 5 : 0

    [[quantity_score + revenue_score + order_score + trend_score + featured_score, 0].max.round, 100].min
  end

  def classify_product(product, current, previous, score, trend_percent)
    active = truthy?(product.is_active)
    return "Esquecido" if active && current[:quantity].to_i.zero?
    return "Campeao de vendas" if score >= 82 && current[:quantity].to_i >= 5
    return "Em crescimento" if current[:quantity].to_i >= 2 && trend_percent >= 25
    return "Em queda" if previous[:quantity].to_i >= 3 && trend_percent <= -25
    return "Premium" if product.price_cents.to_i >= premium_threshold_cents || safe_margin(product).to_f >= 45
    return "Sazonal" if seasonal?(current)
    return "Popular" if score >= 65
    return "Entrada" if product.price_cents.to_i.positive? && product.price_cents.to_i <= entry_threshold_cents

    "Estavel"
  end

  def sold_together(orders)
    pairs = Hash.new { |hash, key| hash[key] = { orders: 0, revenue_cents: 0 } }
    product_order_counts = Hash.new(0)

    orders.each do |order|
      labels = order.order_items
        .reject { |item| item.status == "cancelled" }
        .map { |item| item.product_name.to_s.presence || item.product&.name.to_s }
        .map(&:strip)
        .reject(&:blank?)
        .uniq

      labels.each { |label| product_order_counts[label] += 1 }
      labels.combination(2).each do |a, b|
        primary, secondary = [a, b].sort
        key = [primary, secondary]
        pairs[key][:orders] += 1
        pairs[key][:revenue_cents] += order.total_cents.to_i
      end
    end

    pairs.map do |(primary, secondary), data|
      base = [product_order_counts[primary], product_order_counts[secondary]].min
      percent = base.positive? ? ((data[:orders].to_f / base) * 100).round(1) : 0.0
      {
        primary: primary,
        secondary: secondary,
        label: "#{primary} + #{secondary}",
        orders: data[:orders],
        percent: percent,
        revenue_cents: data[:revenue_cents]
      }
    end.sort_by { |row| [-row[:orders].to_i, -row[:percent].to_f, row[:label].to_s] }
  end

  def build_summary(profiles, bundles)
    {
      total_products: profiles.size,
      active_products: profiles.count { |item| item[:is_active] },
      average_product_score: average(profiles.map { |item| item[:product_score] }),
      champion_product: profiles.max_by { |item| [item[:sold_quantity].to_i, item[:revenue_cents].to_i] }&.dig(:label),
      growing_product: profiles.find { |item| item[:classification] == "Em crescimento" }&.dig(:label),
      forgotten_product: profiles.find { |item| item[:classification] == "Esquecido" }&.dig(:label),
      highest_potential_product: profiles.max_by { |item| [potential_weight(item[:potential]), item[:product_score].to_i] }&.dig(:label),
      best_bundle: bundles.first
    }
  end

  def build_insights(profiles, summary, bundles)
    insights = []
    insights << "#{summary[:champion_product]} e o produto com melhor desempenho recente." if summary[:champion_product].present?
    insights << "#{summary[:growing_product]} esta em crescimento e pode receber destaque." if summary[:growing_product].present?
    insights << "#{summary[:forgotten_product]} esta ativo, mas quase nao vendeu no periodo." if summary[:forgotten_product].present?
    insights << "#{bundles.first[:label]} aparece como combinacao forte em #{bundles.first[:orders]} pedido(s)." if bundles.first.present?
    insights << "Score medio dos produtos: #{summary[:average_product_score]}/100." if profiles.any?
    insights.presence || ["Ainda nao ha pedidos suficientes para gerar inteligencia de produtos."]
  end

  def product_insights(product, current, classification, trend_percent, score)
    insights = []
    insights << "Produto ativo sem vendas recentes." if classification == "Esquecido"
    insights << "Crescimento de #{trend_percent.round(1)}% frente ao periodo anterior." if classification == "Em crescimento"
    insights << "Queda de #{trend_percent.abs.round(1)}% frente ao periodo anterior." if classification == "Em queda"
    insights << "Produto pode funcionar bem como destaque." if score >= 75
    insights << "Margem cadastrada acima da media." if safe_margin(product).to_f >= 45
    insights << "Vendido em #{current[:order_ids].size} pedido(s) no periodo." if current[:order_ids].size.positive?
    insights.first(4)
  end

  def empty_stats(product)
    {
      product_id: product&.id,
      label: product&.name.to_s,
      category: product&.category&.name.to_s.presence || "Sem categoria",
      quantity: 0,
      revenue_cents: 0,
      cost_cents: 0,
      order_ids: Set.new,
      hours: Hash.new(0),
      weekdays: Hash.new(0)
    }
  end

  def product_key(item)
    item.product_id.present? ? "product:#{item.product_id}" : "name:#{item.product_name.to_s.downcase.strip}"
  end

  def current_start
    now - CURRENT_WINDOW
  end

  def previous_start
    now - PREVIOUS_WINDOW
  end

  def percentage_change(current_value, previous_value)
    current_value = current_value.to_f
    previous_value = previous_value.to_f
    return 0.0 if current_value.zero? && previous_value.zero?
    return 100.0 if previous_value.zero?

    (((current_value - previous_value) / previous_value) * 100).round(1)
  end

  def average_ticket(stats)
    count = stats[:order_ids].size
    count.positive? ? (stats[:revenue_cents].to_i / count) : 0
  end

  def best_period(hours)
    return "Sem dados" if hours.blank? || hours.values.sum.zero?

    PERIODS.map do |label, range|
      [label, hours.select { |hour, _count| range.cover?(hour.to_i) }.values.sum]
    end.max_by(&:last)&.first&.capitalize || "Sem dados"
  end

  def best_day(weekdays)
    return "Sem dados" if weekdays.blank? || weekdays.values.sum.zero?

    WEEKDAYS[weekdays.max_by { |_day, count| count }.first] || "Sem dados"
  end

  def trend_label(trend_percent, current_quantity, previous_quantity)
    return "Estavel" if current_quantity.to_i.zero? && previous_quantity.to_i.zero?
    return "Subindo" if trend_percent >= 15
    return "Caindo" if trend_percent <= -15

    "Estavel"
  end

  def potential_for(product, current, score, trend_percent, classification)
    return "Muito Alto" if classification.in?(["Campeao de vendas", "Em crescimento"]) && score >= 75
    return "Alto" if trend_percent >= 15 || truthy?(product.is_featured) || current[:quantity].to_i >= 5
    return "Medio" if score >= 35 || current[:quantity].positive?

    "Baixo"
  end

  def potential_weight(value)
    { "Muito Alto" => 4, "Alto" => 3, "Medio" => 2, "Baixo" => 1 }.fetch(value.to_s, 0)
  end

  def seasonal?(stats)
    quantity = stats[:quantity].to_i
    return false if quantity < 4

    hour_peak = stats[:hours].values.max.to_i
    day_peak = stats[:weekdays].values.max.to_i
    [hour_peak, day_peak].any? { |peak| peak.to_f / quantity >= 0.7 }
  end

  def safe_margin(product)
    return nil unless product.respond_to?(:margin_percent)

    product.margin_percent
  rescue StandardError
    nil
  end

  def premium_threshold_cents
    8_000
  end

  def entry_threshold_cents
    2_000
  end

  def truthy?(value)
    value == true || value.to_s == "true"
  end

  def average(values)
    values = values.compact.map(&:to_f)
    return 0 if values.empty?

    (values.sum / values.size).round
  end

  def fallback_payload(error)
    {
      generated_at: now.iso8601,
      summary: {
        total_products: 0,
        active_products: 0,
        average_product_score: 0,
        champion_product: nil,
        growing_product: nil,
        forgotten_product: nil,
        highest_potential_product: nil,
        best_bundle: nil
      },
      products: [],
      star_products: [],
      growing_products: [],
      declining_products: [],
      forgotten_products: [],
      bundles: [],
      insights: ["Nao foi possivel calcular a inteligencia de produtos agora."],
      error: error.message,
      source: "product_intelligence_service"
    }
  end
end
