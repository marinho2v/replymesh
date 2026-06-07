class ActivityLog < ApplicationRecord
  belongs_to :company, optional: true
  belongs_to :user, optional: true

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }
end
