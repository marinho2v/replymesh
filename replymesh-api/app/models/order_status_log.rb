class OrderStatusLog < ApplicationRecord
  belongs_to :company
  belongs_to :order
  belongs_to :changed_by, class_name: "User", optional: true

  validates :new_status, presence: true

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :for_order,   ->(oid) { where(order_id: oid).order(:created_at) }
end
