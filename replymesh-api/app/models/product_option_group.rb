class ProductOptionGroup < ApplicationRecord
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :menu, :products, :featured_products, :ai_context, :business_intelligence, :product_intelligence, :replymesh_strategy

  TYPES = %w[single multiple].freeze

  belongs_to :company
  belongs_to :product
  has_many   :product_option_items, dependent: :destroy

  validates :name,       presence: true
  validates :group_type, inclusion: { in: TYPES }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :ordered,     -> { order(:sort_order) }
end
