class FounderSignupMailer < ApplicationMailer
  def confirmation_code(attempt_id, code)
    @attempt = FounderSignupAttempt.find(attempt_id)
    @code = code
    @expires_in_minutes = FounderSignupService::CODE_TTL.to_i / 60
    @template = SmtpSetting.current_safe.email_template

    mail(replymesh_mail_options(to: @attempt.email, subject: @template[:confirmation_subject]))
  end
end
