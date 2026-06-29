class PasswordResetMailer < ApplicationMailer
  def reset_code(request_id, code)
    @request = PasswordResetRequest.includes(:company, :user).find(request_id)
    @code = code
    @template = SmtpSetting.current_safe.email_template

    mail(replymesh_mail_options(to: @request.email, subject: @template[:password_reset_subject]))
  end
end
