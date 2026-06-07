class DiningTable < ApplicationRecord
  QR_TOKEN_BYTES = 18
  STATUSES = %w[available occupied preparing waiting_payment closed disabled].freeze

  belongs_to :company
  has_many   :table_sessions
  has_many   :orders, foreign_key: :dining_table_id

  validates :number, presence: true
  validates :slug,   presence: true, uniqueness: { scope: :company_id }
  validates :status, inclusion: { in: STATUSES }

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(is_active: true) }
  scope :available,  -> { where(status: "available") }
  scope :ordered,    -> { order(:sort_order, :number) }

  before_validation :auto_slug
  before_validation :ensure_qr_token

  def available? = status == "available"
  def occupied?  = status == "occupied"

  def regenerate_qr_token!
    update!(
      qr_token: generated_qr_token,
      qr_generated_at: Time.current,
      qr_updated_at: Time.current
    )
  end

  private

  def auto_slug
    self.slug ||= "mesa-#{number}" if number.present?
  end

  def ensure_qr_token
    return if qr_token.present?

    self.qr_token = generated_qr_token
    self.qr_generated_at ||= Time.current
    self.qr_updated_at ||= Time.current
  end

  def generated_qr_token
    loop do
      token = SecureRandom.urlsafe_base64(QR_TOKEN_BYTES).delete("-_")[0, 24].downcase
      break token unless self.class.where(company_id: company_id, qr_token: token).where.not(id: id).exists?
    end
  end
end
