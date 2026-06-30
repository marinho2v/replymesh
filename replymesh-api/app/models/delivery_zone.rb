class DeliveryZone < ApplicationRecord
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :delivery, :delivery_zones, :store, :ai_context
  belongs_to :company
  has_many   :orders

  validates :name,               presence: true
  validates :slug,               presence: true, uniqueness: { scope: :company_id }
  validates :delivery_fee_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :estimated_minutes,  numericality: { only_integer: true, greater_than: 0 }
  validates :estimated_distance_km, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :latitude, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }, allow_nil: true
  validates :longitude, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }, allow_nil: true

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(is_active: true) }
  scope :by_priority, -> { order(match_priority: :desc) }

  def delivery_fee_brl = delivery_fee_cents.to_f / 100
end
