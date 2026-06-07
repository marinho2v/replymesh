class OrderAttempt < ApplicationRecord
  STATUSES = %w[created blocked duplicate rate_limited].freeze

  belongs_to :company
  belongs_to :order, optional: true

  validates :status, inclusion: { in: STATUSES }

  scope :for_company,  ->(cid) { where(company_id: cid) }
  scope :recent_by_phone, ->(cid, phone, minutes) {
    for_company(cid).where(customer_phone: phone)
                    .where("created_at >= ?", minutes.minutes.ago)
  }
  scope :recent_by_ip, ->(cid, ip, minutes) {
    for_company(cid).where(ip_address: ip)
                    .where("created_at >= ?", minutes.minutes.ago)
  }
end
