class SalesRecoveryIntelligence
  CUSTOMER_PAUSE_THRESHOLD = 3
  CUSTOMER_REPUTATION_WINDOW = 90.days
  LOW_CART_CENTS = 4_000
  HIGH_CART_CENTS = 10_000
  FREE_DELIVERY_CART_CENTS = 15_000
  AUTO_SEND_MIN_SCORE = 70
  DEFAULT_SCORE_WEIGHTS = {
    "tempo_parado" => 1.0,
    "valor_carrinho" => 1.0,
    "quantidade_itens" => 1.0,
    "perfil_cliente" => 1.0,
    "recencia_cliente" => 1.0,
    "conversa" => 1.0,
    "origem_atendimento" => 1.0,
    "produto" => 1.0,
    "uso_cupom" => 1.0,
    "reputacao" => 1.0,
    "horario" => 1.0
  }.freeze

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
    recovery_analysis(cart, customer, customer_value: customer_value)[:score]
  end

  def recovery_analysis(cart, customer, customer_value:)
    reputation = customer_value[:reputation] || reputation(customer: customer, phone: cart.customer_phone)
    conversation = conversation_profile(cart)
    product = product_profile(cart)
    weights = score_weights
    factors = []

    add_factor(factors, "valor_carrinho", "Valor do carrinho", cart_value_score(cart.total_cents.to_i), weights, reason_for_cart_value(cart.total_cents.to_i))
    add_factor(factors, "quantidade_itens", "Quantidade de itens", item_count_score(cart), weights, "#{cart_items_count(cart)} item(ns) no carrinho")
    add_factor(factors, "tempo_parado", "Tempo parado", abandoned_time_score(cart), weights, "Carrinho parado ha #{abandoned_minutes(cart)} minuto(s)")
    add_factor(factors, "perfil_cliente", "Perfil do cliente", customer_profile_score(customer, customer_value[:score].to_i), weights, customer_value[:label])
    add_factor(factors, "recencia_cliente", "Ultima compra", customer_recency_score(customer), weights, customer_recency_reason(customer))
    add_factor(factors, "conversa", "Conversa", conversation_score(conversation), weights, conversation[:reason])
    add_factor(factors, "origem_atendimento", "Origem", channel_score(conversation[:channel]), weights, "Origem: #{conversation[:channel] || 'desconhecida'}")
    add_factor(factors, "produto", "Produto", product_score(product), weights, product[:reason])
    add_factor(factors, "uso_cupom", "Uso anterior de cupom", coupon_usage_score(customer), weights, coupon_usage_reason(customer))
    add_factor(factors, "horario", "Horario e dia", timing_score, weights, timing_reason)

    reputation_points = -reputation_penalty(reputation)
    add_factor(factors, "reputacao", "Reputacao", reputation_points, weights, reputation_reason(reputation))

    score = factors.sum { |factor| factor[:weighted_points] }.round.clamp(0, 100)
    {
      score: score,
      classification: classification_for(score),
      auto_sendable: auto_sendable?(score),
      reasons: score_reasons(factors),
      factors: factors,
      weights: weights,
      product_categories: product[:categories],
      top_category: product[:categories].first,
      conversation: conversation
    }
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

  def classification_for(score)
    value = score.to_i
    return "Muito Alta" if value >= 85
    return "Alta" if value >= 70
    return "Media" if value >= 45
    return "Baixa" if value >= 25

    "Muito Baixa"
  end

  def auto_sendable?(score)
    score.to_i >= AUTO_SEND_MIN_SCORE
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

  def score_weights
    configured = @setting.metadata_json.to_h["score_weights"].presence ||
      @setting.coupon_rules_json.to_h["score_weights"].presence || {}
    DEFAULT_SCORE_WEIGHTS.merge(configured.to_h.transform_values { |value| value.to_f.clamp(0.0, 3.0) })
  end

  def add_factor(factors, key, label, points, weights, reason)
    weight = weights[key].presence || 1.0
    factors << {
      key: key,
      label: label,
      points: points.to_i,
      weight: weight.to_f,
      weighted_points: (points.to_f * weight.to_f).round(1),
      reason: reason
    }
  end

  def score_reasons(factors)
    positives = factors.select { |factor| factor[:weighted_points].positive? }
      .sort_by { |factor| -factor[:weighted_points] }
      .first(5)
      .map { |factor| factor[:reason] }
    negatives = factors.select { |factor| factor[:weighted_points].negative? }
      .sort_by { |factor| factor[:weighted_points] }
      .first(2)
      .map { |factor| factor[:reason] }
    (positives + negatives).compact_blank
  end

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

  def reason_for_cart_value(cents)
    return "Carrinho alto" if cents >= FREE_DELIVERY_CART_CENTS
    return "Carrinho medio" if cents >= LOW_CART_CENTS

    "Carrinho baixo"
  end

  def item_count_score(cart)
    count = Array(cart.items).sum { |item| item["quantity"].to_i.nonzero? || 1 }
    [count * 7, 21].min
  end

  def cart_items_count(cart)
    Array(cart.items).sum { |item| item["quantity"].to_i.nonzero? || 1 }
  end

  def abandoned_time_score(cart)
    minutes = [((@now - cart.updated_at) / 60).floor, 0].max
    return 4 if minutes < @setting.delay_minutes.to_i
    return 18 if minutes.between?(60, 360)

    [minutes / 30, 16].min
  end

  def abandoned_minutes(cart)
    [((@now - cart.updated_at) / 60).floor, 0].max
  end

  def customer_profile_score(customer, value_score)
    return 6 unless customer

    bonus = value_score >= 80 ? 18 : value_score >= 55 ? 12 : value_score >= 30 ? 8 : 4
    bonus += 4 if customer.total_orders.to_i.zero?
    bonus
  end

  def customer_recency_score(customer)
    return 2 unless customer&.last_order_at

    recency_score(((@now - customer.last_order_at) / 1.day).floor)
  end

  def customer_recency_reason(customer)
    return "Cliente ainda sem compra anterior" unless customer&.last_order_at

    days = [((@now - customer.last_order_at) / 1.day).floor, 0].max
    "Ultima compra ha #{days} dia(s)"
  end

  def conversation_profile(cart)
    conversation = cart.store_ai_conversation
    return { channel: nil, messages_count: 0, user_messages_count: 0, total_minutes: 0, reason: "Sem conversa registrada" } unless conversation

    messages = conversation.store_ai_messages
    first_message_at = messages.minimum(:created_at)
    last_message_at = conversation.last_message_at || messages.maximum(:created_at) || conversation.updated_at
    total_minutes = first_message_at ? [((last_message_at - first_message_at) / 60).floor, 0].max : 0
    user_messages = messages.where(role: "user").count
    {
      channel: conversation.channel,
      messages_count: messages.count,
      user_messages_count: user_messages,
      total_minutes: total_minutes,
      reason: "#{user_messages} mensagem(ns) do cliente em #{total_minutes} minuto(s)"
    }
  rescue StandardError
    { channel: nil, messages_count: 0, user_messages_count: 0, total_minutes: 0, reason: "Conversa indisponivel" }
  end

  def conversation_score(profile)
    score = [profile[:user_messages_count].to_i * 2, 8].min
    score += [profile[:total_minutes].to_i / 5, 6].min
    score
  end

  def channel_score(channel)
    case channel
    when "whatsapp" then 6
    when "web" then 4
    else 2
    end
  end

  def product_profile(cart)
    ids = Array(cart.items).filter_map { |item| item["product_id"].presence || item["id"].presence }.map(&:to_i).uniq
    products = ids.any? ? @company.products.includes(:category).where(id: ids).to_a : []
    categories = products.filter_map { |product| product.category&.name }.uniq
    premium = products.any? { |product| product.is_featured? || product.price_cents.to_i >= HIGH_CART_CENTS }
    promotional = products.any?(&:is_promotional?)
    {
      premium: premium,
      promotional: promotional,
      categories: categories,
      reason: product_reason(premium, promotional, categories)
    }
  rescue StandardError
    { premium: false, promotional: false, categories: [], reason: "Produto sem metrica adicional" }
  end

  def product_score(profile)
    score = 0
    score += 8 if profile[:premium]
    score += 5 if profile[:promotional]
    score += 3 if profile[:categories].present?
    score
  end

  def product_reason(premium, promotional, categories)
    return "Produto premium em #{categories.first}" if premium && categories.present?
    return "Produto promocional" if promotional
    return "Categoria #{categories.first}" if categories.present?

    "Produto sem categoria identificada"
  end

  def coupon_usage_score(customer)
    return 2 unless customer

    orders = customer.total_orders.to_i
    return 4 if orders.zero?

    coupon_orders = customer.orders.where.not(coupon_id: nil).or(customer.orders.where.not(coupon_code: [nil, ""])).count
    ratio = coupon_orders.to_f / orders
    return -4 if ratio >= 0.7
    return 2 if ratio.positive?

    5
  end

  def coupon_usage_reason(customer)
    return "Cliente novo sem historico de cupom" unless customer

    orders = customer.total_orders.to_i
    coupon_orders = orders.positive? ? customer.orders.where.not(coupon_id: nil).or(customer.orders.where.not(coupon_code: [nil, ""])).count : 0
    "Uso anterior de cupom: #{coupon_orders} pedido(s)"
  end

  def timing_score
    local = @now.in_time_zone(@company.timezone.presence || "America/Sao_Paulo")
    score = 4
    score += 4 if local.hour.between?(11, 14) || local.hour.between?(18, 22)
    score += 2 if local.friday? || local.saturday? || local.sunday?
    score
  end

  def timing_reason
    local = @now.in_time_zone(@company.timezone.presence || "America/Sao_Paulo")
    "Abandono em #{local.strftime('%H:%M')} no dia #{local.wday}"
  end

  def reputation_penalty(reputation)
    penalty = reputation[:ignored].to_i * 10
    penalty += 20 if reputation[:paused]
    penalty += 5 if reputation[:failed].to_i >= 2
    penalty
  end

  def reputation_reason(reputation)
    return "Cliente pausado por ignorar recuperacoes" if reputation[:paused]
    return "#{reputation[:ignored]} recuperacao(oes) ignorada(s)" if reputation[:ignored].to_i.positive?
    return "Cliente costuma voltar apos mensagem" if reputation[:recovered].to_i.positive?

    "Sem historico negativo de recuperacao"
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
