class ApplicationMailer < ActionMailer::Base
  default from: -> { "#{ENV.fetch('MAIL_FROM_NAME', 'Replymesh')} <#{ENV.fetch('MAIL_FROM', 'suporte@replymesh.cloud')}>" }
  layout "mailer"

  private

  def replymesh_mail_options(to:, subject:)
    setting = SmtpSetting.current_safe
    options = {
      to:,
      from: setting.from_address,
      subject:
    }
    options[:reply_to] = setting.reply_to if setting.reply_to.present?
    options[:delivery_method_options] = if setting.configured?
      setting.delivery_options
    elsif SmtpSetting.env_configured?
      SmtpSetting.env_delivery_options
    end
    options.compact
  end
end
