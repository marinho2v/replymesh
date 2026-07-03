# frozen_string_literal: true

class ReplymeshBrainService
  CACHE_GROUP = :replymesh_brain
  CACHE_ENDPOINT = :knowledge
  CACHE_TTL = 5.minutes
  WINDOW = 90.days

  class << self
    def call(company: nil, now: Time.current)
      new(company: company, now: now).call
    end

    def refresh!(company: nil, now: Time.current)
      new(company: company, now: now).refresh!
    end
  end

  def initialize(company: nil, now: Time.current)
    @company = company
    @now = now
  end

  def call
    ReplymeshCacheService.fetch(
      company: company || "global",
      group: CACHE_GROUP,
      endpoint: CACHE_ENDPOINT,
      expires_in: CACHE_TTL,
      extra: { scope: company.present? ? "company" : "global" }
    ) { build_payload }
  end

  def refresh!
    rows = knowledge_rows
    rows.each { |attrs| upsert_knowledge!(attrs) }
    ReplymeshCacheService.invalidate_company(company || "global", groups: [CACHE_GROUP])
    build_payload(rows)
  end

  private

  attr_reader :company, :now

  def build_payload(rows = nil)
    started_at = monotonic_time
    rows ||= knowledge_rows
    best = rows.sort_by { |item| [-item[:conversion_rate].to_f, -item[:sample_size].to_i] }

    payload = {
      generated_at: now.iso8601,
      scope: company.present? ? "company" : "global",
      company_id: company&.id,
      segment: company_segment(company),
      knowledge: rows,
      insights: insight_sentences(best.first(8)),
      top_strategies: best.first(5),
      source: "replymesh_brain_service"
    }

    track_metrics(payload, started_at)
    payload
  end

  def knowledge_rows
    events = recovery_scope
    rows = []
    rows.concat(strategy_rows(events))
    rows.concat(time_rows(events))
    rows.concat(weekday_rows(events))
    rows.concat(segment_rows(events))
    rows.concat(category_rows(events))
    rows.compact.select { |row| row[:sample_size].to_i.positive? }
  end

  def recovery_scope
    scope = SalesRecoveryEvent.where(created_at: WINDOW.ago(now)..now)
    scope = scope.where(company_id: company.id) if company.present?
    scope.where(status: %w[sent recovered ignored skipped failed])
  end

  def strategy_rows(events)
    group_counts(events, :benefit_decision).map do |strategy, grouped|
      metric_row(
        metric_key: "recovery_conversion",
        dimension: "benefit",
        dimension_value: strategy.presence || "none",
        events: grouped
      )
    end
  end

  def time_rows(events)
    rows = events.where.not(sent_at: nil)
      .group(Arel.sql("EXTRACT(HOUR FROM sent_at)"))
      .pluck(Arel.sql("EXTRACT(HOUR FROM sent_at)"), Arel.sql("COUNT(*)"), Arel.sql("SUM(CASE WHEN status = 'recovered' THEN 1 ELSE 0 END)"), Arel.sql("SUM(recovered_value_cents)"))

    rows.map do |hour, total, recovered, value|
      metric_row_from_counts(
        metric_key: "recovery_conversion",
        dimension: "hour",
        dimension_value: "#{hour.to_i.to_s.rjust(2, '0')}:00",
        sample_size: total,
        success_count: recovered,
        estimated_value_cents: value
      )
    end
  end

  def weekday_rows(events)
    rows = events.where.not(sent_at: nil)
      .group(Arel.sql("EXTRACT(DOW FROM sent_at)"))
      .pluck(Arel.sql("EXTRACT(DOW FROM sent_at)"), Arel.sql("COUNT(*)"), Arel.sql("SUM(CASE WHEN status = 'recovered' THEN 1 ELSE 0 END)"), Arel.sql("SUM(recovered_value_cents)"))

    rows.map do |day, total, recovered, value|
      metric_row_from_counts(
        metric_key: "recovery_conversion",
        dimension: "weekday",
        dimension_value: weekday_name(day.to_i),
        sample_size: total,
        success_count: recovered,
        estimated_value_cents: value
      )
    end
  end

  def segment_rows(events)
    group_counts(events, :customer_segment).map do |segment, grouped|
      metric_row(
        metric_key: "recovery_conversion",
        dimension: "customer_segment",
        dimension_value: segment.presence || "unknown",
        events: grouped
      )
    end
  end

  def category_rows(events)
    grouped = Hash.new { |hash, key| hash[key] = [] }
    events.find_each(batch_size: 500) do |event|
      primary_category_from(event).then { |category| grouped[category] << event }
    end

    grouped.map do |category, rows|
      metric_row(
        metric_key: "recovery_conversion",
        dimension: "category",
        dimension_value: category,
        events: rows
      )
    end
  end

  def group_counts(scope, field)
    ids_by_value = scope.group(field).pluck(field, Arel.sql("array_agg(id)"))
    ids_by_value.to_h.transform_values { |ids| SalesRecoveryEvent.where(id: ids) }
  end

  def metric_row(metric_key:, dimension:, dimension_value:, events:)
    total = events.respond_to?(:count) ? events.count : events.size
    recovered = events.respond_to?(:where) ? events.where(status: "recovered").count : events.count { |event| event.status == "recovered" }
    value = events.respond_to?(:where) ? events.where(status: "recovered").sum(:recovered_value_cents) : events.select { |event| event.status == "recovered" }.sum(&:recovered_value_cents)

    metric_row_from_counts(
      metric_key: metric_key,
      dimension: dimension,
      dimension_value: dimension_value,
      sample_size: total,
      success_count: recovered,
      estimated_value_cents: value
    )
  end

  def metric_row_from_counts(metric_key:, dimension:, dimension_value:, sample_size:, success_count:, estimated_value_cents:)
    total = sample_size.to_i
    recovered = success_count.to_i

    {
      scope: company.present? ? "company" : "global",
      company_id: company&.id,
      segment: company_segment(company),
      metric_key: metric_key,
      dimension: dimension,
      dimension_value: dimension_value.to_s,
      sample_size: total,
      success_count: recovered,
      conversion_rate: total.positive? ? (recovered.to_f / total) : 0.0,
      estimated_value_cents: estimated_value_cents.to_i,
      calculated_at: now.iso8601
    }
  end

  def upsert_knowledge!(attrs)
    record = ReplymeshBrainKnowledge.find_or_initialize_by(
      scope: attrs[:scope],
      company_id: attrs[:company_id],
      segment: attrs[:segment],
      metric_key: attrs[:metric_key],
      dimension: attrs[:dimension],
      dimension_value: attrs[:dimension_value]
    )
    record.assign_attributes(attrs.except(:company_id).merge(company: company, calculated_at: now))
    record.save!
  end

  def primary_category_from(event)
    snapshot = event.cart_snapshot.is_a?(Hash) ? event.cart_snapshot : {}
    items = Array(snapshot["items"] || snapshot[:items])
    category = items.filter_map { |item| item["category"].presence || item[:category].presence }.first
    category.presence || "Sem categoria"
  rescue StandardError
    "Sem categoria"
  end

  def insight_sentences(rows)
    rows.map do |row|
      {
        title: sentence_title(row),
        description: "#{row[:dimension_value]} converteu #{(row[:conversion_rate].to_f * 100).round(1)}% em #{row[:sample_size]} amostra(s).",
        metric_key: row[:metric_key],
        dimension: row[:dimension],
        confidence: confidence_for(row[:sample_size])
      }
    end
  end

  def sentence_title(row)
    case row[:dimension]
    when "hour"
      "Melhor horario observado: #{row[:dimension_value]}"
    when "weekday"
      "Melhor dia observado: #{row[:dimension_value]}"
    when "benefit"
      "Beneficio com melhor conversao: #{row[:dimension_value]}"
    when "category"
      "Categoria com melhor recuperacao: #{row[:dimension_value]}"
    else
      "Padrao de conversao identificado"
    end
  end

  def confidence_for(sample_size)
    [[sample_size.to_i * 8, 95].min, 20].max
  end

  def weekday_name(day)
    %w[domingo segunda terca quarta quinta sexta sabado][day] || "desconhecido"
  end

  def company_segment(company)
    return nil if company.blank?

    company.store_setting&.business_type.presence || company.metadata_json.to_h["business_type"].presence
  rescue StandardError
    nil
  end

  def track_metrics(payload, started_at)
    return unless defined?(PerformanceMonitorService)

    PerformanceMonitorService.track_request(
      endpoint: "replymesh_brain_service",
      company_id: company&.id || "global",
      duration_ms: elapsed_ms(started_at),
      sql_ms: 0,
      render_ms: 0,
      query_count: 0,
      payload_bytes: payload.to_json.bytesize,
      request_payload_bytes: 0
    )
  rescue StandardError => e
    Rails.logger.warn("[ReplymeshBrainService] metric skipped company=#{company&.id || 'global'}: #{e.class}")
  end

  def monotonic_time
    Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end

  def elapsed_ms(started_at)
    ((monotonic_time - started_at) * 1000).round(2)
  end
end
