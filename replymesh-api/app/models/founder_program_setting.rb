class FounderProgramSetting < ApplicationRecord
  DEFAULT_MODULES = %w[
    dashboard products categories orders checkout reports delivery delivery_zones
    pos tables motoboy whatsapp_manual coupons promotions roulette banners pix
  ].freeze

  validates :signup_limit, numericality: { only_integer: true, greater_than: 0 }

  def self.current
    first_or_create!(
      enabled: false,
      allow_signups: false,
      signup_limit: 100,
      default_modules: DEFAULT_MODULES
    )
  end

  def founder_count
    Company.where(origin: "founder_program").count
  end

  def remaining
    [signup_limit - founder_count, 0].max
  end

  def open?
    enabled && allow_signups && remaining.positive? &&
      (started_at.blank? || started_at <= Time.current) &&
      (ends_at.blank? || ends_at >= Time.current)
  end

  def as_public_json
    {
      enabled: open?,
      limit: signup_limit,
      registered: founder_count,
      remaining: remaining,
      ends_at: ends_at
    }
  end
end
