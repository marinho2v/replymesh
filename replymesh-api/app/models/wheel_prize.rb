class WheelPrize < ApplicationRecord
  include CloudStorageBacked
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :promotions, :store

  PRIZE_TYPES = %w[percentage fixed coupon_percentage coupon_fixed free_shipping free_item no_prize].freeze

  belongs_to :company
  has_many :wheel_spins, dependent: :nullify

  validates :name, :prize_type, presence: true
  validates :prize_type, inclusion: { in: PRIZE_TYPES }
  validates :discount_value, numericality: { greater_than_or_equal_to: 0 }
  validates :probability_weight, numericality: { greater_than_or_equal_to: 0 }
  validates :coupon_valid_days, numericality: { greater_than: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active, -> { where(is_active: true) }
  scope :available, -> { active.where("max_total_wins IS NULL OR current_wins < max_total_wins") }
  scope :canonical_order, -> { order(:sort_order, :id) }

  cloud_storage_fields :image_storage_key

  def exhausted?
    max_total_wins.present? && current_wins >= max_total_wins
  end

  def coupon_discount_type
    case prize_type
    when "coupon_percentage" then "percentage"
    when "coupon_fixed" then "fixed"
    when "no_prize" then nil
    else prize_type
    end
  end
end
