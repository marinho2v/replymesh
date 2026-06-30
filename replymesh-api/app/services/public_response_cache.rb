# frozen_string_literal: true

class PublicResponseCache
  DEFAULT_TTL = ENV.fetch("REPLYMESH_PUBLIC_CACHE_TTL_SECONDS", "60").to_i.seconds

  class << self
    def fetch(company:, endpoint:, version:, expires_in: DEFAULT_TTL)
      return yield if disabled?

      Rails.cache.fetch(cache_key(company, endpoint, version), expires_in: expires_in, race_condition_ttl: 5.seconds) do
        yield
      end
    rescue StandardError => e
      Rails.logger.warn("[PublicResponseCache] bypass #{endpoint}: #{e.class} #{e.message}")
      yield
    end

    def disabled?
      ENV.fetch("REPLYMESH_CACHE_PROVIDER", "memory").to_s.downcase.in?(%w[disabled off none])
    end

    private

    def cache_key(company, endpoint, version)
      [
        "replymesh",
        "public",
        endpoint,
        "company:#{company.id}",
        "v:#{version}"
      ].join(":")
    end
  end
end
