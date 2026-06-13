class Motoboy < ApplicationRecord
  belongs_to :company
  belongs_to :user, optional: true
  has_many   :orders, foreign_key: :motoboy_id
  has_many   :delivery_histories
  has_many   :motoboy_financial_adjustments, dependent: :destroy

  validates :name, presence: true

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(active: true) }
  scope :available,  -> { active.where(is_available: true) }

  before_validation :normalize_phone

  validates :phone, uniqueness: { scope: :company_id }, allow_blank: true

  def increment_deliveries! = increment!(:total_deliveries)

  private

  def normalize_phone
    self.phone = PhoneNormalizer.local_br(phone) if phone.present?
  end
end
