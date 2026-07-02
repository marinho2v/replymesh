# frozen_string_literal: true

class SalesCoachLearningService
  CACHE_GROUP = :sales_coach_learning
  CACHE_ENDPOINT = :advisor
  CACHE_TTL = 90.seconds

  class << self
    def call(company:, now: Time.current)
      new(company: company, now: now).call
    end

    def feedback(company:, public_id:, status: nil, result: nil, impact_cents: nil)
      insight = company.sales_coach_insights.find_by!(public_id: public_id)
      insight.mark_status!(status) if status.present?
      insight.mark_feedback!(result, impact_cents: impact_cents) if result.present?
      ReplymeshCacheService.invalidate_company(company, groups: %i[dashboard sales_coach sales_coach_learning])
      insight.as_learning_json
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
    base = SalesCoachService.call(company: company, now: now).deep_symbolize_keys
    persisted = persist_base_insights(Array(base[:insights]))
    insights = decorate_insights(Array(base[:insights]), persisted)
    history = build_history
    learning = build_learning_patterns
    score = coach_score(history, learning)
    advisor = build_advisor(insights, history, learning, score)

    base.merge(
      summary: enhanced_summary(base[:summary] || {}, insights, history, score),
      insights: insights,
      learning_advisor: advisor,
      coach_score: score,
      history: history,
      source: "sales_coach_learning_service"
    )
  end

  def persist_base_insights(insights)
    insights.each_with_object({}) do |item, memo|
      stable_key = stable_key_for(item)
      insight = company.sales_coach_insights.find_or_initialize_by(stable_key: stable_key)
      insight.assign_attributes(
        title: item[:title].to_s.first(255),
        description: item[:description].to_s,
        category: item[:category].to_s.presence || "Geral",
        priority: item[:priority].to_s.presence || "Baixa",
        estimated_value_cents: item[:estimated_value_cents].to_i,
        confidence: item[:confidence].to_i,
        reason: reason_for(item),
        origin: item[:origin].to_s.first(255),
        suggested_action: item[:suggested_action].to_s,
        generated_at: item[:date].presence || now,
        metadata_json: metadata_for(item)
      )
      insight.save! if insight.changed?
      memo[stable_key] = insight
    end
  end

  def decorate_insights(insights, persisted)
    insights.map do |item|
      stable_key = stable_key_for(item)
      record = persisted[stable_key] || company.sales_coach_insights.find_by(stable_key: stable_key)
      decorated = item.merge(
        id: record&.public_id,
        status: record&.status || "new",
        feedback_result: record&.feedback_result,
        feedback_impact_cents: (record&.feedback_impact_cents || 0).to_i,
        reason: record&.reason || reason_for(item),
        titulo: item[:title],
        descricao: item[:description],
        categoria: item[:category],
        prioridade: item[:priority],
        impacto_estimado: item[:impact],
        confianca: item[:confidence],
        motivo: record&.reason || reason_for(item),
        origem: item[:origin],
        data: item[:date]
      )
      decorated
    end
  end

  def build_history
    scope = company.sales_coach_insights
    recent = scope.recent.limit(8).map(&:as_learning_json)
    accepted = scope.accepted.count
    ignored = scope.ignored.count
    worked = scope.worked.count
    failed = scope.where(feedback_result: "not_worked").count

    {
      total_insights: scope.count,
      new_insights: scope.where(status: "new").count,
      viewed: scope.where(status: "viewed").count,
      accepted: accepted,
      ignored: ignored,
      archived: scope.where(status: "archived").count,
      manual_executed: scope.where(status: "manual_executed").count,
      worked: worked,
      not_worked: failed,
      accepted_rate_percent: percent(accepted, [accepted + ignored, 1].max),
      worked_rate_percent: percent(worked, [worked + failed, 1].max),
      estimated_impact_cents: scope.sum(:estimated_value_cents),
      feedback_impact_cents: scope.sum(:feedback_impact_cents),
      last_insights: recent
    }
  end

  def build_learning_patterns
    scope = company.sales_coach_insights
    accepted = scope.where(status: %w[accepted manual_executed]).or(scope.where(feedback_result: "worked"))
    {
      favorite_categories: ranked_hash(accepted.group(:category).count),
      favorite_priorities: ranked_hash(accepted.group(:priority).count),
      most_accepted_recommendation: accepted.group(:title).count.max_by { |_title, count| count }&.then { |title, count| { title: title, count: count } },
      best_origins: ranked_hash(accepted.group(:origin).count),
      best_hours: ranked_hash(scope.where.not(accepted_at: nil).group(Arel.sql("EXTRACT(HOUR FROM accepted_at)")).count).map { |row| row.merge(label: "#{row[:key].to_i}h") },
      discount_learning: recovery_discount_learning,
      products_learning: products_learning,
      recovery_learning: SalesRecoveryLearningEngine.new(company: company, now: now).insights
    }
  end

  def build_advisor(insights, history, learning, score)
    top = insights.first
    risk = insights.find { |item| item[:priority_key].to_s.in?(%w[critical high]) }
    gain = insights.max_by { |item| item[:estimated_value_cents].to_i }
    most_accepted = learning[:most_accepted_recommendation]
    opportunities = insights.first(4).map { |item| item[:title] }

    {
      greeting: "Oi! Analisei os dados recentes da loja e separei os pontos mais importantes para voce agir com seguranca.",
      coach_score: score,
      opportunities: opportunities,
      top_opportunity: top&.dig(:title) || "Aguardando mais dados para recomendar com precisao",
      biggest_risk: risk&.dig(:title) || "Nenhum risco critico detectado agora",
      biggest_gain: gain&.dig(:title) || "Sem ganho estimado no momento",
      last_recommendation: history[:last_insights].first,
      most_accepted_recommendation: most_accepted,
      next_best_action: top&.dig(:suggested_action) || "Continue registrando pedidos e feedbacks para o coach aprender.",
      status: score >= 70 ? "aprendendo bem" : "coletando dados"
    }
  end

  def enhanced_summary(summary, insights, history, score)
    estimated = insights.sum { |item| item[:estimated_value_cents].to_i }
    (summary || {}).merge(
      coach_score: score,
      learning_status: score >= 70 ? "Aprendizado ativo" : "Coletando feedback",
      accepted_recommendations: history[:accepted],
      ignored_recommendations: history[:ignored],
      worked_recommendations: history[:worked],
      estimated_impact_cents: estimated,
      estimated_impact: money(estimated)
    )
  end

  def stable_key_for(item)
    raw = [item[:origin], item[:category], item[:priority], item[:title], item[:suggested_action]].join("|")
    Digest::SHA256.hexdigest(raw).first(20)
  end

  def reason_for(item)
    [
      item[:description],
      item[:suggested_action].present? ? "Acao sugerida: #{item[:suggested_action]}" : nil
    ].compact.join(" ")
  end

  def metadata_for(item)
    {
      impact_label: item[:impact],
      priority_key: item[:priority_key],
      executable: item[:executable] == true
    }
  end

  def coach_score(history, learning)
    total_orders = company.orders.where("created_at >= ?", 30.days.ago).where.not(status: "cancelled").count
    feedbacks = history[:accepted].to_i + history[:ignored].to_i + history[:worked].to_i + history[:not_worked].to_i
    recovery_events = company.sales_recovery_events.where("created_at >= ?", 30.days.ago).count
    category_learning = Array(learning[:favorite_categories]).size
    [
      20,
      total_orders * 2,
      recovery_events,
      feedbacks * 8,
      category_learning * 5,
      history[:worked].to_i * 10
    ].sum.clamp(0, 100)
  end

  def recovery_discount_learning
    events = company.sales_recovery_events.where(status: "recovered").where("created_at >= ?", 60.days.ago)
    grouped = events.group(:benefit_decision).count
    ranked_hash(grouped)
  rescue StandardError
    []
  end

  def products_learning
    rows = company.order_items
      .joins(:order)
      .where(orders: { company_id: company.id })
      .where("orders.created_at >= ?", 30.days.ago)
      .group(:product_name)
      .sum(:quantity)
    {
      always_sell: ranked_hash(rows).first(5),
      never_sell: company.products.active.limit(50).pluck(:name).reject { |name| rows.key?(name) }.first(5)
    }
  rescue StandardError
    { always_sell: [], never_sell: [] }
  end

  def ranked_hash(hash)
    hash.to_h.map { |key, value| { key: key, count: value.to_i } }.sort_by { |row| -row[:count] }.first(8)
  end

  def percent(part, total)
    return 0.0 if total.to_i.zero?

    ((part.to_f / total.to_f) * 100).round(1)
  end

  def money(cents)
    ActionController::Base.helpers.number_to_currency(cents.to_i / 100.0, unit: "R$ ", separator: ",", delimiter: ".")
  end
end
