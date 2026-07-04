# frozen_string_literal: true

class PerformanceMonitorService
  REQUESTS_KEY = "replymesh:performance:requests"
  CACHE_KEY = "replymesh:performance:cache"
  EXTERNAL_KEY = "replymesh:performance:external"
  SLOW_QUERIES_KEY = "replymesh:performance:slow_queries"
  SYSTEM_KEY = "replymesh:performance:system_snapshot"
  MAX_EVENTS = 500
  MAX_SLOW_QUERIES = 200
  SLOW_QUERY_THRESHOLD_MS = 100.0
  CACHE_TTL = 12.hours
  SNAPSHOT_TTL = 30.seconds

  class << self
    def enabled?
      Rails.env.development? || ENV["REPLYMESH_PERFORMANCE_MONITOR"].to_s == "1"
    end

    def track_request(endpoint:, company_id:, duration_ms:, sql_ms:, render_ms:, query_count:, payload_bytes:, request_payload_bytes: nil)
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
          request_payload_bytes: request_payload_bytes.to_i,
          at: Time.current.iso8601
        }
      )
    end

    def track_slow_query(endpoint:, company_id:, duration_ms:, sql:, rows: nil)
      return unless enabled?
      return if duration_ms.to_f < SLOW_QUERY_THRESHOLD_MS

      append(
        SLOW_QUERIES_KEY,
        {
          endpoint: endpoint.to_s,
          company_id: safe_company_id(company_id),
          duration_ms: duration_ms.to_f.round(2),
          rows: rows.to_i.positive? ? rows.to_i : nil,
          sql: summarize_sql(sql),
          at: Time.current.iso8601
        },
        limit: MAX_SLOW_QUERIES
      )
    end

    def track_cache(event:, company_id:, endpoint:, group:, duration_ms:, ttl_seconds: nil)
      return unless enabled?

      append(
        CACHE_KEY,
        {
          event: event.to_s,
          company_id: safe_company_id(company_id),
          endpoint: endpoint.to_s.presence || group.to_s,
          group: group.to_s,
          duration_ms: duration_ms.to_f.round(2),
          ttl_seconds: ttl_seconds.to_i.positive? ? ttl_seconds.to_i : nil,
          at: Time.current.iso8601
        }
      )
    end

    def track_external(kind:, duration_ms:, company_id: nil, success: true)
      return unless enabled?

      append(
        EXTERNAL_KEY,
        {
          kind: kind.to_s,
          company_id: safe_company_id(company_id),
          duration_ms: duration_ms.to_f.round(2),
          success: success != false,
          at: Time.current.iso8601
        }
      )
    end

    def summary
      requests = read_events(REQUESTS_KEY)
      cache_events = read_events(CACHE_KEY)
      external_events = read_events(EXTERNAL_KEY)
      slow_queries = read_events(SLOW_QUERIES_KEY)
      system = system_snapshot
      database = database_snapshot(requests: requests)
      cache_summary = cache_summary(cache_events)

      {
        status: "observing",
        enabled: enabled?,
        provider: Rails.cache.class.name,
        window_size: MAX_EVENTS,
        system: system,
        database: database,
        api: {
          average_ms: average(requests, :duration_ms),
          total_requests: requests.size,
          average_payload_bytes: average(requests, :payload_bytes),
          average_request_payload_bytes: average(requests, :request_payload_bytes)
        },
        sql: {
          average_ms: average(requests, :sql_ms),
          average_queries: average(requests, :query_count),
          largest_query_endpoint: max_by(requests, :sql_ms)&.dig(:endpoint),
          slow_query_threshold_ms: SLOW_QUERY_THRESHOLD_MS,
          top_slow_queries: top_slow_queries(slow_queries)
        },
        cache: cache_summary,
        endpoints: {
          slowest: max_by(requests, :duration_ms)&.slice(:endpoint, :duration_ms, :query_count, :company_id),
          most_accessed: most_frequent(requests, :endpoint),
          top_by_payload: top_by(requests, :payload_bytes, limit: 20).map { |event| event.slice(:endpoint, :payload_bytes, :company_id) },
          top_by_request_payload: top_by(requests, :request_payload_bytes, limit: 20).map { |event| event.slice(:endpoint, :request_payload_bytes, :company_id) }
        },
        companies: {
          most_accessed: most_frequent(requests, :company_id),
          highest_consumption: company_with_highest_consumption(requests),
          top_load: company_load_ranking(requests, cache_events, external_events)
        },
        payloads: {
          largest_response: max_by(requests, :payload_bytes)&.slice(:endpoint, :payload_bytes, :company_id),
          largest_request: max_by(requests, :request_payload_bytes)&.slice(:endpoint, :request_payload_bytes, :company_id),
          average_render_ms: average(requests, :render_ms)
        },
        external: external_summary(external_events, requests),
        indexes: database[:indexes],
        dashboard_structure: dashboard_structure,
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

    def instrument_external(kind, company_id: nil)
      started_at = monotonic_time
      result = yield
      track_external(kind: kind, company_id: company_id, duration_ms: elapsed_ms(started_at), success: external_success?(result))
      result
    rescue StandardError
      track_external(kind: kind, company_id: company_id, duration_ms: elapsed_ms(started_at), success: false)
      raise
    end

    private

    def append(key, event, limit: MAX_EVENTS)
      events = read_events(key)
      events << event
      Rails.cache.write(key, events.last(limit), expires_in: CACHE_TTL)
    rescue StandardError => e
      Rails.logger.warn("[PerformanceMonitor] append failed key=#{key}: #{e.class}")
    end

    def external_success?(result)
      return result.is_a?(Net::HTTPSuccess) if defined?(Net::HTTPResponse) && result.is_a?(Net::HTTPResponse)
      return result[:success] != false if result.is_a?(Hash) && result.key?(:success)
      return result["success"] != false if result.is_a?(Hash) && result.key?("success")

      true
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

    def external_summary(events, requests)
      kinds = %w[cloudflare_r2 mercado_pago evolution ai]
      result = kinds.index_with do |kind|
        subset = events.select { |event| event[:kind] == kind }
        {
          average_ms: average(subset, :duration_ms),
          max_ms: max_by(subset, :duration_ms)&.dig(:duration_ms),
          min_ms: subset.min_by { |event| event[:duration_ms].to_f }&.dig(:duration_ms),
          calls: subset.size,
          errors: subset.count { |event| event[:success] == false }
        }
      end
      result[:public_store] = {
        average_ms: average(requests.select { |event| event[:area] == "public_store" }, :duration_ms),
        calls: requests.count { |event| event[:area] == "public_store" }
      }
      result
    end

    def max_by(events, field)
      events.max_by { |event| event[field].to_f }
    end

    def top_by(events, field, limit:)
      events.select { |event| event[field].to_i.positive? }
            .sort_by { |event| -event[field].to_f }
            .first(limit)
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

      names = company_name_map(grouped.keys)
      company_id, company_events = grouped.max_by do |_id, items|
        items.sum { |event| event[:duration_ms].to_f + event[:sql_ms].to_f + (event[:payload_bytes].to_i / 1024.0) }
      end
      { company_id: company_id, company_name: names[company_id.to_i], requests: company_events.size, average_ms: average(company_events, :duration_ms) }
    end

    def company_load_ranking(requests, cache_events, external_events)
      ids = (requests.map { |event| event[:company_id] } + cache_events.map { |event| event[:company_id] } + external_events.map { |event| event[:company_id] }).compact.uniq
      names = company_name_map(ids)
      ids.map do |company_id|
        company_requests = requests.select { |event| event[:company_id] == company_id }
        company_cache = cache_events.select { |event| event[:company_id] == company_id }
        company_external = external_events.select { |event| event[:company_id] == company_id }
        {
          company_id: company_id,
          company_name: names[company_id.to_i],
          requests: company_requests.size,
          ai_calls: company_external.count { |event| event[:kind] == "ai" },
          average_ms: average(company_requests, :duration_ms),
          cache_hit_rate: hit_rate(company_cache),
          largest_payload_bytes: max_by(company_requests, :payload_bytes)&.dig(:payload_bytes),
          query_count: company_requests.sum { |event| event[:query_count].to_i },
          orders_endpoint_hits: company_requests.count { |event| event[:area] == "orders" }
        }
      end.sort_by { |item| -((item[:requests].to_i * 2) + item[:query_count].to_i + (item[:ai_calls].to_i * 5)) }.first(20)
    end

    def cache_summary(events)
      {
        hit: events.count { |event| event[:event] == "cache_hit" },
        miss: events.count { |event| event[:event] == "cache_miss" },
        hit_rate: hit_rate(events),
        miss_rate: miss_rate(events),
        average_ms: average(events, :duration_ms),
        average_ttl_seconds: average(events.select { |event| event[:ttl_seconds].present? }, :ttl_seconds),
        entries_by_company: grouped_count(events, :company_id),
        expired_entries: events.count { |event| event[:event] == "cache_expired" },
        largest_group: most_frequent(events, :group)
      }
    end

    def grouped_count(events, field)
      events.map { |event| event[field] }.compact.tally.sort_by { |_value, count| -count }.first(20).map do |value, count|
        { value: value, count: count }
      end
    end

    def top_slow_queries(events)
      names = company_name_map(events.map { |event| event[:company_id] })
      top_by(events, :duration_ms, limit: 20).map do |event|
        event.slice(:endpoint, :company_id, :duration_ms, :rows, :sql, :at).merge(company_name: names[event[:company_id].to_i])
      end
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

    def company_name_map(ids)
      normalized_ids = Array(ids).compact.map { |id| id.to_i }.select(&:positive?).uniq
      return {} if normalized_ids.blank?

      Company.where(id: normalized_ids).pluck(:id, :name).to_h
    rescue StandardError
      {}
    end

    def summarize_sql(sql)
      value = sql.to_s.dup
      value.gsub!(/'(?:''|[^'])*'/, "?")
      value.gsub!(/"(?:\\"|[^"])*"/, "?")
      value.gsub!(/\b\d{2,}\b/, "?")
      value.gsub!(/\s+/, " ")
      value.strip.first(600)
    end

    def system_snapshot
      Rails.cache.fetch(SYSTEM_KEY, expires_in: SNAPSHOT_TTL) do
        {
          cpu: cpu_snapshot,
          memory: memory_snapshot,
          swap: swap_snapshot,
          disk: disk_snapshot,
          load_average: load_average,
          uptime_seconds: uptime_seconds,
          processes: {
            rails: rails_process_count,
            current_process_threads: Thread.list.count
          },
          puma: puma_snapshot,
          http_connections_open: http_connection_count,
          versions: {
            ruby: RUBY_VERSION,
            rails: Rails.version,
            postgresql: postgresql_version,
            node: node_version
          },
          last_deploy: {
            deployed_at: ENV["REPLYMESH_DEPLOYED_AT"],
            seconds_since_deploy: seconds_since_deploy
          }
        }
      end
    end

    def database_snapshot(requests:)
      {
        connections: database_connections,
        query_average_ms: average(requests, :sql_ms),
        average_queries_per_request: average(requests, :query_count),
        most_accessed_tables: most_accessed_tables,
        indexes: index_snapshot,
        table_growth_estimate: table_growth_estimate
      }
    rescue StandardError => e
      { error: e.class.name }
    end

    def database_connections
      stats = select_all(<<~SQL)
        SELECT state, COUNT(*)::integer AS count
        FROM pg_stat_activity
        GROUP BY state
      SQL
      max_connections = select_value("SHOW max_connections").to_i
      counts = stats.each_with_object(Hash.new(0)) { |row, memo| memo[row["state"].presence || "unknown"] = row["count"].to_i }
      {
        open: counts.values.sum,
        max: max_connections,
        idle: counts["idle"],
        active: counts["active"],
        by_state: counts
      }
    end

    def most_accessed_tables
      rows = select_all(<<~SQL)
        SELECT relname AS table_name,
               seq_scan,
               idx_scan,
               COALESCE(seq_tup_read, 0) + COALESCE(idx_tup_fetch, 0) AS rows_read
        FROM pg_stat_user_tables
        ORDER BY (seq_scan + idx_scan) DESC
      SQL

      rows.first(20).map do |row|
        {
          table: row["table_name"],
          sequential_scans: row["seq_scan"].to_i,
          index_scans: row["idx_scan"].to_i,
          rows_read: row["rows_read"].to_i
        }
      end
    end

    def index_snapshot
      rows = select_all(<<~SQL)
        SELECT schemaname,
               relname AS table_name,
               indexrelname AS index_name,
               idx_scan,
               idx_tup_read,
               idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY relname, indexrelname
      SQL

      rows.group_by { |row| row["table_name"] }.map do |table, items|
        existing = items.map { |item| item["index_name"] }
        unused = items.select { |item| item["idx_scan"].to_i.zero? }.map { |item| item["index_name"] }
        used = items.reject { |item| item["idx_scan"].to_i.zero? }.sort_by { |item| -item["idx_scan"].to_i }.first(10).map do |item|
          { name: item["index_name"], scans: item["idx_scan"].to_i }
        end
        {
          table: table,
          existing_indexes: existing,
          used_indexes: used,
          unused_indexes: unused,
          suggestions: index_suggestions(table, existing)
        }
      end
    rescue StandardError => e
      [{ error: e.class.name }]
    end

    def index_suggestions(table, existing)
      suggestions = []
      suggestions << "avaliar indice em company_id" if table.to_s.pluralize == table.to_s && existing.none? { |name| name.include?("company_id") }
      suggestions
    end

    def table_growth_estimate
      rows = select_all(<<~SQL)
        SELECT relname AS table_name,
               n_live_tup AS estimated_rows,
               pg_total_relation_size(relid) AS total_bytes,
               pg_relation_size(relid) AS table_bytes,
               pg_indexes_size(relid) AS index_bytes
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(relid) DESC
      SQL

      rows.first(20).map do |row|
        {
          table: row["table_name"],
          estimated_rows: row["estimated_rows"].to_i,
          total_bytes: row["total_bytes"].to_i,
          table_bytes: row["table_bytes"].to_i,
          index_bytes: row["index_bytes"].to_i
        }
      end
    end

    def select_all(sql)
      ActiveRecord::Base.connection.select_all(sql).to_a
    rescue StandardError
      []
    end

    def select_value(sql)
      ActiveRecord::Base.connection.select_value(sql)
    rescue StandardError
      nil
    end

    def memory_snapshot
      info = proc_meminfo
      total = info["MemTotal"].to_i * 1024
      available = info["MemAvailable"].to_i * 1024
      used = [total - available, 0].max
      {
        total_bytes: total,
        used_bytes: used,
        free_bytes: available,
        used_percent: percent(used, total)
      }
    end

    def swap_snapshot
      info = proc_meminfo
      total = info["SwapTotal"].to_i * 1024
      free = info["SwapFree"].to_i * 1024
      used = [total - free, 0].max
      { total_bytes: total, used_bytes: used, free_bytes: free, used_percent: percent(used, total) }
    end

    def cpu_snapshot
      first = read_cpu_times
      sleep 0.05
      second = read_cpu_times
      total_delta = second[:total] - first[:total]
      idle_delta = second[:idle] - first[:idle]
      sample_percent = total_delta.positive? ? 100.0 * (total_delta - idle_delta) / total_delta : nil
      load_percent = cpu_load_percent
      {
        used_percent: (load_percent || sample_percent)&.round(2),
        sample_percent: sample_percent&.round(2),
        load_percent: load_percent&.round(2),
        cores: cpu_core_count,
        sample_ms: 50
      }
    rescue StandardError
      { used_percent: nil }
    end

    def cpu_load_percent
      load = load_average.first
      cores = cpu_core_count
      return nil if load.blank? || cores.to_i <= 0

      [[(load.to_f / cores.to_f) * 100.0, 0].max, 100].min
    rescue StandardError
      nil
    end

    def cpu_core_count
      require "etc"
      Etc.nprocessors
    rescue StandardError
      1
    end

    def read_cpu_times
      stat = File.read("/proc/stat").lines.first.to_s.split.drop(1).map(&:to_f)
      { idle: stat[3].to_f + stat[4].to_f, total: stat.sum }
    end

    def disk_snapshot
      output = capture_command("df", "-k", "/").to_s.lines
      values = output[1].to_s.split
      return {} if values.size < 6

      total = values[1].to_i * 1024
      used = values[2].to_i * 1024
      free = values[3].to_i * 1024
      { mount: values[5], total_bytes: total, used_bytes: used, free_bytes: free, used_percent: percent(used, total) }
    end

    def load_average
      File.read("/proc/loadavg").split.first(3).map(&:to_f)
    rescue StandardError
      []
    end

    def uptime_seconds
      File.read("/proc/uptime").split.first.to_f.round
    rescue StandardError
      nil
    end

    def rails_process_count
      capture_command("pgrep", "-fc", "puma|rails|ruby").to_i
    rescue StandardError
      nil
    end

    def puma_snapshot
      { current_process_threads: Thread.list.count, max_threads: ENV["RAILS_MAX_THREADS"]&.to_i }
    end

    def http_connection_count
      tcp_connections = ["/proc/net/tcp", "/proc/net/tcp6"].sum do |path|
        File.readlines(path).drop(1).count { |line| line.split[3] == "01" }
      rescue StandardError
        0
      end
      tcp_connections
    end

    def postgresql_version
      select_value("SHOW server_version")
    end

    def node_version
      capture_command("node", "-v").presence
    end

    def seconds_since_deploy
      deployed_at = ENV["REPLYMESH_DEPLOYED_AT"].presence
      return nil if deployed_at.blank?

      (Time.current - Time.zone.parse(deployed_at)).round
    rescue StandardError
      nil
    end

    def proc_meminfo
      File.readlines("/proc/meminfo").each_with_object({}) do |line, memo|
        key, value = line.split(":", 2)
        memo[key] = value.to_s.scan(/\d+/).first.to_i
      end
    rescue StandardError
      {}
    end

    def capture_command(*args)
      require "open3"
      require "timeout"

      Timeout.timeout(2) do
        stdout, _stderr, status = Open3.capture3(*args)
        status.success? ? stdout.strip : nil
      end
    rescue StandardError
      nil
    end

    def monotonic_time
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end

    def elapsed_ms(started_at)
      ((monotonic_time - started_at) * 1000).round(2)
    rescue StandardError
      0.0
    end

    def percent(part, total)
      return nil if total.to_i <= 0

      ((part.to_f / total.to_f) * 100).round(2)
    end

    def dashboard_structure
      {
        system: true,
        cpu: true,
        ram: true,
        disk: true,
        database: true,
        cache: true,
        cloudflare: true,
        ai: true,
        mercado_pago: true,
        evolution: true,
        companies: true,
        top_endpoints: true,
        top_queries: true,
        top_payloads: true,
        top_companies: true
      }
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
