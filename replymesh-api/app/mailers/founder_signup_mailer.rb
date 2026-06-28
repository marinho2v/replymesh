class FounderSignupMailer < ApplicationMailer
  def confirmation_code(attempt_id, code)
    @attempt = FounderSignupAttempt.find(attempt_id)
    @code = code
    @expires_in_minutes = FounderSignupService::CODE_TTL.to_i / 60
    setting = SmtpSetting.current_safe
    mail_options = {
      to: @attempt.email,
      from: setting.from_address,
      subject: "Seu código de confirmação Replymesh"
    }
    mail_options[:reply_to] = setting.reply_to if setting.reply_to.present?
    mail_options[:delivery_method_options] = setting.delivery_options if setting.configured?

    mail(mail_options)
  end
end
