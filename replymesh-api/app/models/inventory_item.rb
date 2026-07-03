class InventoryItem < ApplicationRecord
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :products, :dashboard, :ai_context, :business_intelligence, :product_intelligence, :replymesh_strategy

  UNITS = %w[un kg g l ml cx pct].freeze

  belongs_to :company
  has_many   :inventory_movements, dependent: :destroy
  has_many   :products, foreign_key: :stock_item_id

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: { scope: :company_id }
  validates :unit, inclusion: { in: UNITS }

  scope :for_company,  ->(cid) { where(company_id: cid) }
  scope :active,      -> { where(is_active: true) }
  scope :low_stock,   -> { where("current_quantity <= minimum_quantity") }

  before_validation :auto_slug

  def low_stock?    = current_quantity <= minimum_quantity
  def in_stock?     = current_quantity > 0

  def apply_movement!(type:, qty:, **attrs)
    before = current_quantity
    after  = case type
             when "in"     then before + qty
             when "out"    then before - qty
             when "adjust" then qty
             end

    ActiveRecord::Base.transaction do
      update!(current_quantity: after)
      inventory_movements.create!(
        company_id:      company_id,
        movement_type:   type,
        quantity:        qty,
        quantity_before: before,
        quantity_after:  after,
        **attrs
      )
    end
  end

  private

  def auto_slug
    self.slug ||= name.to_s.downcase.gsub(/[^a-z0-9]+/, "-").slice(0, 64) if name.present?
  end
end
