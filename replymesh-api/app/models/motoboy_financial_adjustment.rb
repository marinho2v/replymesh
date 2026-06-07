class MotoboyFinancialAdjustment < ApplicationRecord
  TYPES = %w[daily_rate advance meal discount bonus adjustment].freeze
  DIRECTIONS = %w[credit debit].freeze

  belongs_to :company
  belongs_to :motoboy
  belongs_to :created_by, class_name: "User", optional: true

  validates :adjustment_type, inclusion: { in: TYPES }
  validates :direction, inclusion: { in: DIRECTIONS }
  validates :amount_cents, numericality: { greater_than: 0 }
  validates :adjustment_date, presence: true

  scope :for_company, ->(company_id) { where(company_id: company_id) }
  scope :recent, -> { order(adjustment_date: :desc, created_at: :desc) }
end
