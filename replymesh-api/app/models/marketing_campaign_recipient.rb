class MarketingCampaignRecipient < ApplicationRecord
  STATUSES = %w[pending sent failed opted_out].freeze

  belongs_to :company
  belongs_to :marketing_campaign
  belongs_to :customer, optional: true

  validates :phone,  presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :pending,    -> { where(status: "pending") }
  scope :sent,       -> { where(status: "sent") }
end
