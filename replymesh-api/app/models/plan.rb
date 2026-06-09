class Plan < ApplicationRecord
  BILLING_CYCLES = %w[monthly yearly].freeze
  STATUSES = %w[active inactive].freeze

  has_many :subscriptions, dependent: :restrict_with_error
  has_many :companies, through: :subscriptions
  has_many :plan_features, dependent: :destroy

  normalizes :slug, with: ->(slug) { slug.strip.downcase }

  validates :name, :slug, :billing_cycle, :status, presence: true
  validates :slug, uniqueness: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }
  validates :billing_cycle, inclusion: { in: BILLING_CYCLES }
  validates :status, inclusion: { in: STATUSES }
end
