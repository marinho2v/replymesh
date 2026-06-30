# frozen_string_literal: true

class PerformanceMonitorService
  REQUESTS_KEY = "replymesh:performance:requests"
  CACHE_KEY = "replymesh:performance:cache"
  EXTERNAL_KEY = "replymesh:performance:external"
  MAX_EVENTS = 500
  CACHE_TTL = 12.hours

  class << self
    def enabled?
      Rails.env.development? || ENV["REPLYMESH_PERFORMANCE_MONITOR"].to_s == "1"
    end

    def track_request(endpoint:, company_id:, duration_ms:, sql_ms:, render_ms:, query_count:, payload_bytes:)
      return unless enabled?

      append(
        REQUESTS_KEY,
        {
          endpoint: endpoint.to_s,
          area: area_for_endpoint(endpoint),
          company_id: safe_company_id(company_id),
          duration_ms: duration_ms.to_f.round(2),
          sql_ms: sql_ms.to_f.round(2),
          render_ms: render_ms.to_f.round(2),
          query_count: query_count.to_i,
          payload_bytes: payload_bytes.to_i,
          at: Time.current.iso8601
        }
      )
    end

    def track_cache(event:, company_id:, endpoint:, group:, duration_ms:)
      return unless enabled?

      append(
        CACHE_KEY,
        {
          event: event.to_s,
          company_id: safe_company_id(company_id),
          endpoint: endpoint.to_s.presence || group.to_s,
          group: group.to_s,
          duration_ms: duration_ms.to_f.round(2),
          at: Time.current.iso8601
        }
      )
    end

    def track_external(kind:, duration_ms:, company_id: nil)
      return unless enabled?

      append(
        EXTERNAL_KEY,
        {
          kind: kind.to_s,
          company_id: safe_company_id(company_id),
          duration_ms: duration_ms.to_f.round(2),
          at: Time.current.iso8601
        }
      )
    end

    def summary
      requests = read_events(REQUESTS_KEY)
      cache_events = read_events(CACHE_KEY)
      external_events = read_events(EXTERNAL_KEY)

      {
        status: "prepared",
        enabled: enabled?,
        provider: Rails.cache.class.name,
        window_size: MAX_EVENTS,
        api: {
          average_ms: average(requests, :duration_ms),
          total_requests: requests.size,
          average_payload_bytes: average(requests, :payload_bytes)
        },
        sql: {
          average_ms: average(requests, :sql_ms),
          average_queries: average(requests, :query_count),
          largest_query_endpoint: max_by(requests, :sql_ms)&.dig(:endpoint)
        },
        cache: {
          hit: cache_events.count { |event| event[:event] == "cache_hit" },
          miss: cache_events.count { |event| event[:event] == "cache_miss" },
          hit_rate: hit_rate(cache_events),
          miss_rate: miss_rate(cache_events),
          average_ms: average(cache_events, :duration_ms)
        },
        endpoints: {
          slowest: max_by(requests, :duration_ms)&.slice(:endpoint, :duration_ms, :query_count, :company_id),
          most_accessed: most_frequent(requests, :endpoint)
        },
        companies: {
          most_accessed: most_frequent(requests, :company_id),
          highest_consumption: company_with_highest_consumption(requests)
        },
        payloads: {
          largest: max_by(requests, :payload_bytes)&.slice(:endpoint, :payload_bytes, :company_id)
        },
        external: {
          ai_average_ms: average_for_kind(external_events, "ai"),
          cloudflare_r2_average_ms: average_for_kind(external_events, "cloudflare_r2"),
          mercado_pago_average_ms: average_for_kind(external_events, "mercado_pago"),
          evolution_average_ms: average_for_kind(external_events, "evolution"),
          public_store_average_ms: average(requests.select { |event| event[:area] == "public_store" }, :duration_ms)
        },
        security: {
          stores_sensitive_payloads: false,
          stores_jwt: false,
          stores_payment_data: false,
          stores_messages: false
        }
      }
    end

    def instrument(name, payload = {})
      ActiveSupport::Notifications.instrument("replymesh.#{name}", payload) { yield }
    end

    private

    def append(key, event)
      events = read_events(key)
      events << event
      Rails.cache.write(key, events.last(MAX_EVENTS), expires_in: CACHE_TTL)
    rescue StandardError => e
      Rails.logger.warn("[PerformanceMonitor] append failed key=#{key}: #{e.class}")
    end

    def read_events(key)
      Array(Rails.cache.read(key)).map { |event| event.respond_to?(:deep_symbolize_keys) ? event.deep_symbolize_keys : event }
    rescue StandardError
      []
    end

    def average(events, field)
      return nil if events.blank?

      values = events.map { |event| event[field].to_f }
      (values.sum / values.size).round(2)
    end

    def average_for_kind(events, kind)
      average(events.select { |event| event[:kind] == kind }, :duration_ms)
    end

    def max_by(events, field)
      events.max_by { |event| event[field].to_f }
    end

    def most_frequent(events, field)
      values = events.map { |event| event[field] }.compact
      return nil if values.blank?

      value, count = values.tally.max_by { |_item, total| total }
      { value: value, count: count }
    end

    def company_with_highest_consumption(events)
      grouped = events.select { |event| event[:company_id].present? }.group_by { |event| event[:company_id] }
      return nil if grouped.blank?

      company_id, company_events = grouped.max_by do |_id, items|
        items.sum { |event| event[:duration_ms].to_f + event[:sql_ms].to_f + (event[:payload_bytes].to_i / 1024.0) }
      end
      { company_id: company_id, requests: company_events.size, average_ms: average(company_events, :duration_ms) }
    end

    def hit_rate(events)
      total = events.size
      return nil if total.zero?

      ((events.count { |event| event[:event] == "cache_hit" }.to_f / total) * 100).round(2)
    end

    def miss_rate(events)
      total = events.size
      return nil if total.zero?

      ((events.count { |event| event[:event] == "cache_miss" }.to_f / total) * 100).round(2)
    end

    def safe_company_id(company_id)
      company_id.presence&.to_i
    rescue StandardError
      nil
    end

    def area_for_endpoint(endpoint)
      value = endpoint.to_s
      return "dashboard" if value.include?("dashboard")
      return "orders" if value.include?("orders")
      return "products" if value.include?("products")
      return "ai" if value.include?("ai")
      return "public_store" if value.include?("public/")
      return "checkout" if value.include?("checkout")
      return "motoboy" if value.include?("motoboy")
      return "master" if value.include?("master/")

      "api"
    end
  end
end
