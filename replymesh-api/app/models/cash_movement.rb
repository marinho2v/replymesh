class CashMovement < ApplicationRecord
  TYPES = %w[sale_cash sale_pix sale_card change_given sangria reinforcement withdrawal adjustment refund].freeze

  belongs_to :company
  belongs_to :cash_session
  belongs_to :order,      optional: true
  belongs_to :created_by, class_name: "User", optional: true

  validates :movement_type,         inclusion: { in: TYPES }
  validates :amount_cents,          numericality: { only_integer: true }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :sales,      -> { where(movement_type: %w[sale_cash sale_pix sale_card]) }
  scope :cash_only,  -> { where(affects_physical_cash: true) }
  scope :recent,     -> { order(created_at: :desc) }

  def amount_brl = amount_cents.to_f / 100
end
