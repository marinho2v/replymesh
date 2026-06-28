class SmtpTestMailer < ApplicationMailer
  def test_email(recipient)
    @sent_at = Time.current
    setting = SmtpSetting.current_safe
    mail_options = {
      to: recipient,
      from: setting.from_address,
      subject: "Teste de e-mail Replymesh"
    }
    mail_options[:reply_to] = setting.reply_to if setting.reply_to.present?
    mail_options[:delivery_method_options] = setting.delivery_options if setting.configured?

    mail(mail_options)
  end
end
