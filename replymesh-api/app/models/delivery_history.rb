class DeliveryHistory < ApplicationRecord
  self.table_name = "delivery_history"

  STATUSES = %w[assigned on_the_way delivered cancelled].freeze

  belongs_to :company
  belongs_to :order
  belongs_to :motoboy

  validates :status, inclusion: { in: STATUSES }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where.not(status: "cancelled") }
  scope :recent,     -> { order(assigned_at: :desc) }

  def delivered? = status == "delivered"
  def on_the_way? = status == "on_the_way"
end
