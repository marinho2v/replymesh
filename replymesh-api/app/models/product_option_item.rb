class ProductOptionItem < ApplicationRecord
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :menu, :products, :featured_products, :ai_context, :business_intelligence, :replymesh_strategy

  belongs_to :company
  belongs_to :product_option_group

  validates :name, presence: true
  validates :additional_price_cents,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(is_active: true) }
  scope :ordered,    -> { order(:sort_order) }

  def additional_price_brl = additional_price_cents.to_f / 100
end
