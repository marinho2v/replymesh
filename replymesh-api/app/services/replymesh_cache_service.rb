# frozen_string_literal: true

class ReplymeshCacheService
  DEFAULT_TTLS = {
    store: 5.minutes,
    menu: 5.minutes,
    categories: 5.minutes,
    products: 5.minutes,
    banners: 5.minutes,
    delivery: 5.minutes,
    delivery_zones: 5.minutes,
    business_hours: 5.minutes,
    settings: 5.minutes,
    featured_products: 5.minutes,
    promotions: 5.minutes,
    dashboard: 30.seconds,
    sales_coach: 2.minutes,
    sales_coach_learning: 2.minutes,
    statistics: 60.seconds,
    tables: 5.minutes,
    motoboys: 5.minutes,
    ai_context: 5.minutes
  }.freeze

  GROUPS = DEFAULT_TTLS.keys.freeze

  class << self
    def fetch(company:, group:, endpoint: nil, expires_in: nil, extra: nil)
      return yield if disabled?

      group = normalize_group(group)
      key = cache_key(company: company, group: group, endpoint: endpoint, extra: extra)
      started_at = monotonic_time
      cached = Rails.cache.read(key)

      if cached.nil?
        log_cache("cache_miss", company: company, group: group, endpoint: endpoint, started_at: started_at)
        Rails.cache.fetch(key, expires_in: expires_in || ttl_for(group), race_condition_ttl: race_condition_ttl_for(group)) do
          yield
        end
      else
        log_cache("cache_hit", company: company, group: group, endpoint: endpoint, started_at: started_at)
        cached
      end
    rescue StandardError => e
      Rails.logger.warn("[ReplymeshCacheService] bypass #{group}/#{endpoint}: #{e.class} #{e.message}")
      yield
    end

    def key(company:, group:, endpoint: nil, extra: nil)
      cache_key(company: company, group: normalize_group(group), endpoint: endpoint, extra: extra)
    end

    def invalidate_company(company, groups: GROUPS)
      return if company.blank? || disabled?

      Array(groups).map { |group| normalize_group(group) }.uniq.each do |group|
        key = version_key(company, group)
        current = Rails.cache.read(key).to_i
        Rails.cache.write(key, current + 1, expires_in: 30.days)
      rescue StandardError => e
        Rails.logger.warn("[ReplymeshCacheService] invalidate failed company=#{company_id(company)} group=#{group}: #{e.class} #{e.message}")
      end
    end

    def invalidate_record(record, groups:)
      company = record.is_a?(Company) ? record : nil
      company ||= record.respond_to?(:company) ? record.company : nil
      company ||= Company.find_by(id: record.company_id) if record.respond_to?(:company_id)
      invalidate_company(company, groups: groups) if company
    end

    def ttl_for(group)
      DEFAULT_TTLS.fetch(normalize_group(group), 5.minutes)
    end

    def disabled?
      ENV.fetch("REPLYMESH_CACHE_PROVIDER", "memory").to_s.downcase.in?(%w[disabled off none])
    end

    private

    def cache_key(company:, group:, endpoint:, extra:)
      parts = ["company:#{company_id(company)}", group, "v#{version(company, group)}"]
      parts << endpoint.to_s if endpoint.present?
      parts << stable_extra(extra) if extra.present?
      parts.join(":")
    end

    def version(company, group)
      Rails.cache.fetch(version_key(company, group), expires_in: 30.days) { 1 }
    end

    def version_key(company, group)
      "company:#{company_id(company)}:#{group}:version"
    end

    def company_id(company)
      company.respond_to?(:id) ? company.id : company
    end

    def normalize_group(group)
      group.to_s.tr("-", "_").to_sym
    end

    def stable_extra(extra)
      case extra
      when Hash
        extra.sort_by { |key, _value| key.to_s }.map { |key, value| "#{key}=#{value}" }.join("&")
      when Array
        extra.join("-")
      else
        extra.to_s
      end
    end

    def race_condition_ttl_for(group)
      group == :dashboard ? 5.seconds : 10.seconds
    end

    def log_cache(event, company:, group:, endpoint:, started_at:)
      elapsed_ms = ((monotonic_time - started_at) * 1000).round(1)
      PerformanceMonitorService.track_cache(
        event: event,
        company_id: company_id(company),
        endpoint: endpoint || group,
        group: group,
        duration_ms: elapsed_ms,
        ttl_seconds: ttl_for(group).to_i
      ) if defined?(PerformanceMonitorService)

      return unless cache_logging_enabled?

      Rails.logger.info(
        "[ReplymeshCache] #{event} company_id=#{company_id(company)} group=#{group} endpoint=#{endpoint || group} tempo_ms=#{elapsed_ms}"
      )
    end

    def cache_logging_enabled?
      Rails.env.development? || ENV["REPLYMESH_CACHE_DEBUG"].to_s == "1"
    end

    def monotonic_time
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end
  end
end
