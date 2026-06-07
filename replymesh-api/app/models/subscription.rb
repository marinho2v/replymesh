class Subscription < ApplicationRecord
  STATUSES = %w[trial active overdue canceled suspended].freeze

  belongs_to :company
  belongs_to :plan

  validates :status, :started_at, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }
end
