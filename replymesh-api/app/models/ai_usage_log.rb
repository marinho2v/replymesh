class AiUsageLog < ApplicationRecord
  belongs_to :company, optional: true
  belongs_to :user, optional: true

  validates :assistant_type, inclusion: { in: %w[carina store_ai] }
  validates :status, inclusion: { in: %w[success fallback blocked gap error limited disabled] }

  scope :today_for_company, ->(company_id) {
    where(company_id: company_id, created_at: Time.current.all_day)
  }
end
