class StoreAiRateLimiter
  PER_MINUTE = 5

  def self.allow?(company:, phone:)
    normalized_phone = phone.to_s.gsub(/\D/, "")
    return false if normalized_phone.blank?

    key = "store-ai:rate:#{company.id}:#{normalized_phone}:#{Time.current.strftime('%Y%m%d%H%M')}"
    count = Rails.cache.increment(key, 1, expires_in: 2.minutes)
    count.to_i <= PER_MINUTE
  end
end
