# frozen_string_literal: true

class SalesCoachService
  CACHE_GROUP = :sales_coach
  CACHE_ENDPOINT = :summary
  CACHE_TTL = 2.minutes
  CURRENT_WINDOW = 7.days
  PREVIOUS_WINDOW = 14.days

  CATEGORIES = {
    sales: "Vendas",
    recovery: "Recovery",
    products: "Produtos",
    customers: "Clientes",
    financial: "Financeiro",
    delivery: "Delivery",
    marketing: "Marketing",
    ai: "IA",
    performance: "Performance"
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
    learning = SalesRecoveryLearningEngine.new(company: company, now: now).insights
    data = operational_data(context, learning)
    insights = build_insights(data, context, learning)

    {
      generated_at: now.iso8601,
      summary: summary_for(insights),
      insights: insights,
      filters: {
        categories: CATEGORIES.values,
        priorities: PRIORITIES.values
      },
      history: [],
      learning_foundation: learning_foundation(learning),
      source: "sales_coach_service"
    }
  end

  def operational_data(context, learning)
    current_orders = orders_in(current_range)
    previous_orders = orders_in(previous_range)
    current_completed = current_orders.where(status: "completed")
    previous_completed = previous_orders.where(status: "completed")
    current_revenue = current_completed.sum(:total_cents)
    previous_revenue = previous_completed.sum(:total_cents)
    current_count = current_orders.where.not(status: "cancelled").count
    previous_count = previous_orders.where.not(status: "cancelled").count
    current_avg = average_ticket(current_completed)
    previous_avg = average_ticket(previous_completed)
    current_recovery = company.sales_recovery_events.where(created_at: current_range)
    previous_recovery = company.sales_recovery_events.where(created_at: previous_range)

    {
      current_orders: current_orders,
      previous_orders: previous_orders,
      current_revenue: current_revenue,
      previous_revenue: previous_revenue,
      current_count: current_count,
      previous_count: previous_count,
      current_avg: current_avg,
      previous_avg: previous_avg,
      new_customers: company.customers.where(created_at: current_range).count,
      recurring_customers: company.customers.where(is_recurring: true).count,
      recovery_current: current_recovery,
      recovery_previous: previous_recovery,
      product_rows: product_rows(current_orders),
      category_rows: category_rows(current_orders),
      hour_rows: hour_rows(current_orders),
      weekday_rows: weekday_rows(current_orders),
      low_stock: Array(context[:stock_alerts]),
      learning: learning
    }
  end

  def build_insights(data, context, learning)
    insights = []
    insights << revenue_insight(data)
    insights << ticket_insight(data)
    insights << recovery_insight(data)
    insights << lost_cart_insight(data)
    insights << product_low_sales_insight(data, context)
    insights << product_high_sales_insight(data)
    insights << category_growth_insight(data)
    insights << beverage_insight(data)
    insights << best_hour_insight(data)
    insights << coupon_learning_insight(learning)
    insights << ai_learning_insight(learning)
    insights << customer_insight(data)
    insights << stock_insight(data)

    insights.compact.sort_by { |item| [-priority_weight(item[:priority]), -item[:impact].to_i, item[:title].to_s] }
  end

  def revenue_insight(data)
    change = percentage_change(data[:current_revenue], data[:previous_revenue])
    return if change.abs < 10 && data[:current_revenue].positive?

    if change.negative?
      insight(
        title: "Vendas abaixo da media recente",
        description: "Nos ultimos 7 dias a loja faturou #{change.abs.round(1)}% abaixo do periodo anterior.",
        category: :sales,
        priority: change <= -25 ? :high : :medium,
        impact: estimated_difference(data[:previous_revenue], data[:current_revenue]),
        confidence: confidence_from_volume(data[:current_count] + data[:previous_count]),
        origin: "orders",
        action: "Revisar produtos em destaque, combos e campanhas de horario de pico."
      )
    else
      insight(
        title: "Vendas em crescimento",
        description: "A loja faturou #{change.round(1)}% acima do periodo anterior.",
        category: :sales,
        priority: :low,
        impact: data[:current_revenue],
        confidence: confidence_from_volume(data[:current_count] + data[:previous_count]),
        origin: "orders",
        action: "Manter o cardapio e reforcar os produtos que puxaram o crescimento."
      )
    end
  end

  def ticket_insight(data)
    change = percentage_change(data[:current_avg], data[:previous_avg])
    return if change.abs < 8 || data[:previous_avg].zero?

    insight(
      title: change.negative? ? "Ticket medio caiu" : "Ticket medio subiu",
      description: "O ticket medio mudou #{change.round(1)}% comparado ao periodo anterior.",
      category: :financial,
      priority: change.negative? ? :medium : :low,
      impact: estimated_difference(data[:previous_avg], data[:current_avg]) * [data[:current_count], 1].max,
      confidence: confidence_from_volume(data[:current_count] + data[:previous_count]),
      origin: "orders",
      action: change.negative? ? "Sugerir adicionais, bebidas e combos no atendimento." : "Identificar quais combos aumentaram o ticket e destacar no cardapio."
    )
  end

  def recovery_insight(data)
    current_sent = data[:recovery_current].where(status: %w[sent recovered]).count
    current_recovered = data[:recovery_current].where(status: "recovered").count
    previous_sent = data[:recovery_previous].where(status: %w[sent recovered]).count
    previous_recovered = data[:recovery_previous].where(status: "recovered").count
    current_rate = rate(current_recovered, current_sent)
    previous_rate = rate(previous_recovered, previous_sent)
    return if current_sent.zero? && previous_sent.zero?

    change = current_rate - previous_rate
    insight(
      title: change.negative? ? "Recovery perdeu eficiencia" : "Recovery performou melhor",
      description: "A taxa atual de recuperacao e #{current_rate.round(1)}%. Periodo anterior: #{previous_rate.round(1)}%.",
      category: :recovery,
      priority: change <= -10 ? :high : :medium,
      impact: data[:recovery_current].where(status: "recovered").sum(:recovered_value_cents),
      confidence: confidence_from_volume(current_sent + previous_sent),
      origin: "sales_recovery_events",
      action: change.negative? ? "Testar novo template e revisar janela de envio." : "Manter a estrategia atual e acompanhar horarios campeoes."
    )
  end

  def lost_cart_insight(data)
    lost = data[:recovery_current].where(status: %w[queued sent skipped failed ignored]).sum(:cart_total_cents)
    return if lost.zero?

    insight(
      title: "Carrinhos com potencial perdido",
      description: "A loja tem aproximadamente #{money(lost)} em carrinhos ainda nao recuperados nos ultimos 7 dias.",
      category: :recovery,
      priority: lost >= 20_000 ? :high : :medium,
      impact: lost,
      confidence: 78,
      origin: "sales_recovery_events",
      action: "Priorizar carrinhos com maior score e evitar insistencia em clientes pausados."
    )
  end

  def product_low_sales_insight(data, context)
    active_products = Array(context[:products])
    return if active_products.size < 3

    sold_ids = data[:product_rows].map { |row| row[:product_id] }.compact.uniq
    product = active_products.find { |item| item[:id].present? && !sold_ids.include?(item[:id]) }
    return unless product

    insight(
      title: "#{product[:name]} vendeu pouco",
      description: "Este produto aparece ativo no cardapio, mas teve pouca ou nenhuma venda recente.",
      category: :products,
      priority: :medium,
      impact: product[:price_cents].to_i,
      confidence: 70,
      origin: "company_context",
      action: "Revisar foto, descricao, preco ou colocar como destaque temporario."
    )
  end

  def product_high_sales_insight(data)
    product = data[:product_rows].first
    return unless product

    insight(
      title: "#{product[:name]} esta puxando vendas",
      description: "Produto com maior volume recente: #{product[:quantity]} unidade(s).",
      category: :products,
      priority: :low,
      impact: product[:total_cents].to_i,
      confidence: confidence_from_volume(product[:quantity].to_i),
      origin: "order_items",
      action: "Criar combo ou sugerir bebida/adicional junto desse produto."
    )
  end

  def category_growth_insight(data)
    category = data[:category_rows].first
    return unless category

    insight(
      title: "Categoria #{category[:name]} em destaque",
      description: "Essa categoria concentrou #{category[:quantity]} item(ns) vendidos no periodo.",
      category: :products,
      priority: :low,
      impact: category[:total_cents].to_i,
      confidence: confidence_from_volume(category[:quantity].to_i),
      origin: "categories",
      action: "Usar essa categoria como vitrine em banner ou campanha."
    )
  end

  def beverage_insight(data)
    drinks = data[:product_rows].select { |row| row[:category].to_s.match?(/bebida|refri|suco|drink/i) || row[:name].to_s.match?(/coca|guarana|suco|agua|refri/i) }
    total_items = data[:product_rows].sum { |row| row[:quantity].to_i }
    drink_items = drinks.sum { |row| row[:quantity].to_i }
    return if total_items.zero? || rate(drink_items, total_items) >= 18

    insight(
      title: "Bebidas podem vender mais",
      description: "Bebidas representaram apenas #{rate(drink_items, total_items).round(1)}% dos itens vendidos.",
      category: :marketing,
      priority: :medium,
      impact: 0,
      confidence: confidence_from_volume(total_items),
      origin: "order_items",
      action: "Adicionar sugestao de bebida no checkout, IA e atendimento manual."
    )
  end

  def best_hour_insight(data)
    hour = data[:hour_rows].first
    return unless hour

    insight(
      title: "Melhor horario: #{hour[:hour].to_s.rjust(2, '0')}h",
      description: "Esse horario concentrou mais pedidos nos ultimos 7 dias.",
      category: :sales,
      priority: :low,
      impact: hour[:total_cents].to_i,
      confidence: confidence_from_volume(hour[:orders].to_i),
      origin: "orders",
      action: "Programar campanha ou destaque perto desse horario."
    )
  end

  def coupon_learning_insight(learning)
    coupon = learning.to_h[:best_coupon] || learning.to_h["best_coupon"]
    return unless coupon && coupon[:sent].to_i.positive?

    insight(
      title: "Cupom campeao: #{coupon[:label]}",
      description: "Essa estrategia converteu #{coupon[:rate_percent]}% nos recoveries analisados.",
      category: :recovery,
      priority: :medium,
      impact: 0,
      confidence: confidence_from_volume(coupon[:sent]),
      origin: "sales_recovery_learning",
      action: "Usar esse beneficio como referencia nos proximos testes."
    )
  end

  def ai_learning_insight(learning)
    ai_rate = learning.to_h[:ai_conversion_percent].to_f
    template_rate = learning.to_h[:template_conversion_percent].to_f
    return if ai_rate.zero? && template_rate.zero?

    insight(
      title: ai_rate >= template_rate ? "IA converte melhor no Recovery" : "Template esta mais estavel",
      description: "IA: #{ai_rate.round(1)}%. Template: #{template_rate.round(1)}%.",
      category: :ai,
      priority: :medium,
      impact: 0,
      confidence: 72,
      origin: "sales_recovery_learning",
      action: ai_rate >= template_rate ? "Manter IA ativa e acompanhar variacoes de mensagem." : "Revisar contexto da IA antes de aumentar automacao."
    )
  end

  def customer_insight(data)
    return if data[:new_customers].zero?

    insight(
      title: "Novos clientes entrando",
      description: "#{data[:new_customers]} novo(s) cliente(s) apareceram nos ultimos 7 dias.",
      category: :customers,
      priority: :low,
      impact: 0,
      confidence: 80,
      origin: "customers",
      action: "Criar campanha de segunda compra ou cupom de retorno."
    )
  end

  def stock_insight(data)
    return if data[:low_stock].blank?

    insight(
      title: "Estoque pode afetar vendas",
      description: "#{data[:low_stock].size} item(ns) estao com alerta de estoque.",
      category: :products,
      priority: data[:low_stock].size >= 3 ? :high : :medium,
      impact: 0,
      confidence: 90,
      origin: "inventory_items",
      action: "Repor itens antes dos horarios de maior venda."
    )
  end

  def insight(title:, description:, category:, priority:, impact:, confidence:, origin:, action:)
    {
      title: title,
      description: description,
      impact: impact_label(impact),
      impact_cents: impact.to_i,
      priority: PRIORITIES.fetch(priority),
      priority_key: priority.to_s,
      category: CATEGORIES.fetch(category),
      confidence: confidence.to_i.clamp(0, 100),
      estimated_value_cents: impact.to_i,
      date: now.iso8601,
      origin: origin,
      suggested_action: action,
      executable: false
    }
  end

  def summary_for(insights)
    top = insights.first
    risk = insights.find { |item| item[:priority_key].in?(%w[critical high]) }
    opportunity = insights.max_by { |item| item[:estimated_value_cents].to_i }

    {
      insights_count: insights.size,
      high_priority_count: insights.count { |item| item[:priority_key].in?(%w[critical high]) },
      top_priority: top&.dig(:priority) || "Baixa",
      biggest_opportunity: opportunity&.dig(:title) || "Aguardando dados",
      biggest_risk: risk&.dig(:title) || "Nenhum risco critico detectado",
      estimated_impact_cents: insights.sum { |item| item[:estimated_value_cents].to_i },
      estimated_impact: money(insights.sum { |item| item[:estimated_value_cents].to_i }),
      last_analysis_at: now.iso8601
    }
  end

  def learning_foundation(learning)
    {
      feedback_ready: true,
      future_fields: %w[suggestion_applied suggestion_ignored sales_after_suggestion revenue_after_suggestion],
      current_learning: learning
    }
  end

  def current_range
    CURRENT_WINDOW.ago(now)..now
  end

  def previous_range
    PREVIOUS_WINDOW.ago(now)...CURRENT_WINDOW.ago(now)
  end

  def orders_in(range)
    company.orders.includes(:customer, order_items: :product).where(created_at: range)
  end

  def average_ticket(scope)
    count = scope.count
    return 0 if count.zero?

    scope.sum(:total_cents) / count
  end

  def product_rows(orders)
    OrderItem
      .joins(:order)
      .left_joins(product: :category)
      .where(orders: { id: orders.select(:id) })
      .where.not(order_items: { status: "cancelled" })
      .group("order_items.product_id", "order_items.product_name", "categories.name")
      .select(
        "order_items.product_id",
        "order_items.product_name AS name",
        "categories.name AS category",
        "SUM(order_items.quantity) AS quantity",
        "SUM(order_items.total_price_cents) AS total_cents"
      )
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

  def hour_rows(orders)
    orders
      .where.not(status: "cancelled")
      .group(Arel.sql("EXTRACT(HOUR FROM created_at)"))
      .select("EXTRACT(HOUR FROM created_at) AS hour", "COUNT(*) AS orders_count", "SUM(total_cents) AS total_cents")
      .map { |row| { hour: row.hour.to_i, orders: row.orders_count.to_i, total_cents: row.total_cents.to_i } }
      .sort_by { |row| [-row[:orders], -row[:total_cents]] }
  end

  def weekday_rows(orders)
    orders
      .where.not(status: "cancelled")
      .group(Arel.sql("EXTRACT(DOW FROM created_at)"))
      .count
      .map { |day, count| { day: day.to_i, orders: count } }
  end

  def percentage_change(current, previous)
    return 0.0 if current.to_i.zero? && previous.to_i.zero?
    return 100.0 if previous.to_i.zero?

    (((current.to_f - previous.to_f) / previous.to_f) * 100).round(1)
  end

  def estimated_difference(previous, current)
    [previous.to_i - current.to_i, 0].max
  end

  def rate(value, total)
    return 0.0 if total.to_i.zero?

    ((value.to_f / total.to_f) * 100).round(1)
  end

  def confidence_from_volume(volume)
    [[55 + (volume.to_i * 4), 95].min, 55].max
  end

  def priority_weight(priority)
    { "Critica" => 4, "Alta" => 3, "Media" => 2, "Baixa" => 1 }.fetch(priority.to_s, 0)
  end

  def impact_label(cents)
    cents.to_i.positive? ? money(cents) : "Operacional"
  end

  def money(cents)
    ActionController::Base.helpers.number_to_currency(cents.to_i / 100.0, unit: "R$ ", separator: ",", delimiter: ".")
  end
end
