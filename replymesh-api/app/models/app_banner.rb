class AppBanner < ApplicationRecord
  belongs_to :company

  validates :title, presence: true

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :active,     -> { where(is_active: true) }
  scope :ordered,    -> { order(:sort_order, :created_at) }
end
