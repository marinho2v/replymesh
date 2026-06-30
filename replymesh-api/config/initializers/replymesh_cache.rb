# frozen_string_literal: true

# Lightweight cache configuration for the current single-VPS architecture.
#
# REPLYMESH_CACHE_PROVIDER:
#   memory   -> process-local cache, safe default for public catalog data
#   redis    -> Redis cache when REDIS_URL exists; falls back to memory otherwise
#   disabled -> no API response cache
#
# Redis is intentionally optional here. Production must keep booting even if no
# Redis service exists yet.
provider = ENV.fetch("REPLYMESH_CACHE_PROVIDER", "memory").to_s.downcase

Rails.application.configure do
  case provider
  when "disabled", "off", "none"
    config.cache_store = :null_store
  when "redis"
    redis_url = ENV["REDIS_URL"].presence
    config.cache_store = redis_url ? [:redis_cache_store, { url: redis_url }] : :memory_store
  else
    config.cache_store = :memory_store, { size: 32.megabytes }
  end
end
