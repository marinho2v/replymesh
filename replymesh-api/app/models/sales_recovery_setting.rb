class SalesRecoverySetting < ApplicationRecord
  DELAY_OPTIONS = [30, 60, 120, 240, 720, 1440].freeze
  DAILY_LIMIT_OPTIONS = [10, 20, 30, 50, 100].freeze
  DISCOUNT_OPTIONS = [5, 10, 15].freeze
  WEEKDAYS = (0..6).to_a.freeze

  belongs_to :company

  validates :delay_minutes, inclusion: { in: DELAY_OPTIONS }
  validates :daily_limit, inclusion: { in: DAILY_LIMIT_OPTIONS }
  validates :default_discount_percent, inclusion: { in: DISCOUNT_OPTIONS }
  validates :coupon_validity_hours, numericality: { only_integer: true, greater_than_or_equal_to: 24, less_than_or_equal_to: 168 }
  validates :per_customer_daily_limit, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 5 }
  validates :queue_spacing_minutes, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 30 }
  validates :cooldown_hours, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 168 }
  validates :recent_response_minutes, numericality: { only_integer: true, greater_than_or_equal_to: 5, less_than_or_equal_to: 240 }
  validates :min_cart_total_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :valid_window
  validate :valid_quiet_window
  validate :valid_weekdays

  before_validation :normalize_weekdays

  def self.for_company(company)
    find_or_create_by!(company: company)
  end

  def allowed_today?(time = Time.current)
    allowed_weekdays.blank? || allowed_weekdays.include?(time.in_time_zone(company.timezone.presence || "America/Sao_Paulo").wday)
  end

  def within_window?(time = Time.current)
    local = time.in_time_zone(company.timezone.presence || "America/Sao_Paulo")
    starts = parse_window_time(window_start, local)
    ends_at = parse_window_time(window_end, local)
    ends_at += 1.day if ends_at < starts
    local >= starts && local <= ends_at
  end

  def as_json_safe
    {
      enabled: enabled,
      delay_minutes: delay_minutes,
      daily_limit: daily_limit,
      window_start: window_start,
      window_end: window_end,
      allowed_weekdays: allowed_weekdays,
      use_ai: use_ai,
      auto_coupon: auto_coupon,
      default_discount_percent: default_discount_percent,
      free_delivery: free_delivery,
      coupon_validity_hours: coupon_validity_hours,
      per_customer_daily_limit: per_customer_daily_limit,
      queue_spacing_minutes: queue_spacing_minutes,
      cooldown_hours: cooldown_hours,
      recent_response_minutes: recent_response_minutes,
      min_cart_total_cents: min_cart_total_cents,
      quiet_hours_enabled: quiet_hours_enabled,
      quiet_window_start: quiet_window_start,
      quiet_window_end: quiet_window_end,
      coupon_rules_json: coupon_rules_json,
      metadata_json: metadata_json,
      score_weights: metadata_json.to_h["score_weights"].presence || SalesRecoveryIntelligence::DEFAULT_SCORE_WEIGHTS,
      message_template: message_template
    }
  end

  private

  def normalize_weekdays
    self.allowed_weekdays = Array(allowed_weekdays).map(&:to_i).select { |day| WEEKDAYS.include?(day) }.uniq.sort
  end

  def valid_weekdays
    return if allowed_weekdays.all? { |day| WEEKDAYS.include?(day) }

    errors.add(:allowed_weekdays, "possui dias invalidos")
  end

  def valid_window
    parse_window_time(window_start, Time.zone.now)
    parse_window_time(window_end, Time.zone.now)
  rescue ArgumentError
    errors.add(:base, "Janela de envio invalida")
  end

  def valid_quiet_window
    parse_window_time(quiet_window_start, Time.zone.now)
    parse_window_time(quiet_window_end, Time.zone.now)
  rescue ArgumentError
    errors.add(:base, "Horario de silencio invalido")
  end

  def parse_window_time(value, base_time)
    hour, minute = value.to_s.split(":").map(&:to_i)
    raise ArgumentError, "invalid time" unless hour.between?(0, 23) && minute.between?(0, 59)

    base_time.change(hour: hour, min: minute, sec: 0)
  end
end
