class AppBanner < ApplicationRecord
  include CloudStorageBacked
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :banners, :store, :ai_context, :business_intelligence, :replymesh_strategy

  belongs_to :company

  validates :title, presence: true

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(is_active: true) }
  scope :ordered,    -> { order(:sort_order, :created_at) }

  cloud_storage_fields :image_storage_key
end
