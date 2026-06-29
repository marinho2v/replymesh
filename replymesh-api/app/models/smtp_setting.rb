class SmtpSetting < ApplicationRecord
  DEFAULT_HOST = "smtp.hostinger.com"
  DEFAULT_PORT = 465
  DEFAULT_AUTHENTICATION = "login"
  DEFAULT_FROM_NAME = "Replymesh"
  DEFAULT_PRIMARY_COLOR = "#090a0d"
  DEFAULT_FOOTER_TEXT = "Equipe Replymesh"
  DEFAULT_CONFIRMATION_SUBJECT = "Seu código de confirmação Replymesh"
  DEFAULT_CONFIRMATION_TITLE = "Confirme seu cadastro"
  DEFAULT_CONFIRMATION_INTRO = "Use o código abaixo para confirmar seu e-mail e criar sua loja no Programa Fundadores."
  DEFAULT_PASSWORD_RESET_SUBJECT = "Código para redefinir sua senha Replymesh"
  DEFAULT_PASSWORD_RESET_TITLE = "Redefinir senha"
  DEFAULT_PASSWORD_RESET_INTRO = "Recebemos uma solicitação para redefinir a senha do painel da loja."

  before_validation :fill_defaults

  validates :host, :port, :authentication, :from_name, presence: true
  validates :port, numericality: { only_integer: true, greater_than: 0, less_than: 65_536 }
  validates :from_email, :username, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :test_recipient, allow_blank: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email_template_logo_url, allow_blank: true, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]) }
  validates :email_template_primary_color, format: { with: /\A#[0-9a-fA-F]{6}\z/ }

  def self.current
    first_or_create!
  end

  def self.current_safe
    current
  rescue ActiveRecord::StatementInvalid, ActiveRecord::NoDatabaseError
    new
  end

  def self.ready?
    current_safe.configured? || env_configured?
  end

  def self.env_configured?
    ENV["SMTP_USERNAME"].present? && ENV["SMTP_PASSWORD"].present?
  end

  def self.env_delivery_options
    return {} unless env_configured?

    boolean = ActiveModel::Type::Boolean.new
    {
      address: ENV.fetch("SMTP_HOST", DEFAULT_HOST),
      port: ENV.fetch("SMTP_PORT", DEFAULT_PORT).to_i,
      user_name: ENV["SMTP_USERNAME"],
      password: ENV["SMTP_PASSWORD"],
      authentication: ENV.fetch("SMTP_AUTHENTICATION", DEFAULT_AUTHENTICATION),
      ssl: boolean.cast(ENV.fetch("SMTP_SSL", "true")),
      enable_starttls_auto: boolean.cast(ENV.fetch("SMTP_ENABLE_STARTTLS_AUTO", "false"))
    }
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

  def email_template
    {
      brand_name: email_template_brand_name.presence || from_name.presence || DEFAULT_FROM_NAME,
      logo_url: email_template_logo_url,
      primary_color: email_template_primary_color.presence || DEFAULT_PRIMARY_COLOR,
      footer_text: email_template_footer_text.presence || DEFAULT_FOOTER_TEXT,
      confirmation_subject: confirmation_email_subject.presence || DEFAULT_CONFIRMATION_SUBJECT,
      confirmation_title: confirmation_email_title.presence || DEFAULT_CONFIRMATION_TITLE,
      confirmation_intro: confirmation_email_intro.presence || DEFAULT_CONFIRMATION_INTRO,
      password_reset_subject: password_reset_email_subject.presence || DEFAULT_PASSWORD_RESET_SUBJECT,
      password_reset_title: password_reset_email_title.presence || DEFAULT_PASSWORD_RESET_TITLE,
      password_reset_intro: password_reset_email_intro.presence || DEFAULT_PASSWORD_RESET_INTRO
    }
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
      email_template_brand_name: email_template[:brand_name],
      email_template_logo_url: email_template[:logo_url],
      email_template_primary_color: email_template[:primary_color],
      email_template_footer_text: email_template[:footer_text],
      confirmation_email_subject: email_template[:confirmation_subject],
      confirmation_email_title: email_template[:confirmation_title],
      confirmation_email_intro: email_template[:confirmation_intro],
      password_reset_email_subject: email_template[:password_reset_subject],
      password_reset_email_title: email_template[:password_reset_title],
      password_reset_email_intro: email_template[:password_reset_intro],
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
    self.email_template_primary_color = DEFAULT_PRIMARY_COLOR if email_template_primary_color.blank?
  end
end
