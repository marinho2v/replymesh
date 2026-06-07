class TableSession < ApplicationRecord
  STATUSES         = %w[open sent_to_kitchen waiting_payment paid closed cancelled].freeze
  PAYMENT_STATUSES = %w[pending paid refunded cancelled].freeze

  belongs_to :company
  belongs_to :dining_table
  belongs_to :order,      optional: true
  belongs_to :opened_by,  class_name: "User", optional: true
  belongs_to :attendant,  class_name: "User", optional: true
  belongs_to :closed_by,  class_name: "User", optional: true

  validates :status,         inclusion: { in: STATUSES }
  validates :payment_status, inclusion: { in: PAYMENT_STATUSES }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :open,       -> { where(status: "open") }
  scope :recent,     -> { order(opened_at: :desc) }

  def total_brl    = total_cents.to_f / 100
  def subtotal_brl = subtotal_cents.to_f / 100
  def open?        = status == "open"
  def paid?        = payment_status == "paid"
end
