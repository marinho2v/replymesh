class SalesRecoveryIntelligence
  CUSTOMER_PAUSE_THRESHOLD = 3
  CUSTOMER_REPUTATION_WINDOW = 90.days
  LOW_CART_CENTS = 4_000
  HIGH_CART_CENTS = 10_000
  FREE_DELIVERY_CART_CENTS = 15_000

  def initialize(company:, setting:, now: Time.current)
    @company = company
    @setting = setting
    @now = now
  end

  def customer_value(customer)
    return anonymous_customer_value unless customer

    score = compute_customer_value_score(customer)
    segment = segment_for(score, customer)
    reputation = reputation(customer: customer, phone: customer.whatsapp.presence || customer.phone)

    persist_customer_value(customer, score, segment, reputation)
    {
      score: score,
      segment: segment,
      label: customer_value_label(score, segment),
      reputation: reputation
    }
  end

  def reputation(customer:, phone:)
    scope = @company.sales_recovery_events
      .where("created_at >= ?", CUSTOMER_REPUTATION_WINDOW.ago)
      .where.not(status: "queued")
    scope = if customer
              scope.where(customer_id: customer.id)
            else
              scope.where(customer_phone: normalize_phone(phone))
            end

    sent = scope.where(status: %w[sent recovered]).count
    recovered = scope.where(status: "recovered").count
    failed = scope.where(status: "failed").count
    blocked = scope.where(status: "skipped").count
    recently_sent = scope.where(status: %w[sent recovered]).where("sent_at >= ?", 7.days.ago).count
    ignored = scope.where(status: "sent").where(recovered_at: nil).where("sent_at <= ?", 24.hours.ago).count
    conversion_rate = sent.positive? ? ((recovered.to_f / sent) * 100).round(1) : 0.0

    {
      sent: sent,
      recovered: recovered,
      failed: failed,
      blocked: blocked,
      ignored: ignored,
      recently_sent: recently_sent,
      conversion_rate: conversion_rate,
      paused: ignored >= CUSTOMER_PAUSE_THRESHOLD && recovered.zero?,
      pause_reason: ignored >= CUSTOMER_PAUSE_THRESHOLD && recovered.zero? ? "ignored_recoveries" : nil
    }
  end

  def recovery_score(cart, customer, customer_value:)
    reputation = customer_value[:reputation] || reputation(customer: customer, phone: cart.customer_phone)
    score = 0
    score += cart_value_score(cart.total_cents.to_i)
    score += item_count_score(cart)
    score += abandoned_time_score(cart)
    score += customer_profile_score(customer, customer_value[:score].to_i)
    score += timing_score
    score -= reputation_penalty(reputation)
    score.clamp(0, 100)
  end

  def benefit_decision(cart, customer, customer_value:, recovery_score:)
    reputation = customer_value[:reputation].to_h
    return decision("none", "Cliente pausado por baixa resposta recente.", "customer_paused") if reputation[:paused]
    return decision("none", "Carrinho de baixo valor: melhor lembrar sem desconto.", "low_cart") if cart.total_cents.to_i <= LOW_CART_CENTS
    return decision("none", "Cliente VIP: abordagem sem desconto preserva margem.", "vip_no_discount") if customer_value[:segment] == "vip"
    return decision("free_shipping", "Carrinho alto: frete gratis tende a converter melhor.", "high_cart_free_delivery") if cart.total_cents.to_i >= FREE_DELIVERY_CART_CENTS
    return decision("percentage", "Cliente novo: cupom inicial ajuda a primeira conversao.", "new_customer_coupon") if customer.nil? || customer.total_orders.to_i.zero?
    return decision("percentage", "Score alto com cliente recorrente: cupom leve para acelerar decisao.", "high_score_percentage") if recovery_score.to_i >= 70
    return decision("none", "Chance moderada: lembrar primeiro sem incentivar desconto.", "reminder_only")
  end

  def chance_label(score)
    value = score.to_i
    return "Altissima chance" if value >= 85
    return "Alta chance" if value >= 70
    return "Chance media" if value >= 45

    "Baixa chance"
  end

  def insights
    events = @company.sales_recovery_events.where("created_at >= ?", 30.days.ago)
    sent = events.where(status: %w[sent recovered])
    recovered = events.where(status: "recovered")
    insights = []

    high_cart = sent.where("cart_total_cents >= ?", HIGH_CART_CENTS)
    low_cart = sent.where("cart_total_cents < ?", HIGH_CART_CENTS)
    high_rate = conversion_rate(high_cart)
    low_rate = conversion_rate(low_cart)
    insights << "Carrinhos acima de R$100 converteram melhor neste periodo." if high_rate > low_rate && high_cart.exists?

    free_delivery = conversion_rate(sent.where(benefit_decision: "free_shipping"))
    coupon = conversion_rate(sent.where(benefit_decision: "percentage"))
    if free_delivery.positive? || coupon.positive?
      insights << (free_delivery >= coupon ? "Frete gratis performou melhor que cupom." : "Cupom percentual performou melhor que frete gratis.")
    end

    ai_rate = conversion_rate(sent.where(delivery_strategy: "ai"))
    template_rate = conversion_rate(sent.where(delivery_strategy: "template"))
    if ai_rate.positive? || template_rate.positive?
      insights << (ai_rate >= template_rate ? "Mensagens com IA tiveram melhor conversao." : "Templates tiveram desempenho mais estavel que IA.")
    end

    recovered_value = recovered.sum(:recovered_value_cents)
    insights << "Valor recuperado nos ultimos 30 dias: #{money(recovered_value)}." if recovered_value.positive?
    insights.presence || ["Ainda nao ha volume suficiente para gerar recomendacoes confiaveis."]
  end

  private

  def anonymous_customer_value
    { score: 12, segment: "new", label: "Cliente novo", reputation: reputation(customer: nil, phone: nil) }
  end

  def compute_customer_value_score(customer)
    orders = customer.total_orders.to_i
    total = customer.total_spent_cents.to_i
    average_ticket = orders.positive? ? total / orders : 0
    age_days = [((@now - (customer.first_order_at || customer.created_at)) / 1.day).floor, 1].max
    recency_days = customer.last_order_at ? ((@now - customer.last_order_at) / 1.day).floor : 999
    frequency = orders.to_f / [age_days / 30.0, 1].max
    coupon_orders = customer.orders.where.not(coupon_id: nil).or(customer.orders.where.not(coupon_code: [nil, ""])).count
    coupon_ratio = orders.positive? ? coupon_orders.to_f / orders : 0.0

    score = 0
    score += [orders * 8, 28].min
    score += [[total / 5_000, 22].min, 0].max
    score += [[average_ticket / 1_000, 18].min, 0].max
    score += recency_score(recency_days)
    score += [frequency * 8, 12].min
    score += [age_days / 45, 8].min
    score -= (coupon_ratio * 8).round
    score.clamp(0, 100)
  end

  def persist_customer_value(customer, score, segment, reputation)
    return unless customer.has_attribute?(:customer_value_score)

    customer.update_columns(
      customer_value_score: score,
      customer_segment: segment,
      customer_value_score_calculated_at: @now,
      recovery_reputation_json: reputation,
      updated_at: customer.updated_at
    )
  rescue StandardError => e
    Rails.logger.warn("Sales recovery customer value persist skipped for #{customer.id}: #{e.class} #{e.message}")
  end

  def segment_for(score, customer)
    return "vip" if score >= 80
    return "recurring" if score >= 55 || customer.total_orders.to_i >= 3
    return "active" if score >= 30 || customer.total_orders.to_i.positive?

    "new"
  end

  def customer_value_label(score, segment)
    case segment
    when "vip" then "Cliente VIP"
    when "recurring" then "Cliente recorrente"
    when "active" then "Cliente ativo"
    else "Cliente novo"
    end + " (#{score})"
  end

  def recency_score(days)
    return 14 if days <= 7
    return 10 if days <= 30
    return 6 if days <= 90
    return 2 if days <= 180

    0
  end

  def cart_value_score(cents)
    return 8 if cents <= LOW_CART_CENTS
    return 22 if cents >= FREE_DELIVERY_CART_CENTS

    ((cents.to_f / FREE_DELIVERY_CART_CENTS) * 22).round
  end

  def item_count_score(cart)
    count = Array(cart.items).sum { |item| item["quantity"].to_i.nonzero? || 1 }
    [count * 7, 21].min
  end

  def abandoned_time_score(cart)
    minutes = [((@now - cart.updated_at) / 60).floor, 0].max
    return 4 if minutes < @setting.delay_minutes.to_i
    return 18 if minutes.between?(60, 360)

    [minutes / 30, 16].min
  end

  def customer_profile_score(customer, value_score)
    return 6 unless customer

    bonus = value_score >= 80 ? 18 : value_score >= 55 ? 12 : value_score >= 30 ? 8 : 4
    bonus += 4 if customer.total_orders.to_i.zero?
    bonus
  end

  def timing_score
    local = @now.in_time_zone(@company.timezone.presence || "America/Sao_Paulo")
    score = 4
    score += 4 if local.hour.between?(11, 14) || local.hour.between?(18, 22)
    score += 2 if local.friday? || local.saturday? || local.sunday?
    score
  end

  def reputation_penalty(reputation)
    penalty = reputation[:ignored].to_i * 10
    penalty += 20 if reputation[:paused]
    penalty += 5 if reputation[:failed].to_i >= 2
    penalty
  end

  def decision(kind, reason, rule)
    { kind: kind, reason: reason, rule: rule }
  end

  def conversion_rate(scope)
    total = scope.count
    return 0.0 if total.zero?

    ((scope.where(status: "recovered").count.to_f / total) * 100).round(1)
  end

  def normalize_phone(phone)
    value = phone.to_s.gsub(/\D/, "")
    return "" if value.blank?

    value.start_with?("55") ? value : "55#{value}"
  end

  def money(cents)
    ActionController::Base.helpers.number_to_currency(cents.to_i / 100.0, unit: "R$ ", separator: ",", delimiter: ".")
  end
end
