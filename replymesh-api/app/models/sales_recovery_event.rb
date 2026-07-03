class SalesRecoveryEvent < ApplicationRecord
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :dashboard, :sales_coach, :sales_coach_learning, :business_intelligence, :replymesh_brain

  STATUSES = %w[queued sent failed recovered ignored skipped].freeze

  belongs_to :company
  belongs_to :store_ai_cart, optional: true
  belongs_to :customer, optional: true
  belongs_to :coupon, optional: true
  belongs_to :marketing_message_log, optional: true
  belongs_to :recovered_order, class_name: "Order", optional: true

  validates :customer_phone, :status, :source, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :cart_total_cents, :recovered_value_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :recovery_score, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :customer_value_score, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, if: -> { has_attribute?(:customer_value_score) }
  validates :abandoned_minutes, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :for_company, ->(company_id) { where(company_id: company_id) }
  scope :queued, -> { where(status: "queued") }
  scope :sent, -> { where(status: "sent") }
  scope :recovered, -> { where(status: "recovered") }
  scope :today_for, ->(company) {
    zone = ActiveSupport::TimeZone[company.timezone.presence || "America/Sao_Paulo"]
    today = Time.current.in_time_zone(zone).to_date
    where(created_at: zone.local(today.year, today.month, today.day).utc...zone.local(today.next_day.year, today.next_day.month, today.next_day.day).utc)
  }
end
