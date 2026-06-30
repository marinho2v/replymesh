# frozen_string_literal: true

class PublicResponseCache
  DEFAULT_TTL = ENV.fetch("REPLYMESH_PUBLIC_CACHE_TTL_SECONDS", "300").to_i.seconds

  class << self
    def fetch(company:, endpoint:, version: nil, expires_in: DEFAULT_TTL)
      ReplymeshCacheService.fetch(
        company: company,
        group: cache_group(endpoint),
        endpoint: endpoint,
        expires_in: expires_in,
        extra: version
      ) { yield }
    end

    def disabled?
      ReplymeshCacheService.disabled?
    end

    private

    def cache_group(endpoint)
      case endpoint.to_sym
      when :delivery_zones then :delivery
      else endpoint.to_sym
      end
    end
  end
end
