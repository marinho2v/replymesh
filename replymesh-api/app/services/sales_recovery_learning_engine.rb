class SalesRecoveryLearningEngine
  WINDOW = 90.days
  MIN_SAMPLE = 1

  def initialize(company:, now: Time.current)
    @company = company
    @now = now
  end

  def insights
    Rails.cache.fetch(cache_key, expires_in: 10.minutes) { build_insights }
  end

  private

  attr_reader :company, :now

  def cache_key
    latest = company.sales_recovery_events.maximum(:updated_at)&.to_i || 0
    "sales_recovery_learning:v1:#{company.id}:#{latest}"
  end

  def build_insights
    events = learning_events.to_a
    sent = events.select { |event| sent_like?(event) }
    recovered = events.select { |event| event.status == "recovered" }
    total_sent = sent.size
    total_recovered = recovered.size
    overall_rate = rate(total_recovered, total_sent)

    {
      best_strategy: best_strategy(sent),
      best_hour: best_group(sent, ->(event) { learning_hour(event) }, formatter: ->(hour) { "#{hour.to_i.to_s.rjust(2, '0')}h" }),
      best_day: best_group(sent, ->(event) { learning_weekday(event) }, formatter: method(:weekday_name)),
      best_template: best_group(sent, ->(event) { learning_template(event) }),
      best_coupon: best_coupon(sent),
      top_abandoned_category: top_category(events),
      top_recovered_category: top_category(recovered),
      average_purchase_minutes: average(recovered.filter_map(&:conversion_minutes)).round(1),
      overall_rate_percent: overall_rate,
      ai_conversion_percent: conversion_rate(sent.select { |event| event.delivery_strategy == "ai" }),
      template_conversion_percent: conversion_rate(sent.select { |event| event.delivery_strategy == "template" }),
      top_strategies: top_strategies(sent),
      trend: trend(sent),
      totals: {
        sent: total_sent,
        recovered: total_recovered,
        ignored: events.count { |event| event.status == "ignored" },
        responded_without_purchase: events.count { |event| responded_without_purchase?(event) }
      }
    }
  end

  def learning_events
    company.sales_recovery_events
      .includes(:coupon)
      .where("created_at >= ?", WINDOW.ago)
      .where(status: %w[sent recovered ignored skipped])
  end

  def best_strategy(events)
    top = top_strategies(events).first
    return fallback("Ainda sem volume suficiente") unless top

    {
      name: top[:name],
      label: top[:label],
      sent: top[:sent],
      recovered: top[:recovered],
      rate_percent: top[:rate_percent],
      insight: "#{top[:label]} converteu #{top[:rate_percent]}% neste periodo."
    }
  end

  def top_strategies(events)
    rows = []
    rows.concat(grouped_rows(events, ->(event) { "mensagem:#{event.delivery_strategy.presence || 'template'}" }, ->(key) { key.end_with?("ai") ? "Mensagem com IA" : "Template pronto" }))
    rows.concat(grouped_rows(events, ->(event) { "beneficio:#{event.benefit_decision.presence || 'none'}" }, ->(key) { benefit_label(key.split(":").last) }))
    rows.concat(grouped_rows(events, ->(event) { "cupom:#{coupon_kind(event)}" }, ->(key) { coupon_label(key.split(":").last) }))
    rows.sort_by { |row| [-row[:rate_percent].to_f, -row[:recovered].to_i, -row[:sent].to_i] }.first(5)
  end

  def best_group(events, extractor, formatter: nil)
    rows = grouped_rows(events, extractor, formatter || ->(value) { value.to_s.presence || "Indefinido" })
    rows.first || fallback("Sem dados")
  end

  def best_coupon(events)
    rows = grouped_rows(events, ->(event) { coupon_kind(event) }, ->(value) { coupon_label(value) })
    rows.first || fallback("Sem cupom campeão ainda")
  end

  def grouped_rows(events, extractor, formatter)
    events
      .group_by { |event| extractor.call(event).presence || "indefinido" }
      .filter_map do |key, rows|
        next if rows.size < MIN_SAMPLE

        recovered_count = rows.count { |event| event.status == "recovered" }
        {
          name: key,
          label: formatter.call(key),
          sent: rows.size,
          recovered: recovered_count,
          rate_percent: rate(recovered_count, rows.size)
        }
      end
      .sort_by { |row| [-row[:rate_percent].to_f, -row[:recovered].to_i, -row[:sent].to_i] }
  end

  def top_category(events)
    rows = events
      .flat_map { |event| Array(event.cart_snapshot.to_h["categories"]) }
      .compact_blank
      .tally
      .map { |name, total| { name: name, total: total } }
      .sort_by { |row| -row[:total] }
    rows.first
  end

  def trend(events)
    recent = events.select { |event| event.sent_at && event.sent_at >= 7.days.ago }
    previous = events.select { |event| event.sent_at && event.sent_at < 7.days.ago }
    recent_rate = conversion_rate(recent)
    previous_rate = conversion_rate(previous)

    return "Aguardando mais dados para calcular tendencia." if recent.empty? || previous.empty?
    return "Tendencia de alta: recuperacao melhorou #{(recent_rate - previous_rate).round(1)} pontos." if recent_rate > previous_rate
    return "Tendencia estavel." if recent_rate == previous_rate

    "Atencao: recuperacao caiu #{(previous_rate - recent_rate).round(1)} pontos."
  end

  def sent_like?(event)
    event.status.in?(%w[sent recovered ignored])
  end

  def responded_without_purchase?(event)
    event.responded_at.present? && event.recovered_at.blank?
  end

  def learning_hour(event)
    event.metadata_json.to_h["learning_hour"].presence || event.sent_at&.in_time_zone(company.timezone.presence || "America/Sao_Paulo")&.hour
  end

  def learning_weekday(event)
    event.metadata_json.to_h["learning_weekday"].presence || event.sent_at&.in_time_zone(company.timezone.presence || "America/Sao_Paulo")&.wday
  end

  def learning_template(event)
    event.metadata_json.to_h["learning_template"].presence || event.delivery_strategy.presence || "template"
  end

  def coupon_kind(event)
    return "sem_cupom" unless event.coupon
    return "frete_gratis" if event.coupon.discount_type == "free_shipping"

    value = event.coupon.discount_value.to_i
    value.positive? ? "#{value}%" : event.coupon.discount_type
  end

  def coupon_label(value)
    {
      "sem_cupom" => "Sem cupom",
      "frete_gratis" => "Frete gratis"
    }[value] || "Cupom #{value}"
  end

  def benefit_label(value)
    {
      "none" => "Lembrete sem desconto",
      "percentage" => "Cupom percentual",
      "free_shipping" => "Frete gratis"
    }[value] || value.to_s
  end

  def weekday_name(value)
    %w[Domingo Segunda Terca Quarta Quinta Sexta Sabado][value.to_i] || value.to_s
  end

  def conversion_rate(events)
    return 0.0 if events.empty?

    rate(events.count { |event| event.status == "recovered" }, events.size)
  end

  def rate(value, total)
    return 0.0 if total.to_i.zero?

    ((value.to_f / total.to_f) * 100).round(1)
  end

  def average(values)
    return 0.0 if values.blank?

    values.sum.to_f / values.size
  end

  def fallback(label)
    { name: nil, label: label, sent: 0, recovered: 0, rate_percent: 0.0 }
  end
end
