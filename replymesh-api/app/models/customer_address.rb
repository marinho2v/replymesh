class CustomerAddress < ApplicationRecord
  belongs_to :company
  belongs_to :customer

  scope :for_company, ->(cid) { where(company_id: cid) }
  scope :default_first, -> { order(is_default: :desc) }

  def full_address
    [street, number, complement, neighborhood, city, state].compact.join(", ")
  end
end
