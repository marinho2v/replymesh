class PasswordResetRequest < ApplicationRecord
  belongs_to :user
  belongs_to :company

  STATUSES = %w[pending used expired blocked].freeze

  validates :email, :code_digest, :status, :expires_at, presence: true
  validates :status, inclusion: { in: STATUSES }

  normalizes :email, with: ->(email) { email.strip.downcase }

  def expired?
    Time.current > expires_at
  end

  def code_matches?(code)
    BCrypt::Password.new(code_digest).is_password?(code.to_s)
  rescue BCrypt::Errors::InvalidHash
    false
  end
end
