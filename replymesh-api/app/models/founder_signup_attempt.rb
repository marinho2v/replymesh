class FounderSignupAttempt < ApplicationRecord
  has_secure_password

  STATUSES = %w[pending confirmed expired blocked].freeze

  normalizes :email, with: ->(value) { value.strip.downcase }
  normalizes :phone, with: ->(value) { value.gsub(/\D/, "") }
  normalizes :slug, with: ->(value) { CompanyDomainService.normalize_slug(value) }

  validates :responsible_name, :email, :phone, :company_name, :business_type,
            :city, :state, :slug, :code_digest, :expires_at, :last_sent_at, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :phone, format: { with: /\A\d{10,13}\z/ }
  validates :password, length: { minimum: 10 }, format: {
    with: /\A(?=.*[A-Za-z])(?=.*\d).+\z/,
    message: "deve ter letras e números"
  }, on: :create
  validates :state, format: { with: /\A[A-Za-z]{2}\z/ }
  validates :status, inclusion: { in: STATUSES }
  validate :slug_must_be_available, on: :create

  def code_matches?(code)
    BCrypt::Password.new(code_digest).is_password?(code.to_s)
  rescue BCrypt::Errors::InvalidHash
    false
  end

  def expired?
    expires_at < Time.current
  end

  private

  def slug_must_be_available
    return if slug.blank?
    errors.add(:slug, "reservado") if CompanyDomainService.reserved_slug?(slug)
    errors.add(:slug, "já está em uso") if Company.exists?(slug: slug)
  end
end
