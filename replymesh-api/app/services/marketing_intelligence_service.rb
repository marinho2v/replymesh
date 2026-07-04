# frozen_string_literal: true

class MarketingIntelligenceService
  CACHE_GROUP = :marketing_intelligence
  CACHE_ENDPOINT = :summary
  CACHE_TTL = 5.minutes

  CAMPAIGN_TYPES = [
    "Cupom",
    "Frete gratis",
    "Combo",
    "Brinde",
    "Cashback",
    "Lembrete simples",
    "Destaque de produto"
  ].freeze

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
    sources = load_sources
    recommendations = build_recommendations(sources)
    summary = build_summary(sources, recommendations)

    {
      generated_at: now.iso8601,
      summary: summary,
      recommendations: recommendations.first(8),
      campaign_options: campaign_options(summary, sources),
      product_opportunities: product_opportunities(sources),
      category_opportunities: category_opportunities(sources),
      customer_segments: customer_segments(sources),
      commercial_calendar: commercial_calendar(summary, sources),
      quick_insights: quick_insights(summary, recommendations, sources),
      source_summary: source_summary(sources),
      source: "marketing_intelligence_service"
    }
  rescue StandardError => e
    Rails.logger.warn("[MarketingIntelligenceService] fallback company=#{company&.id}: #{e.class} #{e.message}")
    fallback_payload(e)
  end

  def load_sources
    {
      replymesh_brain: safe_hash { ReplymeshBrainService.call(company: company, now: now) },
      strategy: safe_hash { ReplymeshStrategyService.call(company: company, now: now) },
      customer_intelligence: safe_hash { CustomerIntelligenceService.call(company: company, now: now) },
      product_intelligence: safe_hash { ProductIntelligenceService.call(company: company, now: now) },
      sales_coach: safe_hash { SalesCoachService.call(company: company, now: now) },
      business_intelligence: safe_hash { BusinessIntelligenceService.call(company: company, now: now) },
      recovery_learning: safe_hash { SalesRecoveryLearningEngine.new(company: company, now: now).insights }
    }
  end

  def build_summary(sources, recommendations)
    product = product_summary(sources)
    customer = customer_summary(sources)
    business = business_summary(sources)
    recovery = recovery_summary(sources)
    brain = brain_summary(sources)
    top_recommendation = recommendations.first || {}
    score = marketing_score(product, customer, business, recovery, recommendations)

    {
      marketing_score: score,
      best_campaign: top_recommendation[:campaign_type] || recommended_campaign_type(sources),
      recommended_campaign: top_recommendation[:title] || "Aguardar mais dados antes de campanha",
      best_day: best_day(sources),
      best_time: best_time(sources),
      best_category: best_category(sources),
      best_product: product[:champion_product] || product[:highest_potential_product] || "Aguardando dados",
      product_to_promote: product_to_promote(sources),
      product_to_protect: product[:champion_product] || "Aguardando dados",
      priority_segment: priority_segment(customer),
      estimated_potential_cents: estimated_potential_cents(sources, top_recommendation),
      conversion_potential: conversion_potential(score),
      confidence: confidence_for(score, sources),
      risk_level: risk_level(customer, business, recommendations),
      recommendation_reason: top_recommendation[:reason] || brain[:best_pattern] || "Dados comerciais ainda em formacao."
    }
  end

  def build_recommendations(sources)
    rows = []
    product = product_summary(sources)
    customer = customer_summary(sources)
    business = business_summary(sources)
    strategy = sources[:strategy]
    recovery = recovery_summary(sources)

    if customer[:at_risk_customers].to_i.positive?
      rows << recommendation(
        title: "Recuperar clientes em risco",
        description: "#{customer[:at_risk_customers]} cliente(s) apresentam risco comercial. Priorize uma acao leve antes de oferecer desconto agressivo.",
        campaign_type: customer[:vip_customers].to_i.positive? ? "Lembrete simples" : "Cupom",
        priority: customer[:at_risk_customers].to_i >= 10 ? "Alta" : "Media",
        confidence: bounded(55 + customer[:average_customer_score].to_i / 2),
        estimated_value_cents: business[:estimated_impact_cents].to_i,
        reason: "Base de clientes com risco de abandono."
      )
    end

    if product[:growing_product].present?
      rows << recommendation(
        title: "Destacar #{product[:growing_product]}",
        description: "Produto em crescimento pode receber destaque sem mexer em preco.",
        campaign_type: "Destaque de produto",
        priority: "Media",
        confidence: 72,
        estimated_value_cents: 0,
        reason: "Produto com tendencia positiva na inteligencia de produtos."
      )
    end

    if product[:forgotten_product].present?
      rows << recommendation(
        title: "Testar campanha para #{product[:forgotten_product]}",
        description: "Produto ativo com baixa procura. Use promocao pequena apenas se fizer sentido operacional.",
        campaign_type: "Cupom",
        priority: "Baixa",
        confidence: 58,
        estimated_value_cents: 0,
        reason: "Produto esquecido detectado."
      )
    end

    best_bundle = product[:best_bundle]
    if best_bundle.present?
      rows << recommendation(
        title: "Criar oferta de combo",
        description: "#{best_bundle[:label]} aparece como combinacao forte em pedidos recentes.",
        campaign_type: "Combo",
        priority: "Media",
        confidence: bounded(60 + best_bundle[:percent].to_f / 3),
        estimated_value_cents: best_bundle[:revenue_cents].to_i,
        reason: "Produtos vendidos juntos com recorrencia."
      )
    end

    top_strategy = Array(strategy[:priorities] || strategy[:recommendations]).find { |item| item[:category].to_s.downcase.include?("marketing") || item[:origin].to_s.downcase.include?("marketing") }
    if top_strategy.present?
      rows << recommendation(
        title: top_strategy[:title] || "Acompanhar oportunidade de marketing",
        description: top_strategy[:description] || top_strategy[:suggested_action] || "A estrategia atual indicou uma oportunidade comercial.",
        campaign_type: recommended_campaign_type(sources),
        priority: top_strategy[:priority] || "Media",
        confidence: top_strategy[:confidence].to_i.positive? ? top_strategy[:confidence].to_i : 65,
        estimated_value_cents: top_strategy[:impact_cents].to_i,
        reason: "Prioridade consolidada pela Visao Estrategica."
      )
    end

    if recovery[:best_strategy].present?
      rows << recommendation(
        title: "Usar aprendizado do Recovery",
        description: "#{recovery[:best_strategy]} tem melhor historico de recuperacao no periodo.",
        campaign_type: recovery[:best_strategy].to_s.include?("frete") ? "Frete gratis" : "Lembrete simples",
        priority: "Media",
        confidence: recovery[:conversion_rate].to_f.positive? ? bounded((recovery[:conversion_rate].to_f * 100).round) : 55,
        estimated_value_cents: recovery[:estimated_value_cents].to_i,
        reason: "Padrao encontrado no aprendizado de recuperacao."
      )
    end

    rows = rows.sort_by { |item| [-priority_weight(item[:priority]), -item[:confidence].to_i, -item[:estimated_value_cents].to_i] }
    rows.presence || [wait_for_data_recommendation]
  end

  def recommendation(title:, description:, campaign_type:, priority:, confidence:, estimated_value_cents:, reason:)
    {
      title: title,
      description: description,
      campaign_type: campaign_type,
      priority: priority,
      confidence: bounded(confidence),
      estimated_value_cents: estimated_value_cents.to_i,
      potential_label: money(estimated_value_cents),
      reason: reason,
      executable: false
    }
  end

  def wait_for_data_recommendation
    recommendation(
      title: "Aguardar mais dados antes de campanha",
      description: "Ainda nao ha volume suficiente para recomendar cupom, combo ou frete gratis com seguranca.",
      campaign_type: "Lembrete simples",
      priority: "Baixa",
      confidence: 45,
      estimated_value_cents: 0,
      reason: "Amostra comercial insuficiente."
    )
  end

  def campaign_options(summary, sources)
    CAMPAIGN_TYPES.map do |type|
      {
        label: type,
        recommended: summary[:best_campaign] == type,
        risk: campaign_risk(type, sources),
        reason: campaign_reason(type, summary)
      }
    end
  end

  def product_opportunities(sources)
    product_payload = sources[:product_intelligence]
    rows = []
    Array(product_payload[:growing_products]).first(4).each do |item|
      rows << product_row(item, "Produto em crescimento")
    end
    Array(product_payload[:forgotten_products]).first(4).each do |item|
      rows << product_row(item, "Produto esquecido")
    end
    Array(product_payload[:star_products]).first(4).each do |item|
      rows << product_row(item, "Produto forte")
    end
    rows.uniq { |item| item[:label] }.first(8)
  end

  def product_row(item, reason)
    {
      label: item[:label],
      category: item[:category],
      score: item[:product_score],
      trend: item[:trend],
      potential: item[:potential],
      reason: reason
    }
  end

  def category_opportunities(sources)
    business = sources[:business_intelligence]
    rows = Array(business[:best_categories] || business.dig(:summary, :best_categories)).first(6)
    rows.map do |item|
      item = normalize_hash(item)
      {
        label: item[:label] || item[:category] || item[:name],
        value_cents: item[:value_cents] || item[:revenue_cents],
        quantity: item[:quantity],
        reason: "Categoria com tracao comercial recente"
      }
    end.compact
  end

  def customer_segments(sources)
    customer = customer_summary(sources)
    [
      { label: "VIP", count: customer[:vip_customers].to_i, priority: customer[:vip_customers].to_i.positive? },
      { label: "Em risco", count: customer[:at_risk_customers].to_i, priority: customer[:at_risk_customers].to_i.positive? },
      { label: "Recorrentes", count: customer[:recurring_customers].to_i, priority: false },
      { label: "Novos", count: customer[:new_customers].to_i, priority: false }
    ]
  end

  def commercial_calendar(summary, _sources)
    [
      { label: "Melhor dia", value: summary[:best_day], action: "Planejar campanha para este dia" },
      { label: "Melhor horario", value: summary[:best_time], action: "Agendar comunicacao no horario de maior chance" },
      { label: "Campanha recomendada", value: summary[:best_campaign], action: "Preparar campanha, sem disparo automatico" }
    ]
  end

  def quick_insights(summary, recommendations, sources)
    insights = []
    insights << "Marketing Score atual: #{summary[:marketing_score]}/100."
    insights << "Melhor campanha sugerida: #{summary[:best_campaign]}."
    insights << "Produto com melhor oportunidade: #{summary[:product_to_promote]}." if summary[:product_to_promote].present?
    insights << "Segmento prioritario: #{summary[:priority_segment]}." if summary[:priority_segment].present?
    insights.concat(Array(sources.dig(:replymesh_brain, :insights)).first(2))
    insights.concat(recommendations.first(2).map { |item| item[:description] })
    insights.compact_blank.uniq.first(6)
  end

  def source_summary(sources)
    {
      replymesh_brain: source_available?(sources[:replymesh_brain]),
      strategy: source_available?(sources[:strategy]),
      customer_intelligence: source_available?(sources[:customer_intelligence]),
      product_intelligence: source_available?(sources[:product_intelligence]),
      sales_coach: source_available?(sources[:sales_coach]),
      business_intelligence: source_available?(sources[:business_intelligence]),
      recovery_learning: source_available?(sources[:recovery_learning])
    }
  end

  def source_available?(payload)
    payload.present? && payload[:error].blank?
  end

  def marketing_score(product, customer, business, recovery, recommendations)
    values = [
      product[:average_product_score],
      customer[:average_customer_score],
      business[:business_score] || business[:score],
      recovery[:conversion_rate].to_f.positive? ? recovery[:conversion_rate].to_f * 100 : nil,
      recommendations.first&.dig(:confidence)
    ].compact.map(&:to_f)
    return 45 if values.blank?

    bounded((values.sum / values.size).round)
  end

  def recommended_campaign_type(sources)
    product = product_summary(sources)
    customer = customer_summary(sources)
    return "Combo" if product[:best_bundle].present?
    return "Lembrete simples" if customer[:vip_customers].to_i.positive?
    return "Cupom" if customer[:at_risk_customers].to_i.positive?
    return "Destaque de produto" if product[:growing_product].present?

    "Lembrete simples"
  end

  def best_day(sources)
    brain = Array(sources.dig(:replymesh_brain, :top_strategies)).find { |item| item[:dimension] == "weekday" }
    return brain[:dimension_value] if brain.present?

    product = Array(sources.dig(:product_intelligence, :products)).find { |item| item[:best_day].present? && item[:best_day] != "Sem dados" }
    product&.dig(:best_day) || sources.dig(:business_intelligence, :best_day, :label) || "Aguardando dados"
  end

  def best_time(sources)
    brain = Array(sources.dig(:replymesh_brain, :top_strategies)).find { |item| item[:dimension] == "hour" }
    return brain[:dimension_value] if brain.present?

    product = Array(sources.dig(:product_intelligence, :products)).find { |item| item[:best_period].present? && item[:best_period] != "Sem dados" }
    product&.dig(:best_period) || sources.dig(:business_intelligence, :best_time, :label) || "Aguardando dados"
  end

  def best_category(sources)
    category = category_opportunities(sources).first
    return category[:label] if category.present?

    Array(sources.dig(:customer_intelligence, :favorite_categories)).first&.dig(:label) || "Aguardando dados"
  end

  def product_to_promote(sources)
    product = product_summary(sources)
    product[:growing_product] || product[:highest_potential_product] || product[:forgotten_product] || product[:champion_product] || "Aguardando dados"
  end

  def priority_segment(customer)
    return "Clientes em risco" if customer[:at_risk_customers].to_i.positive?
    return "Clientes VIP" if customer[:vip_customers].to_i.positive?
    return "Clientes recorrentes" if customer[:recurring_customers].to_i.positive?
    return "Clientes novos" if customer[:new_customers].to_i.positive?

    "Aguardando dados"
  end

  def estimated_potential_cents(sources, recommendation)
    values = [
      recommendation[:estimated_value_cents],
      sources.dig(:strategy, :summary, :estimated_impact_cents),
      sources.dig(:sales_coach, :summary, :estimated_impact_cents),
      sources.dig(:business_intelligence, :summary, :estimated_impact_cents)
    ].compact.map(&:to_i)
    values.max || 0
  end

  def conversion_potential(score)
    return "Muito Alto" if score >= 80
    return "Alto" if score >= 65
    return "Medio" if score >= 45

    "Baixo"
  end

  def confidence_for(score, sources)
    available = source_summary(sources).values.count(true)
    bounded((score * 0.65) + (available * 6))
  end

  def risk_level(customer, business, recommendations)
    return "Alto" if customer[:at_risk_customers].to_i >= 10
    return "Medio" if recommendations.any? { |item| item[:priority].in?(%w[Alta Critica]) }
    return "Medio" if business[:health_label].to_s.downcase.include?("aten")

    "Baixo"
  end

  def campaign_risk(type, sources)
    customer = customer_summary(sources)
    return "Medio" if type.in?(["Cupom", "Cashback", "Frete gratis"]) && customer[:vip_customers].to_i.positive?
    return "Baixo" if type.in?(["Lembrete simples", "Destaque de produto"])

    "Medio"
  end

  def campaign_reason(type, summary)
    case type
    when summary[:best_campaign]
      "Melhor encaixe para o snapshot atual."
    when "Lembrete simples"
      "Boa opcao quando nao ha motivo forte para desconto."
    when "Combo"
      "Funciona melhor quando produtos vendidos juntos aparecem com frequencia."
    else
      "Usar apenas quando os dados indicarem oportunidade clara."
    end
  end

  def priority_weight(value)
    { "Critica" => 4, "Alta" => 3, "Media" => 2, "Baixa" => 1 }.fetch(value.to_s, 1)
  end

  def product_summary(sources)
    normalize_hash(sources.dig(:product_intelligence, :summary))
  end

  def customer_summary(sources)
    normalize_hash(sources.dig(:customer_intelligence, :summary))
  end

  def business_summary(sources)
    normalize_hash(sources.dig(:business_intelligence, :summary)).merge(
      business_score: sources.dig(:business_intelligence, :business_score)
    )
  end

  def recovery_summary(sources)
    learning = sources[:recovery_learning]
    best = normalize_hash(learning[:best_strategy])
    {
      best_strategy: best[:label] || best[:dimension_value],
      conversion_rate: best[:conversion_rate] || learning[:overall_conversion_rate],
      estimated_value_cents: best[:estimated_value_cents] || learning[:recovered_value_cents]
    }
  end

  def brain_summary(sources)
    top = normalize_hash(Array(sources.dig(:replymesh_brain, :top_strategies)).first)
    {
      best_pattern: top[:dimension_value],
      conversion_rate: top[:conversion_rate],
      sample_size: top[:sample_size]
    }
  end

  def safe_hash
    result = yield
    normalize_hash(result)
  rescue StandardError => e
    Rails.logger.warn("[MarketingIntelligenceService] optional source skipped company=#{company&.id}: #{e.class} #{e.message}")
    {}
  end

  def normalize_hash(value)
    return {} if value.blank?
    return value.deep_symbolize_keys if value.respond_to?(:deep_symbolize_keys)

    value.to_h.deep_symbolize_keys
  rescue StandardError
    {}
  end

  def bounded(value)
    [[value.to_f.round, 0].max, 100].min
  end

  def money(cents)
    ActionController::Base.helpers.number_to_currency(cents.to_i / 100.0, unit: "R$ ", separator: ",", delimiter: ".")
  end

  def fallback_payload(error)
    {
      generated_at: now.iso8601,
      summary: {
        marketing_score: 0,
        best_campaign: "Lembrete simples",
        recommended_campaign: "Aguardar mais dados antes de campanha",
        best_day: "Aguardando dados",
        best_time: "Aguardando dados",
        best_category: "Aguardando dados",
        best_product: "Aguardando dados",
        product_to_promote: "Aguardando dados",
        product_to_protect: "Aguardando dados",
        priority_segment: "Aguardando dados",
        estimated_potential_cents: 0,
        conversion_potential: "Baixo",
        confidence: 0,
        risk_level: "Baixo",
        recommendation_reason: "Nao foi possivel calcular agora."
      },
      recommendations: [wait_for_data_recommendation],
      campaign_options: [],
      product_opportunities: [],
      category_opportunities: [],
      customer_segments: [],
      commercial_calendar: [],
      quick_insights: ["Nao foi possivel calcular a inteligencia de marketing agora."],
      error: error.message,
      source: "marketing_intelligence_service"
    }
  end
end
