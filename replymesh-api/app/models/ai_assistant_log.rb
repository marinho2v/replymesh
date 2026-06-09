class AiAssistantLog < ApplicationRecord
  STATUSES = %w[success blocked gap error limited disabled].freeze

  belongs_to :company, optional: true
  belongs_to :user, optional: true

  validates :status, inclusion: { in: STATUSES }

  scope :today_for_company, ->(company_id) {
    where(company_id: company_id, created_at: Time.current.beginning_of_day..Time.current.end_of_day)
  }

  scope :last_minute_for_user, ->(user_id) {
    where(user_id: user_id, created_at: 1.minute.ago..Time.current)
  }

  scope :conversation_for, ->(company_id, user_id) {
    where(company_id: company_id, user_id: user_id)
      .where(status: %w[success blocked])
      .order(created_at: :desc)
  }
end
