class StoreAiCart < ApplicationRecord
  STAGES = %w[
    greeting product_discovery product_selection options_selection upsell
    customer_identification address_collection address_confirmation delivery_calculation
    payment_selection pix_generation order_confirmation waiting_payment completed handoff
  ].freeze

  belongs_to :company
  belongs_to :store_ai_conversation
  has_one :sales_recovery_event, dependent: :nullify

  validates :customer_phone, presence: true
  validates :stage, inclusion: { in: STAGES }
  validates :subtotal_cents, :delivery_fee_cents, :discount_cents, :total_cents,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active, -> { where("expires_at > ?", Time.current).where.not(stage: %w[completed handoff]) }

  before_validation :set_default_expiration, on: :create
  after_commit :schedule_sales_recovery, on: %i[create update]

  def expired?
    expires_at.present? && expires_at.past?
  end

  def complete!
    update!(stage: "completed", expires_at: Time.current)
  end

  def handoff!(reason:)
    update!(
      stage: "handoff",
      metadata_json: metadata_json.merge("handoff_reason" => reason),
      expires_at: Time.current
    )
  end

  def refresh_totals!
    subtotal = Array(items).sum { |item| item["total_cents"].to_i }
    update!(
      subtotal_cents: subtotal,
      total_cents: [subtotal + delivery_fee_cents.to_i - discount_cents.to_i, 0].max,
      expires_at: 2.hours.from_now
    )
  end

  private

  def set_default_expiration
    self.expires_at ||= 2.hours.from_now
  end

  def schedule_sales_recovery
    return if stage.in?(%w[completed handoff])
    return if Array(items).blank? || customer_phone.blank?
    return unless company&.sales_recovery_setting&.enabled?

    SalesRecoveryEngineJob.set(wait: company.sales_recovery_setting.delay_minutes.minutes).perform_later(company.id)
  rescue StandardError => e
    Rails.logger.warn("Sales recovery schedule skipped for cart #{id}: #{e.class} #{e.message}")
  end
end
