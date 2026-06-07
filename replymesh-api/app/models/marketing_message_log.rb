class MarketingMessageLog < ApplicationRecord
  STATUSES = %w[pending sent failed].freeze

  belongs_to :company
  belongs_to :customer, optional: true
  belongs_to :marketing_campaign, optional: true

  validates :phone, :message, :provider, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :for_company, ->(company_id) { where(company_id: company_id) }
end
