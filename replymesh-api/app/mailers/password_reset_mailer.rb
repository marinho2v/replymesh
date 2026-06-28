class PasswordResetMailer < ApplicationMailer
  def reset_code(request_id, code)
    @request = PasswordResetRequest.includes(:company, :user).find(request_id)
    @code = code
    mail(to: @request.email, subject: "Codigo para redefinir sua senha Replymesh")
  end
end
