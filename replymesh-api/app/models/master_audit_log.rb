class MasterAuditLog < ApplicationRecord
  STATUSES = %w[success denied failed].freeze

  belongs_to :actor, class_name: "User", optional: true
  belongs_to :company, optional: true

  validates :action, :module_name, :status, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :recent, -> { order(created_at: :desc) }
end
