class SystemAlert < ApplicationRecord
  LEVELS = %w[info warning error critical].freeze

  belongs_to :company, optional: true
  belongs_to :resolved_by, class_name: "User", optional: true

  validates :level, :title, :message, presence: true
  validates :level, inclusion: { in: LEVELS }

  scope :unresolved, -> { where(resolved_at: nil) }
  scope :resolved, -> { where.not(resolved_at: nil) }

  def resolved?
    resolved_at.present?
  end
end
