class InventoryMovement < ApplicationRecord
  TYPES   = %w[in out adjust].freeze
  SOURCES = %w[manual pedido cancelamento ajuste].freeze

  belongs_to :company
  belongs_to :inventory_item
  belongs_to :user, optional: true

  validates :movement_type, inclusion: { in: TYPES }
  validates :source,        inclusion: { in: SOURCES }
  validates :quantity,      numericality: { greater_than: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :inbound,    -> { where(movement_type: "in") }
  scope :outbound,   -> { where(movement_type: "out") }
  scope :recent,     -> { order(created_at: :desc) }
end
