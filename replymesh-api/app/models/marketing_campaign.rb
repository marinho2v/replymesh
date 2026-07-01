class MarketingCampaign < ApplicationRecord
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :promotions, :dashboard, :ai_context

  STATUSES = %w[draft active paused completed cancelled].freeze

  belongs_to :company
  has_many   :marketing_campaign_recipients, dependent: :destroy
  has_many   :marketing_message_logs, dependent: :nullify

  validates :title,       presence: true
  validates :status,      inclusion: { in: STATUSES }
  validates :daily_limit, numericality: { only_integer: true, greater_than: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(status: "active") }
end
