class Product < ApplicationRecord
  belongs_to :company
  belongs_to :category
  belongs_to :stock_item, class_name: "InventoryItem", optional: true
  has_many   :product_option_groups, dependent: :destroy
  has_many   :order_items

  validates :name,        presence: true
  validates :slug,        presence: true, uniqueness: { scope: :company_id }
  validates :price_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(is_active: true) }
  scope :featured,   -> { where(is_featured: true) }
  scope :ordered,    -> { order(:sort_order, :name) }

  before_validation :auto_slug

  def price_brl   = price_cents.to_f / 100
  def cost_brl    = cost_price_cents.to_f / 100
  def margin_percent
    return 0 if price_cents.to_i.zero?
    ((price_cents - cost_price_cents.to_i) / price_cents.to_f * 100).round(1)
  end

  private

  def auto_slug
    self.slug ||= name.to_s.downcase.gsub(/[^a-z0-9]+/, "-").slice(0, 64) if name.present?
  end
end
