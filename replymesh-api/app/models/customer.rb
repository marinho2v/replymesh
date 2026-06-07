class Customer < ApplicationRecord
  belongs_to :company
  has_many   :customer_addresses, dependent: :destroy
  has_many   :orders
  has_many   :wheel_spins, dependent: :destroy
  has_many   :marketing_message_logs, dependent: :nullify

  validates :full_name, presence: true
  validates :phone,     presence: true, uniqueness: { scope: :company_id }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :recurring,  -> { where(is_recurring: true) }
  scope :recent,     -> { order(last_order_at: :desc) }

  def total_spent_brl = total_spent_cents.to_f / 100

  def increment_stats!(order_total_cents)
    update_columns(
      total_orders:      total_orders + 1,
      total_spent_cents: total_spent_cents + order_total_cents.to_i,
      last_order_at:     Time.current,
      first_order_at:    first_order_at || Time.current,
      is_recurring:      (total_orders + 1) >= 2
    )
  end
end
