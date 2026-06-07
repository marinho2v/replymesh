class CompanyMember < ApplicationRecord
  ROLES = %w[store_admin employee kitchen motoboy support_viewer].freeze
  STATUSES = %w[active inactive].freeze

  belongs_to :company
  belongs_to :user

  validates :role, :status, presence: true
  validates :role, inclusion: { in: ROLES }
  validates :status, inclusion: { in: STATUSES }
  validates :user_id, uniqueness: { scope: :company_id }

  scope :active, -> { where(status: "active") }
end
