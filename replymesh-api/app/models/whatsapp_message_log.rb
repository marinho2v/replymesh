class WhatsappMessageLog < ApplicationRecord
  PROVIDERS    = %w[evolution_go wasender zapi manual].freeze
  SEND_STATUSES = %w[sent error skipped].freeze

  belongs_to :company
  belongs_to :order,   optional: true
  belongs_to :sent_by, class_name: "User", optional: true

  validates :provider,     inclusion: { in: PROVIDERS }
  validates :phone,        presence: true
  validates :send_status,  inclusion: { in: SEND_STATUSES }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :sent,       -> { where(send_status: "sent") }
  scope :errors,     -> { where(send_status: "error") }
  scope :recent,     -> { order(created_at: :desc) }
end
