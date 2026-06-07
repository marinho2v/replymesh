class StoreAiConversation < ApplicationRecord
  belongs_to :company
  belongs_to :customer, optional: true
  has_many :store_ai_messages, dependent: :destroy

  validates :channel, inclusion: { in: %w[simulator whatsapp web] }
  validates :status, inclusion: { in: %w[open closed handed_off] }

  scope :recent_for, ->(company_id, phone) {
    where(company_id: company_id, phone: phone, status: "open").order(last_message_at: :desc)
  }
end
