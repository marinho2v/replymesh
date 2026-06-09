class StoreAiConversation < ApplicationRecord
  belongs_to :company
  belongs_to :customer, optional: true
  has_many :store_ai_messages, dependent: :destroy

  validates :channel, inclusion: { in: %w[simulator whatsapp web] }
  validates :status, inclusion: { in: %w[open closed handed_off] }

  scope :recent_for, ->(company_id, phone) {
    where(company_id: company_id, phone: phone, status: "open").order(last_message_at: :desc)
  }

  scope :latest_for_phone, ->(company_id, phone) {
    where(company_id: company_id, phone: phone).order(last_message_at: :desc, updated_at: :desc)
  }

  def paused?
    paused_until.present? && paused_until.future?
  end

  def pause_for!(duration, reason:)
    update!(
      status: "handed_off",
      handoff_reason: reason,
      paused_until: duration.from_now,
      last_message_at: Time.current
    )
  end

  def resume_if_expired!
    return unless status == "handed_off" && paused_until.present? && paused_until.past?

    update!(status: "open", handoff_reason: nil, paused_until: nil)
  end
end
