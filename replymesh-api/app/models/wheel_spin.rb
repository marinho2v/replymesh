class WheelSpin < ApplicationRecord
  STATUSES = %w[available used expired].freeze

  belongs_to :company
  belongs_to :customer
  belongs_to :order, optional: true
  belongs_to :wheel_prize, optional: true
  belongs_to :coupon, optional: true

  validates :status, inclusion: { in: STATUSES }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :available, -> { where(status: "available").where("expires_at IS NULL OR expires_at >= ?", Time.current) }
  scope :used, -> { where(status: "used") }
  scope :recent, -> { order(created_at: :desc) }
end
