class Order < ApplicationRecord
  include ReplymeshCacheInvalidation

  invalidates_replymesh_cache :dashboard, :statistics, :sales_coach

  ORDER_TYPES       = %w[delivery pickup dine_in pos].freeze
  STATUSES          = %w[pending accepted preparing ready out_for_delivery completed cancelled].freeze
  PAYMENT_METHODS   = %w[money pix card_on_delivery].freeze
  PAYMENT_STATUSES  = %w[not_required pending_payment pending paid failed expired refunded cancelled].freeze
  DELIVERY_STATUSES = %w[pending assigned on_the_way delivered cancelled].freeze

  belongs_to :company
  belongs_to :customer,      optional: true
  belongs_to :delivery_zone, optional: true
  belongs_to :motoboy,       optional: true
  belongs_to :coupon,        optional: true
  belongs_to :dining_table,  optional: true
  belongs_to :attendant,     class_name: "User", optional: true
  has_many   :order_items,          dependent: :destroy
  has_one    :order_payment_detail, dependent: :destroy
  has_many   :order_status_logs,    dependent: :destroy
  has_one    :delivery_history,     dependent: :destroy
  has_many   :cash_movements
  has_many   :whatsapp_message_logs
  has_one    :table_session, foreign_key: :order_id, inverse_of: :order

  validates :order_type,       inclusion: { in: ORDER_TYPES }
  validates :status,           inclusion: { in: STATUSES }
  validates :payment_method,   inclusion: { in: PAYMENT_METHODS }
  validates :payment_status,   inclusion: { in: PAYMENT_STATUSES }
  validates :delivery_status,  inclusion: { in: DELIVERY_STATUSES }
  validates :subtotal_cents, :delivery_fee_cents, :discount_cents, :total_cents,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :recent,     -> { order(created_at: :desc) }
  scope :active,     -> { where.not(status: %w[completed cancelled]) }
  scope :by_status,  ->(s) { where(status: s) }
  scope :today,      -> { where(created_at: Time.current.beginning_of_day..Time.current.end_of_day) }

  before_validation :assign_public_token, on: :create
  before_create :assign_order_number

  def total_brl    = total_cents.to_f / 100
  def subtotal_brl = subtotal_cents.to_f / 100
  def delivery?    = order_type == "delivery"
  def dine_in?     = order_type == "dine_in"
  def pickup?      = order_type == "pickup"
  def pos?         = order_type == "pos"
  def pending?     = status == "pending"
  def completed?   = status == "completed"
  def cancelled?   = status == "cancelled"

  private

  def assign_public_token
    self.public_token = SecureRandom.urlsafe_base64(18) if public_token.blank?
  end

  def assign_order_number
    result = self.class.connection.execute(
      "UPDATE companies SET store_order_counter = store_order_counter + 1 " \
      "WHERE id = #{company_id} RETURNING store_order_counter"
    )
    self.order_number = result.first["store_order_counter"]
  end
end
