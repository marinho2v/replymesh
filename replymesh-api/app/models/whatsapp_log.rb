class WhatsappLog < ApplicationRecord
  LEVELS = %w[ok info warn err].freeze

  belongs_to :company
  belongs_to :whatsapp_instance, optional: true

  validates :level, :message, presence: true
  validates :level, inclusion: { in: LEVELS }
end
