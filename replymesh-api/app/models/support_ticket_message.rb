class SupportTicketMessage < ApplicationRecord
  belongs_to :support_ticket
  belongs_to :user, optional: true

  validates :message, presence: true
end
