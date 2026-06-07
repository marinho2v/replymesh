class CashSession < ApplicationRecord
  STATUSES = %w[open closed].freeze

  belongs_to :company
  belongs_to :opened_by, class_name: "User"
  belongs_to :closed_by, class_name: "User", optional: true
  has_many   :cash_movements, dependent: :destroy

  validates :status, inclusion: { in: STATUSES }
  validates :opening_amount_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :open_session, -> { where(status: "open") }
  scope :closed,       -> { where(status: "closed") }
  scope :recent,       -> { order(opened_at: :desc) }

  def open?   = status == "open"
  def closed? = status == "closed"

  def opening_amount_brl   = opening_amount_cents.to_f / 100
  def expected_balance_brl = closing_expected_cents.to_f / 100
  def difference_brl       = difference_cents.to_f / 100

  def self.current_for(company_id)
    for_company(company_id).open_session.first
  end
end
