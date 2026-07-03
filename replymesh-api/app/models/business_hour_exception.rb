class BusinessHourException < ApplicationRecord
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :business_hours, :store, :ai_context, :business_intelligence, :marketing_intelligence, :replymesh_strategy
  belongs_to :company

  validates :exception_date, presence: true, uniqueness: { scope: :company_id }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :upcoming,   -> { where("exception_date >= ?", Date.today).order(:exception_date) }
end
