class PaymentMethod < ApplicationRecord
  METHOD_TYPES = %w[cash pix credit_card debit_card online_payment].freeze

  belongs_to :company

  validates :name, :method_type, presence: true
  validates :method_type, inclusion: { in: METHOD_TYPES }
end
