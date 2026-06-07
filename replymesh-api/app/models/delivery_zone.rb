class DeliveryZone < ApplicationRecord
  belongs_to :company
  has_many   :orders

  validates :name,               presence: true
  validates :slug,               presence: true, uniqueness: { scope: :company_id }
  validates :delivery_fee_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :estimated_minutes,  numericality: { only_integer: true, greater_than: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(is_active: true) }
  scope :by_priority, -> { order(match_priority: :desc) }

  def delivery_fee_brl = delivery_fee_cents.to_f / 100
end
