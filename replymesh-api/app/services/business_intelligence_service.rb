# frozen_string_literal: true

class BusinessIntelligenceService
  CACHE_GROUP = :business_intelligence
  CACHE_ENDPOINT = :summary
  CACHE_TTL = 60.seconds
  CURRENT_WINDOW = 7.days
  PREVIOUS_WINDOW = 14.days

  CATEGORIES = {
    sales: "Vendas",
    recovery: "Recovery",
    products: "Produtos",
    categories: "Categorias",
    financial: "Financeiro",
    customers: "Clientes",
    delivery: "Delivery",
    marketing: "Marketing",
    ai: "IA",
    performance: "Performance",
    stock: "Estoque"
  }.freeze

  PRIORITIES = {
    low: "Baixa",
    medium: "Media",
    high: "Alta",
    critical: "Critica"
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
    context = CompanyContextBuilder.build(company)
    coach = safe_hash { SalesCoachLearningService.call(company: company, now: now) }
    recovery_learning = safe_hash { SalesRecoveryLearningEngine.new(company: company, now: now).insights }
    brain = safe_hash { ReplymeshBrainService.call(company: company, now: now) }
    data = operational_data(context, coach, recovery_learning, brain)
    insights = build_insights(data, context, coach, recovery_learning, brain)
    score = business_score(data, insights)
    health = health_for(score)

    {
      summary: summary(score, health, insights, data),
      business_score: score,
      health: health,
      insights: insights,
      opportunities: insights.select { |item| item[:type] == "opportunity" }.first(8),
      warnings: insights.select { |item| item[:type] == "warning" }.first(8),
      recommendations: insights.select { |item| item[:type] == "recommendation" }.first(8),
      top_products: data[:top_products],
      worst_products: data[:worst_products],
      best_categories: data[:best_categories],
      worst_categories: data[:worst_categories],
      best_time: data[:best_time],
      best_day: data[:best_day],
      recovery_analysis: recovery_analysis(data, recovery_learning),
      coupon_analysis: coupon_analysis(data, recovery_learning),
      delivery_analysis: delivery_analysis(context),
      customer_analysis: customer_analysis(data),
      replymesh_brain: brain_summary(brain),
      performance_analysis: performance_analysis,
      generated_at: now.iso8601,
      source: "business_intelligence_service"
    }
  rescue StandardError => e
    Rails.logger.warn("[BusinessIntelligenceService] fallback company=#{company&.id}: #{e.class} #{e.message}")
    fallback_payload(e)
  end

  def operational_data(context, coach, recovery_learning, brain)
    current_orders = orders_in(current_range)
    previous_orders = orders_in(previous_range)
    valid_current = current_orders.where.not(status: "cancelled")
    valid_previous = previous_orders.where.not(status: "cancelled")
    completed_current = valid_current.where(status: "completed")
    completed_previous = valid_previous.where(status: "completed")
    revenue_current = completed_current.sum(:total_cents).to_i
    revenue_previous = completed_previous.sum(:total_cents).to_i
    count_current = valid_current.count
    count_previous = valid_previous.count
    avg_current = average_ticket(completed_current)
    avg_previous = average_ticket(completed_previous)
    product_rows = product_rows(valid_current)
    category_rows = category_rows(valid_current)
    previous_product_rows = product_rows(valid_previous)
    previous_category_rows = category_rows(valid_previous)

    {
      context: context,
      coach: coach,
      recovery_learning: recovery_learning,
      replymesh_brain: brain,
      revenue_current: revenue_current,
      revenue_previous: revenue_previous,
      revenue_change_percent: percentage_change(revenue_current, revenue_previous),
      count_current: count_current,
      count_previous: count_previous,
      order_change_percent: percentage_change(count_current, count_previous),
      avg_current: avg_current,
      avg_previous: avg_previous,
      avg_change_percent: percentage_change(avg_current, avg_previous),
      new_customers: company.customers.where(created_at: current_range).count,
      recurring_customers: company.customers.where(is_recurring: true).count,
      product_rows: product_rows,
      previous_product_rows: previous_product_rows,
      category_rows: category_rows,
      previous_category_rows: previous_category_rows,
      top_products: product_rows.first(5),
      worst_products: worst_products_from(context, product_rows),
      best_categories: category_rows.first(5),
      worst_categories: worst_categories_from(previous_category_rows, category_rows),
      best_time: best_time(valid_current),
      best_day: best_day(valid_current),
      low_stock: Array(context[:stock_alerts]),
      coach_summary: coach[:summary] || {},
      coach_insights: Array(coach[:insights]),
      recovery_events: company.sales_recovery_events.where(created_at: current_range)
    }
  end

  def build_insights(data, context, coach, recovery_learning, brain)
    rows = []
    rows << revenue_insight(data)
    rows << ticket_insight(data)
    rows << order_volume_insight(data)
    rows << top_product_insight(data)
    rows << low_product_insight(data)
    rows << category_insight(data)
    rows << recovery_insight(data, recovery_learning)
    rows << coupon_insight(recovery_learning)
    rows << stock_insight(data)
    rows << best_time_insight(data)
    rows << customer_insight(data)
    rows << coach_insight(coach)
    rows << brain_insight(brain)

    rows.compact
        .sort_by { |item| [-priority_weight(item[:priority_key]), -item[:confidence].to_i, item[:title].to_s] }
        .first(20)
  end

  def revenue_insight(data)
    change = data[:revenue_change_percent].to_f
    return if change.abs < 8 && data[:revenue_current].positive?

    if change.negative?
      insight(
        type: :warning,
        category: :sales,
        priority: change <= -25 ? :high : :medium,
        title: "Movimento abaixo da media recente",
        explanation: "O faturamento dos ultimos 7 dias esta #{change.abs.round(1)}% abaixo do periodo anterior.",
        action: "Revisar produtos em destaque e criar uma oferta leve nos horarios de maior movimento.",
        impact_cents: [data[:revenue_previous] - data[:revenue_current], 0].max,
        confidence: confidence_from_volume(data[:count_current] + data[:count_previous]),
        origin: "orders"
      )
    else
      insight(
        type: :opportunity,
        category: :sales,
        priority: :low,
        title: "Vendas em crescimento",
        explanation: "O faturamento cresceu #{change.round(1)}% comparado ao periodo anterior.",
        action: "Manter a vitrine atual e reforcar os produtos que puxaram esse crescimento.",
        impact_cents: data[:revenue_current],
        confidence: confidence_from_volume(data[:count_current] + data[:count_previous]),
        origin: "orders"
      )
    end
  end

  def ticket_insight(data)
    change = data[:avg_change_percent].to_f
    return if change.abs < 8 || data[:avg_previous].zero?

    insight(
      type: change.negative? ? :warning : :opportunity,
      category: :financial,
      priority: change.negative? ? :medium : :low,
      title: change.negative? ? "Ticket medio caiu" : "Ticket medio subiu",
      explanation: "O ticket medio mudou #{change.round(1)}% no periodo analisado.",
      action: change.negative? ? "Sugerir bebidas, adicionais e combos no atendimento." : "Identificar quais combos aumentaram o ticket e repetir a estrategia.",
      impact_cents: ([data[:avg_previous] - data[:avg_current], 0].max * [data[:count_current], 1].max).to_i,
      confidence: confidence_from_volume(data[:count_current] + data[:count_previous]),
      origin: "orders"
    )
  end

  def order_volume_insight(data)
    change = data[:order_change_percent].to_f
    return if change.abs < 12 || data[:count_previous].zero?

    insight(
      type: change.negative? ? :warning : :opportunity,
      category: :sales,
      priority: change <= -25 ? :high : :medium,
      title: change.negative? ? "Quantidade de pedidos caiu" : "Quantidade de pedidos subiu",
      explanation: "O volume de pedidos mudou #{change.round(1)}% nos ultimos 7 dias.",
      action: change.negative? ? "Verificar horario, cardapio e campanhas pausadas." : "Aproveitar o momento para destacar produtos campeoes.",
      impact_cents: 0,
      confidence: confidence_from_volume(data[:count_current] + data[:count_previous]),
      origin: "orders"
    )
  end

  def top_product_insight(data)
    product = data[:top_products].first
    return unless product

    insight(
      type: :opportunity,
      category: :products,
      priority: :low,
      title: "#{product[:name]} esta puxando vendas",
      explanation: "Esse produto liderou o periodo com #{product[:quantity]} unidade(s) vendida(s).",
      action: "Criar combo, sugerir bebida ou destacar esse item na vitrine.",
      impact_cents: product[:total_cents].to_i,
      confidence: confidence_from_volume(product[:quantity]),
      origin: "order_items"
    )
  end

  def low_product_insight(data)
    product = data[:worst_products].first
    return unless product

    insight(
      type: :recommendation,
      category: :products,
      priority: :medium,
      title: "#{product[:name]} precisa de atencao",
      explanation: "Produto ativo com pouca ou nenhuma venda recente.",
      action: "Revisar foto, nome, preco, descricao ou remover da vitrine se nao fizer sentido.",
      impact_cents: product[:price_cents].to_i,
      confidence: 70,
      origin: "company_context"
    )
  end

  def category_insight(data)
    category = data[:best_categories].first
    return unless category

    insight(
      type: :opportunity,
      category: :categories,
      priority: :low,
      title: "Categoria #{category[:name]} em alta",
      explanation: "Essa categoria concentrou #{category[:quantity]} item(ns) vendidos no periodo.",
      action: "Usar essa categoria em banner, cupom ou campanha de horario.",
      impact_cents: category[:total_cents].to_i,
      confidence: confidence_from_volume(category[:quantity]),
      origin: "categories"
    )
  end

  def recovery_insight(data, recovery_learning)
    events = data[:recovery_events]
    sent = events.where(status: %w[sent recovered]).count
    recovered = events.where(status: "recovered").count
    return if sent.zero?

    conversion = percent(recovered, sent)
    insight(
      type: conversion >= 20 ? :opportunity : :warning,
      category: :recovery,
      priority: conversion >= 20 ? :medium : :high,
      title: conversion >= 20 ? "Recovery com boa conversao" : "Recovery precisa melhorar",
      explanation: "A taxa de recuperacao atual esta em #{conversion.round(1)}%.",
      action: conversion >= 20 ? "Manter estrategia e observar melhores horarios." : "Testar mensagens e beneficios com base no Learning Engine.",
      impact_cents: events.where(status: "recovered").sum(:recovered_value_cents).to_i,
      confidence: confidence_from_volume(sent),
      origin: "sales_recovery_events"
    )
  end

  def coupon_insight(recovery_learning)
    coupon = recovery_learning[:best_coupon] || recovery_learning["best_coupon"]
    return unless coupon && coupon[:sent].to_i.positive?

    insight(
      type: :recommendation,
      category: :marketing,
      priority: :medium,
      title: "Cupom campeao identificado",
      explanation: "#{coupon[:label]} converteu #{coupon[:rate_percent]}% nas recuperacoes analisadas.",
      action: "Usar esse beneficio como referencia antes de criar descontos maiores.",
      impact_cents: 0,
      confidence: confidence_from_volume(coupon[:sent]),
      origin: "sales_recovery_learning"
    )
  end

  def stock_insight(data)
    return if data[:low_stock].blank?

    insight(
      type: :warning,
      category: :stock,
      priority: data[:low_stock].size >= 3 ? :high : :medium,
      title: "Estoque pode afetar vendas",
      explanation: "#{data[:low_stock].size} item(ns) aparecem com alerta de estoque.",
      action: "Repor itens antes dos horarios de pico para evitar perda de venda.",
      impact_cents: 0,
      confidence: 90,
      origin: "inventory_items"
    )
  end

  def best_time_insight(data)
    time = data[:best_time]
    return unless time

    insight(
      type: :recommendation,
      category: :sales,
      priority: :low,
      title: "Melhor horario: #{time[:label]}",
      explanation: "Esse horario concentrou mais pedidos no periodo.",
      action: "Programar destaque, cupom ou campanha perto desse horario.",
      impact_cents: time[:total_cents].to_i,
      confidence: confidence_from_volume(time[:orders]),
      origin: "orders"
    )
  end

  def customer_insight(data)
    return if data[:new_customers].zero?

    insight(
      type: :opportunity,
      category: :customers,
      priority: :low,
      title: "Novos clientes entrando",
      explanation: "#{data[:new_customers]} novo(s) cliente(s) entraram no periodo.",
      action: "Criar incentivo de segunda compra para transformar novos clientes em recorrentes.",
      impact_cents: 0,
      confidence: 80,
      origin: "customers"
    )
  end

  def coach_insight(coach)
    summary = coach[:summary] || {}
    count = summary[:insights_count].to_i
    return if count.zero?

    insight(
      type: :recommendation,
      category: :marketing,
      priority: :medium,
      title: "Consultor encontrou #{count} recomendacao(oes)",
      explanation: "O consultor de vendas ja analisou oportunidades especificas da loja.",
      action: summary[:biggest_opportunity].presence || "Abrir o consultor de vendas e revisar as principais acoes sugeridas.",
      impact_cents: summary[:estimated_impact_cents].to_i,
      confidence: 75,
      origin: "sales_coach_learning"
    )
  end

  def brain_insight(brain)
    top = Array(brain[:top_strategies] || brain["top_strategies"]).first || {}
    return unless top && top[:sample_size].to_i.positive?

    insight(
      type: :recommendation,
      category: :marketing,
      priority: :medium,
      title: "Cerebro Replymesh identificou um padrao",
      explanation: "#{top[:dimension_value]} converteu #{(top[:conversion_rate].to_f * 100).round(1)}% nas recuperacoes analisadas.",
      action: "Usar esse padrao como referencia nas proximas campanhas, sem aplicar automaticamente.",
      impact_cents: top[:estimated_value_cents].to_i,
      confidence: confidence_from_volume(top[:sample_size]),
      origin: "replymesh_brain"
    )
  end

  def insight(type:, category:, priority:, title:, explanation:, action:, impact_cents:, confidence:, origin:)
    stable_id = Digest::SHA256.hexdigest([company.id, title, category, origin].join("|")).first(16)
    {
      id: stable_id,
      type: type.to_s,
      categoria: CATEGORIES.fetch(category),
      category: CATEGORIES.fetch(category),
      category_key: category.to_s,
      prioridade: PRIORITIES.fetch(priority),
      priority: PRIORITIES.fetch(priority),
      priority_key: priority.to_s,
      impacto: impact_cents.positive? ? money(impact_cents) : "Operacional",
      impact: impact_cents.positive? ? money(impact_cents) : "Operacional",
      estimated_value_cents: impact_cents.to_i,
      confianca: confidence.to_i.clamp(0, 100),
      confidence: confidence.to_i.clamp(0, 100),
      titulo: title,
      title: title,
      explicacao: explanation,
      explanation: explanation,
      acao_sugerida: action,
      suggested_action: action,
      origem: origin,
      origin: origin,
      status: "novo",
      created_at: now.iso8601
    }
  end

  def business_score(data, insights)
    revenue_score = data[:revenue_change_percent].to_f.clamp(-50, 50) + 50
    ticket_score = data[:avg_change_percent].to_f.clamp(-40, 40) + 50
    order_score = data[:order_change_percent].to_f.clamp(-40, 40) + 50
    recovery_rate = recovery_analysis(data, data[:recovery_learning])[:rate_percent].to_f
    stock_penalty = [data[:low_stock].size * 4, 25].min
    critical_penalty = insights.count { |item| item[:priority_key].in?(%w[critical high]) } * 5

    ((revenue_score * 0.28) + (ticket_score * 0.18) + (order_score * 0.18) + (recovery_rate * 0.16) + 25 - stock_penalty - critical_penalty + 20).round.clamp(0, 100)
  end

  def health_for(score)
    label =
      if score >= 90 then "Excelente"
      elsif score >= 75 then "Muito Bom"
      elsif score >= 60 then "Bom"
      elsif score >= 40 then "Atencao"
      else "Critico"
      end

    { label: label, score: score, status: score >= 60 ? "healthy" : score >= 40 ? "attention" : "critical" }
  end

  def summary(score, health, insights, data)
    {
      business_score: score,
      health: health,
      health_label: health[:label],
      headline: insights.find { |item| item[:type] == "opportunity" }&.dig(:title) || health[:label] || "Aguardando mais dados",
      insights_count: insights.size,
      opportunities_count: insights.count { |item| item[:type] == "opportunity" },
      warnings_count: insights.count { |item| item[:type] == "warning" },
      recommendations_count: insights.count { |item| item[:type] == "recommendation" },
      biggest_opportunity: insights.find { |item| item[:type] == "opportunity" }&.dig(:title) || "Aguardando mais dados",
      biggest_risk: insights.find { |item| item[:type] == "warning" }&.dig(:title) || "Nenhum gargalo critico detectado",
      estimated_impact_cents: insights.sum { |item| item[:estimated_value_cents].to_i },
      estimated_impact: money(insights.sum { |item| item[:estimated_value_cents].to_i }),
      revenue_change_percent: data[:revenue_change_percent],
      average_ticket_change_percent: data[:avg_change_percent],
      generated_at: now.iso8601
    }
  end

  def recovery_analysis(data, recovery_learning)
    events = data[:recovery_events]
    sent = events.where(status: %w[sent recovered]).count
    recovered = events.where(status: "recovered").count
    {
      sent: sent,
      recovered: recovered,
      rate_percent: percent(recovered, sent),
      recovered_value_cents: events.where(status: "recovered").sum(:recovered_value_cents).to_i,
      best_hour: recovery_learning[:best_hour] || recovery_learning["best_hour"],
      best_template: recovery_learning[:best_template] || recovery_learning["best_template"]
    }
  end

  def coupon_analysis(_data, recovery_learning)
    {
      best_coupon: recovery_learning[:best_coupon] || recovery_learning["best_coupon"],
      best_benefit: recovery_learning[:best_benefit] || recovery_learning["best_benefit"]
    }
  end

  def delivery_analysis(context)
    delivery = context[:delivery] || {}
    {
      enabled: delivery[:enabled],
      pickup_enabled: delivery[:pickup_enabled],
      zones_count: Array(delivery[:zones]).size,
      estimated_minutes: delivery[:estimated_minutes]
    }
  end

  def customer_analysis(data)
    {
      new_customers: data[:new_customers],
      recurring_customers: data[:recurring_customers]
    }
  end

  def brain_summary(brain)
    top = Array(brain[:top_strategies] || brain["top_strategies"]).first || {}

    {
      status: Array(brain[:knowledge] || brain["knowledge"]).any? ? "ativo" : "coletando_dados",
      scope: brain[:scope] || brain["scope"],
      melhor_padrao: top[:dimension_value] || top["dimension_value"] || "Aguardando dados",
      dimensao: top[:dimension] || top["dimension"],
      conversao: top.present? ? "#{((top[:conversion_rate] || top["conversion_rate"]).to_f * 100).round(1)}%" : "0.0%",
      amostras: (top[:sample_size] || top["sample_size"]).to_i,
      generated_at: brain[:generated_at] || brain["generated_at"]
    }
  end

  def performance_analysis
    monitor = safe_hash { PerformanceMonitorService.summary } if defined?(PerformanceMonitorService)
    {
      status: monitor.present? ? "monitorado" : "sem_dados",
      average_response_ms: monitor&.dig(:api, :average_ms),
      slow_queries: Array(monitor&.dig(:sql, :top_slow_queries)).size
    }
  rescue StandardError
    { status: "indisponivel" }
  end

  def fallback_payload(error)
    {
      summary: { business_score: 0, health: { label: "Aguardando dados", status: "attention" }, error: error.message },
      business_score: 0,
      health: { label: "Aguardando dados", score: 0, status: "attention" },
      insights: [],
      opportunities: [],
      warnings: [],
      recommendations: [],
      top_products: [],
      worst_products: [],
      best_categories: [],
      worst_categories: [],
      best_time: nil,
      best_day: nil,
      recovery_analysis: {},
      coupon_analysis: {},
      delivery_analysis: {},
      customer_analysis: {},
      performance_analysis: {},
      generated_at: now.iso8601,
      source: "business_intelligence_service"
    }
  end

  def current_range = CURRENT_WINDOW.ago(now)..now
  def previous_range = PREVIOUS_WINDOW.ago(now)...CURRENT_WINDOW.ago(now)
  def orders_in(range) = company.orders.includes(:customer, order_items: %i[product]).where(created_at: range)

  def average_ticket(scope)
    count = scope.count
    count.zero? ? 0 : (scope.sum(:total_cents).to_i / count)
  end

  def product_rows(orders)
    OrderItem
      .joins(:order)
      .left_joins(product: :category)
      .where(orders: { id: orders.select(:id) })
      .where.not(order_items: { status: "cancelled" })
      .group("order_items.product_id", "order_items.product_name", "categories.name")
      .select("order_items.product_id", "order_items.product_name AS name", "categories.name AS category", "SUM(order_items.quantity) AS quantity", "SUM(order_items.total_price_cents) AS total_cents")
      .map { |row| { product_id: row.product_id, name: row.name, category: row.category, quantity: row.quantity.to_i, total_cents: row.total_cents.to_i } }
      .sort_by { |row| [-row[:quantity], -row[:total_cents]] }
  end

  def category_rows(orders)
    OrderItem
      .joins(:order)
      .left_joins(product: :category)
      .where(orders: { id: orders.select(:id) })
      .where.not(order_items: { status: "cancelled" })
      .group("categories.name")
      .select("COALESCE(categories.name, 'Sem categoria') AS name", "SUM(order_items.quantity) AS quantity", "SUM(order_items.total_price_cents) AS total_cents")
      .map { |row| { name: row.name, quantity: row.quantity.to_i, total_cents: row.total_cents.to_i } }
      .sort_by { |row| [-row[:quantity], -row[:total_cents]] }
  end

  def worst_products_from(context, sold_rows)
    sold_ids = sold_rows.map { |row| row[:product_id] }.compact
    Array(context[:products]).select { |item| item[:id].present? && !sold_ids.include?(item[:id]) }.first(5)
  end

  def worst_categories_from(previous_rows, current_rows)
    previous_rows.filter_map do |previous|
      current = current_rows.find { |row| row[:name] == previous[:name] }
      next if current && current[:quantity].to_i >= previous[:quantity].to_i

      { name: previous[:name], previous_quantity: previous[:quantity].to_i, current_quantity: current&.dig(:quantity).to_i }
    end.first(5)
  end

  def best_time(orders)
    row = orders.where.not(status: "cancelled")
                .group(Arel.sql("EXTRACT(HOUR FROM created_at)"))
                .select("EXTRACT(HOUR FROM created_at) AS hour", "COUNT(*) AS orders_count", "SUM(total_cents) AS total_cents")
                .sort_by { |item| [-item.orders_count.to_i, -item.total_cents.to_i] }
                .first
    return unless row

    { hour: row.hour.to_i, label: "#{row.hour.to_i.to_s.rjust(2, '0')}h", orders: row.orders_count.to_i, total_cents: row.total_cents.to_i }
  end

  def best_day(orders)
    day = orders.where.not(status: "cancelled").group(Arel.sql("EXTRACT(DOW FROM created_at)")).count.max_by { |_key, value| value }
    return unless day

    labels = %w[Domingo Segunda Terca Quarta Quinta Sexta Sabado]
    { day: day[0].to_i, label: labels[day[0].to_i] || day[0].to_s, orders: day[1].to_i }
  end

  def safe_hash
    result = yield
    result.respond_to?(:deep_symbolize_keys) ? result.deep_symbolize_keys : result.to_h.deep_symbolize_keys
  rescue StandardError => e
    Rails.logger.warn("[BusinessIntelligenceService] optional source skipped: #{e.class} #{e.message}")
    {}
  end

  def percentage_change(current, previous)
    return 0.0 if current.to_i.zero? && previous.to_i.zero?
    return 100.0 if previous.to_i.zero?

    (((current.to_f - previous.to_f) / previous.to_f) * 100).round(1)
  end

  def percent(part, total)
    return 0.0 if total.to_i.zero?

    ((part.to_f / total.to_f) * 100).round(1)
  end

  def confidence_from_volume(volume)
    [[55 + (volume.to_i * 4), 95].min, 55].max
  end

  def priority_weight(priority)
    { "critical" => 4, "high" => 3, "medium" => 2, "low" => 1 }.fetch(priority.to_s, 0)
  end

  def money(cents)
    ActionController::Base.helpers.number_to_currency(cents.to_i / 100.0, unit: "R$ ", separator: ",", delimiter: ".")
  end
end
