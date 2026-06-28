class SmtpSetting < ApplicationRecord
  DEFAULT_HOST = "smtp.hostinger.com"
  DEFAULT_PORT = 465
  DEFAULT_AUTHENTICATION = "login"
  DEFAULT_FROM_NAME = "Replymesh"

  before_validation :fill_defaults

  validates :host, :port, :authentication, :from_name, presence: true
  validates :port, numericality: { only_integer: true, greater_than: 0, less_than: 65_536 }
  validates :from_email, :username, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :test_recipient, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  def self.current
    first_or_create!
  end

  def self.current_safe
    current
  rescue ActiveRecord::StatementInvalid, ActiveRecord::NoDatabaseError
    new
  end

  def configured?
    enabled? && host.present? && port.present? && username.present? && password.present? && from_email.present?
  end

  def password=(value)
    return if value.nil?
    return if value.to_s.strip.blank?
    return if value.to_s.include?("****")

    self.password_encrypted = self.class.encrypt_secret(value.to_s)
  end

  def password
    return nil if password_encrypted.blank?

    self.class.decrypt_secret(password_encrypted)
  rescue StandardError
    nil
  end

  def password_configured?
    password.present?
  end

  def delivery_options
    return {} unless configured?

    {
      address: host,
      port: port,
      user_name: username,
      password: password,
      authentication: authentication,
      ssl: ssl,
      enable_starttls_auto: enable_starttls_auto
    }
  end

  def from_address
    email = from_email.presence || ENV.fetch("MAIL_FROM", "suporte@replymesh.cloud")
    name = from_name.presence || ENV.fetch("MAIL_FROM_NAME", DEFAULT_FROM_NAME)
    "#{name} <#{email}>"
  end

  def as_json_safe
    {
      id: id,
      enabled: enabled,
      host: host,
      port: port,
      authentication: authentication,
      ssl: ssl,
      enable_starttls_auto: enable_starttls_auto,
      username: username,
      password_configured: password_configured?,
      from_email: from_email,
      from_name: from_name,
      reply_to: reply_to,
      test_recipient: test_recipient,
      configured: configured?,
      last_tested_at: last_tested_at,
      last_test_status: last_test_status,
      last_test_message: last_test_message,
      updated_at: updated_at
    }
  end

  def self.encrypt_secret(value)
    encryptor.encrypt_and_sign(value)
  end

  def self.decrypt_secret(value)
    encryptor.decrypt_and_verify(value)
  end

  def self.encryptor
    secret = Rails.application.secret_key_base
    salt = "replymesh-smtp-secret-v1"
    key = ActiveSupport::KeyGenerator.new(secret).generate_key(salt, 32)
    ActiveSupport::MessageEncryptor.new(key)
  end

  private

  def fill_defaults
    self.host = DEFAULT_HOST if host.blank?
    self.port = DEFAULT_PORT if port.blank?
    self.authentication = DEFAULT_AUTHENTICATION if authentication.blank?
    self.from_name = DEFAULT_FROM_NAME if from_name.blank?
  end
end
