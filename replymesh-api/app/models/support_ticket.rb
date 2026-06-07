class SupportTicket < ApplicationRecord
  STATUSES = %w[open pending resolved closed].freeze
  PRIORITIES = %w[low normal high urgent].freeze

  belongs_to :company
  belongs_to :user, optional: true
  has_many :support_ticket_messages, dependent: :destroy

  scope :for_company, ->(company_id) { where(company_id: company_id) }
  scope :recent, -> { order(created_at: :desc) }

  validates :subject, :message, :priority, :status, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :priority, inclusion: { in: PRIORITIES }

  before_save :stamp_resolution_state

  private

  def stamp_resolution_state
    return unless will_save_change_to_status?

    self.resolved_at ||= Time.current if status == "resolved"
    self.closed_at ||= Time.current if status == "closed"
  end
end
