class FounderSignupMailer < ApplicationMailer
  def confirmation_code(attempt_id, code)
    @attempt = FounderSignupAttempt.find(attempt_id)
    @code = code
    mail(to: @attempt.email, subject: "Seu código de confirmação Replymesh")
  end
end
