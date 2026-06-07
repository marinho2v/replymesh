class OrderPaymentDetail < ApplicationRecord
  PAYMENT_METHODS = %w[money pix card_on_delivery cash card].freeze

  belongs_to :company
  belongs_to :order

  validates :payment_method, inclusion: { in: PAYMENT_METHODS }
  validates :amount_cents,   numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }

  def amount_brl = amount_cents.to_f / 100
end
