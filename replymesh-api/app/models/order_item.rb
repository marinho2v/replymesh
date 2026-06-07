class OrderItem < ApplicationRecord
  STATUSES = %w[active sent_to_kitchen preparing ready delivered cancelled].freeze

  belongs_to :company
  belongs_to :order
  belongs_to :product, optional: true
  belongs_to :cancelled_by, class_name: "User", optional: true

  validates :product_name, presence: true
  validates :quantity,     numericality: { only_integer: true, greater_than: 0 }
  validates :status,       inclusion: { in: STATUSES }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where.not(status: "cancelled") }

  def total_price_brl = total_price_cents.to_f / 100
  def unit_price_brl  = unit_price_cents.to_f / 100
end
