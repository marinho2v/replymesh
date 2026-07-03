class Product < ApplicationRecord
  include CloudStorageBacked
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :menu, :products, :featured_products, :promotions, :store, :ai_context, :sales_coach, :sales_coach_learning, :business_intelligence, :customer_intelligence, :replymesh_brain, :replymesh_strategy

  belongs_to :company
  belongs_to :category
  belongs_to :stock_item, class_name: "InventoryItem", optional: true
  has_many   :product_option_groups, dependent: :destroy
  has_many   :order_items

  validates :name, presence: { message: "deve ser informado" }
  validates :slug,
            presence: { message: "nao pode ficar vazio" },
            uniqueness: {
              scope: :company_id,
              message: "ja esta em uso por outro produto desta loja"
            }
  validates :price_cents,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0,
              message: "deve ser um valor valido"
            }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(is_active: true) }
  scope :featured,   -> { where(is_featured: true) }
  scope :ordered,    -> { order(:sort_order, :name) }

  before_validation :auto_slug
  cloud_storage_fields :image_storage_key

  def price_brl   = price_cents.to_f / 100
  def cost_brl    = cost_price_cents.to_f / 100
  def margin_percent
    return 0 if price_cents.to_i.zero?
    ((price_cents - cost_price_cents.to_i) / price_cents.to_f * 100).round(1)
  end

  private

  def auto_slug
    return if slug.present? || name.blank?

    base = (name.to_s.parameterize.presence || "produto").slice(0, 56)
    candidate = base
    suffix = 2

    while company&.products&.where(slug: candidate)&.where&.not(id: id)&.exists?
      candidate = "#{base}-#{suffix}".slice(0, 64)
      suffix += 1
    end

    self.slug = candidate
  end
end
