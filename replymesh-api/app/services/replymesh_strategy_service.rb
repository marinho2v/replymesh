# frozen_string_literal: true

require "digest"

class ReplymeshStrategyService
  CACHE_GROUP = :replymesh_strategy
  CACHE_ENDPOINT = :summary
  CACHE_TTL = 5.minutes

  PRIORITY_LABELS = {
    critical: "Critica",
    high: "Alta",
    medium: "Media",
    low: "Baixa"
  }.freeze

  PRIORITY_WEIGHTS = {
    "Critica" => 4,
    "Alta" => 3,
    "Media" => 2,
    "Baixa" => 1
  }.freeze

  CATEGORY_LABELS = {
    sales: "Vendas",
    recovery: "Recovery",
    products: "Produtos",
    customers: "Clientes",
    financial: "Financeiro",
    delivery: "Delivery",
    marketing: "Marketing",
    ai: "IA",
    performance: "Performance",
    business: "Negocio",
    strategy: "Estrategia"
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
    started_at = monotonic_time
    sources = load_sources
    priorities = consolidate_priorities(sources)
    indicators = build_indicators(sources, priorities)

    payload = {
      generated_at: now.iso8601,
      summary: summary(indicators, priorities),
      executive_summary: executive_summary(priorities, indicators),
      indicators: indicators,
      priorities: priorities.first(8),
      recommendations: priorities.first(8),
      recent_changes: recent_changes(sources, priorities),
      timeline: strategy_timeline(priorities),
      sources: source_summary(sources),
      source: "replymesh_strategy_service"
    }

    track_metrics(payload, started_at)
    payload
  rescue StandardError => e
    Rails.logger.warn("[ReplymeshStrategyService] fallback company=#{company&.id}: #{e.class} #{e.message}")
    fallback_payload(e)
  end

  def load_sources
    {
      sales_coach: safe_hash { SalesCoachService.call(company: company, now: now) },
      business_intelligence: safe_hash { BusinessIntelligenceService.call(company: company, now: now) },
      recovery_intelligence: safe_hash { SalesRecoveryLearningEngine.new(company: company, now: now).insights },
      replymesh_brain: safe_hash { ReplymeshBrainService.call(company: company, now: now) }
    }
  end

  def consolidate_priorities(sources)
    raw = []
    raw.concat(normalize_sales_coach(sources[:sales_coach]))
    raw.concat(normalize_business_intelligence(sources[:business_intelligence]))
    raw.concat(normalize_recovery(sources[:recovery_intelligence]))
    raw.concat(normalize_brain(sources[:replymesh_brain]))

    grouped = raw.compact.group_by { |item| strategic_bucket(item) }
    grouped.map { |_, items| merge_priority(items) }
      .sort_by { |item| [-priority_weight(item[:priority]), -item[:impact_cents].to_i, -item[:confidence].to_i, item[:title].to_s] }
  end

  def normalize_sales_coach(payload)
    Array(payload[:insights]).map do |item|
      recommendation_from(
        title: item[:title],
        description: item[:description],
        action: item[:suggested_action] || item[:action],
        priority: item[:priority],
        category: item[:category],
        impact_cents: item[:impact] || item[:impact_cents],
        confidence: item[:confidence],
        origin: "Consultor de Vendas",
        reason: item[:origin]
      )
    end
  end

  def normalize_business_intelligence(payload)
    Array(payload[:insights]).map do |item|
      recommendation_from(
        title: item[:title],
        description: item[:description] || item[:explanation],
        action: item[:suggested_action] || item[:action],
        priority: item[:priority],
        category: item[:category],
        impact_cents: item[:impact_cents] || item[:impact],
        confidence: item[:confidence],
        origin: "Analise do Negocio",
        reason: item[:origin]
      )
    end
  end

  def normalize_recovery(payload)
    items = []
    insights = Array(payload[:insights])
    insights.each do |item|
      items << recommendation_from(
        title: item[:title],
        description: item[:description],
        action: item[:suggestion] || item[:action],
        priority: "Media",
        category: "Recovery",
        impact_cents: item[:estimated_value_cents],
        confidence: confidence_from_rate(item[:conversion_rate]),
        origin: "Recovery Intelligence",
        reason: item[:dimension] || item[:metric_key]
      )
    end

    best_strategy = Array(payload[:top_strategies]).first
    if best_strategy.present?
      items << recommendation_from(
        title: "Recovery possui estrategia campea",
        description: "#{best_strategy[:label] || best_strategy[:dimension_value]} teve melhor desempenho recente.",
        action: "Priorizar esta estrategia nas proximas recuperacoes.",
        priority: "Media",
        category: "Recovery",
        impact_cents: best_strategy[:estimated_value_cents],
        confidence: confidence_from_rate(best_strategy[:conversion_rate]),
        origin: "Recovery Intelligence",
        reason: "learning"
      )
    end

    items
  end

  def normalize_brain(payload)
    Array(payload[:top_strategies]).map do |item|
      recommendation_from(
        title: "Conhecimento da plataforma aponta oportunidade",
        description: "#{item[:dimension_value]} converteu #{percent(item[:conversion_rate])} em #{item[:sample_size].to_i} amostra(s).",
        action: "Comparar esta tendencia com o comportamento da loja antes de executar qualquer acao.",
        priority: item[:sample_size].to_i >= 20 ? "Media" : "Baixa",
        category: "Estrategia",
        impact_cents: item[:estimated_value_cents],
        confidence: confidence_from_rate(item[:conversion_rate]),
        origin: "Cerebro Replymesh",
        reason: "#{item[:dimension]}:#{item[:dimension_value]}"
      )
    end
  end

  def recommendation_from(title:, description:, action:, priority:, category:, impact_cents:, confidence:, origin:, reason:)
    title = title.to_s.strip
    return if title.blank?

    {
      id: stable_id("#{origin}:#{title}:#{reason}"),
      title: title,
      description: description.to_s.presence || "A Replymesh identificou um ponto de atencao nesta area.",
      suggested_action: action.to_s.presence || "Avaliar esta prioridade antes de executar novas campanhas.",
      priority: normalize_priority(priority),
      category: normalize_category(category),
      impact_cents: impact_cents.to_i,
      confidence: [[confidence.to_i, 0].max, 100].min,
      origins: [origin],
      reason: reason.to_s.presence || origin.to_s,
      grouped_count: 1
    }
  end

  def merge_priority(items)
    selected = items.max_by { |item| [priority_weight(item[:priority]), item[:impact_cents].to_i, item[:confidence].to_i] }
    origins = items.flat_map { |item| Array(item[:origins]) }.uniq
    confidence = (items.sum { |item| item[:confidence].to_i }.to_f / [items.size, 1].max).round

    selected.merge(
      origins: origins,
      origin: origins.join(", "),
      confidence: confidence,
      impact_cents: items.map { |item| item[:impact_cents].to_i }.max || 0,
      grouped_count: items.size,
      reason: items.map { |item| item[:reason] }.compact_blank.uniq.first(3).join(" / ")
    )
  end

  def strategic_bucket(item)
    text = [item[:title], item[:description], item[:category], item[:reason]].join(" ").downcase
    return :customers if text.match?(/cliente|recorrent|inativ|vip|novo/)
    return :ticket if text.match?(/ticket|medio|adicional|combo|bebida/)
    return :recovery if text.match?(/recovery|carrinho|recupera|aband/)
    return :products if text.match?(/produto|cardapio|categoria|estoque/)
    return :peak_time if text.match?(/horario|hora|pico|dia|semana/)
    return :financial if text.match?(/fatur|receita|financeiro|venda|pedido/)
    return :performance if text.match?(/performance|lento|cache|sql/)

    item[:category].to_s.parameterize(separator: "_").presence || stable_id(item[:title]).first(12)
  end

  def build_indicators(sources, priorities)
    business_summary = sources.dig(:business_intelligence, :summary) || {}
    coach_summary = sources.dig(:sales_coach, :summary) || {}
    high_count = priorities.count { |item| priority_weight(item[:priority]) >= 3 }
    top_confidence = priorities.first ? priorities.first[:confidence].to_i : 0
    business_score = business_summary[:business_score] || sources[:business_intelligence][:business_score] || 55
    coach_score = coach_summary[:coach_score] || 55
    opportunity = priorities.sum { |item| item[:impact_cents].to_i }.positive? ? 72 : 45
    risk = [[high_count * 22, 100].min, 10].max
    health = [[(business_score.to_i + coach_score.to_i) / 2 - (high_count * 5), 0].max, 100].min
    strategic = [[((health * 0.45) + (opportunity * 0.35) + ((100 - risk) * 0.20)).round, 0].max, 100].min

    {
      strategic_score: strategic,
      operational_health: health,
      sales_opportunity: opportunity,
      risk_level: risk,
      confidence: top_confidence.positive? ? top_confidence : confidence_from_volume(priorities.size)
    }
  end

  def summary(indicators, priorities)
    top = priorities.first || {}
    opportunity = priorities.find { |item| item[:impact_cents].to_i.positive? } || top
    risk = priorities.find { |item| priority_weight(item[:priority]) >= 3 } || top

    {
      strategic_score: indicators[:strategic_score],
      operational_health: indicators[:operational_health],
      sales_opportunity: indicators[:sales_opportunity],
      risk_level: indicators[:risk_level],
      biggest_priority: top[:title] || "Aguardando dados da loja",
      biggest_opportunity: opportunity[:title] || "Aguardando oportunidades",
      biggest_risk: risk[:title] || "Nenhum risco critico detectado",
      confidence: indicators[:confidence],
      last_analysis_at: now.iso8601
    }
  end

  def executive_summary(priorities, indicators)
    return ["Coletar mais dados operacionais antes de priorizar a estrategia."] if priorities.empty?

    items = priorities.first(3).map { |item| item[:title] }
    ["Hoje sua loja deve focar em:"].concat(items.map { |title| "• #{title}" }).concat(["Confianca da analise: #{indicators[:confidence]}%."])
  end

  def recent_changes(_sources, priorities)
    top = priorities.first
    return [{ label: "Hoje", description: "Aguardando novas leituras estrategicas.", priority: "Baixa" }] unless top

    [
      {
        label: "Hoje",
        description: "#{top[:title]} virou a principal prioridade consolidada.",
        priority: top[:priority],
        origins: top[:origins]
      },
      {
        label: "Ultima leitura",
        description: "Estrategia atualizada com Consultor, Analise do Negocio, Recovery e Cerebro Replymesh.",
        priority: "Baixa",
        origins: ["Replymesh Strategy"]
      }
    ]
  end

  def strategy_timeline(priorities)
    priorities.first(5).each_with_index.map do |item, index|
      {
        step: index + 1,
        title: item[:title],
        priority: item[:priority],
        origin: item[:origin],
        updated_at: now.iso8601
      }
    end
  end

  def source_summary(sources)
    {
      sales_coach: {
        available: sources[:sales_coach].present?,
        insights: Array(sources.dig(:sales_coach, :insights)).size
      },
      business_intelligence: {
        available: sources[:business_intelligence].present?,
        insights: Array(sources.dig(:business_intelligence, :insights)).size
      },
      recovery_intelligence: {
        available: sources[:recovery_intelligence].present?,
        insights: Array(sources.dig(:recovery_intelligence, :insights)).size
      },
      replymesh_brain: {
        available: sources[:replymesh_brain].present?,
        insights: Array(sources.dig(:replymesh_brain, :top_strategies)).size
      }
    }
  end

  def normalize_priority(value)
    text = value.to_s.strip
    PRIORITY_LABELS.values.find { |label| label.casecmp?(text) } || PRIORITY_LABELS[value.to_s.downcase.to_sym] || "Baixa"
  end

  def normalize_category(value)
    text = value.to_s.strip
    CATEGORY_LABELS.values.find { |label| label.casecmp?(text) } || CATEGORY_LABELS[value.to_s.downcase.to_sym] || text.presence || "Estrategia"
  end

  def priority_weight(priority)
    PRIORITY_WEIGHTS.fetch(priority.to_s, 1)
  end

  def confidence_from_rate(rate)
    value = rate.to_f
    value *= 100 if value <= 1
    [[value.round, 20].max, 95].min
  end

  def confidence_from_volume(count)
    [[45 + (count.to_i * 6), 55].max, 92].min
  end

  def percent(value)
    "#{(value.to_f * 100).round(1)}%"
  end

  def safe_hash
    yield || {}
  rescue StandardError => e
    Rails.logger.warn("[ReplymeshStrategyService] source skipped company=#{company&.id}: #{e.class} #{e.message}")
    {}
  end

  def fallback_payload(error)
    {
      generated_at: now.iso8601,
      summary: {
        strategic_score: 0,
        operational_health: 0,
        sales_opportunity: 0,
        risk_level: 0,
        biggest_priority: "Estrategia temporariamente indisponivel",
        biggest_opportunity: "Aguardando dados",
        biggest_risk: "Aguardando dados",
        confidence: 0,
        last_analysis_at: now.iso8601
      },
      executive_summary: ["Nao foi possivel consolidar a estrategia agora."],
      indicators: {},
      priorities: [],
      recommendations: [],
      recent_changes: [],
      timeline: [],
      error: error.message,
      source: "replymesh_strategy_service"
    }
  end

  def track_metrics(payload, started_at)
    return unless defined?(PerformanceMonitorService)

    elapsed_ms = ((monotonic_time - started_at) * 1000).round(1)
    PerformanceMonitorService.track_external(
      kind: "replymesh_strategy",
      duration_ms: elapsed_ms,
      success: true,
      company_id: company.id
    )
  rescue StandardError
    nil
  end

  def stable_id(value)
    Digest::SHA256.hexdigest(value.to_s)[0, 16]
  end

  def monotonic_time
    Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end
end
