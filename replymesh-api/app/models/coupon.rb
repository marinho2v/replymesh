class Coupon < ApplicationRecord
  include CloudStorageBacked
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :promotions, :store, :ai_context, :dashboard, :sales_coach, :sales_coach_learning, :business_intelligence, :replymesh_brain

  DISCOUNT_TYPES = %w[percentage fixed free_shipping free_item].freeze

  belongs_to :company
  belongs_to :customer, optional: true
  has_many   :orders
  has_many   :wheel_spins, dependent: :nullify

  validates :code,          presence: true, uniqueness: { scope: :company_id }
  validates :title,         presence: true
  validates :discount_type, inclusion: { in: DISCOUNT_TYPES }
  validates :discount_value, numericality: { greater_than_or_equal_to: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(is_active: true) }
  scope :valid_now,  -> { active.where("starts_at IS NULL OR starts_at <= ?", Time.current)
                              .where("expires_at IS NULL OR expires_at >= ?", Time.current) }
  scope :manual, -> { where(source: "manual") }
  scope :wheel, -> { where(source: "wheel") }

  cloud_storage_fields :image_storage_key

  def exhausted?   = max_uses.present? && used_count >= max_uses
  def increment_usage! = increment!(:used_count)
end
