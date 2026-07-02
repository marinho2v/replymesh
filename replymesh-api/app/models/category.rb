class Category < ApplicationRecord
  include CloudStorageBacked
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :menu, :categories, :products, :store, :ai_context, :sales_coach

  belongs_to :company
  has_many   :products, dependent: :nullify

  validates :name,       presence: true
  validates :slug,       presence: true, uniqueness: { scope: :company_id }
  validates :sort_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(is_active: true) }
  scope :visible,    -> { where(deleted_at: nil) }
  scope :ordered,    -> { order(:sort_order, :name) }

  before_validation :auto_slug
  cloud_storage_fields :image_storage_key

  private

  def auto_slug
    self.slug ||= name.to_s.downcase.gsub(/[^a-z0-9]+/, "-").slice(0, 64) if name.present?
  end
end
