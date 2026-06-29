require "rails_helper"

RSpec.describe PasswordResetService do
  let!(:company) { create_company(name: "Loja Reset", slug: "loja-reset") }
  let!(:user) { create_user(email: "admin@loja-reset.local", password: "senhaantiga123") }
  let(:request) { instance_double(ActionDispatch::Request, remote_ip: "127.0.0.1", user_agent: "RSpec") }

  before do
    add_member(user, company)
    ActionMailer::Base.deliveries.clear
    ActionMailer::Base.delivery_method = :test
    SmtpSetting.delete_all
  end

  it "does not promise a code when SMTP is not configured" do
    result = described_class.start(email: user.email, company_slug: company.slug, request:)

    expect(result).not_to be_success
    expect(result.errors.join).to include("SMTP nao configurado")
    expect(ActionMailer::Base.deliveries).to be_empty
  end

  it "sends the reset code using the Master SMTP sender" do
    SmtpSetting.current.update!(
      enabled: true,
      host: "smtp.hostinger.com",
      port: 465,
      authentication: "login",
      ssl: true,
      enable_starttls_auto: false,
      username: "suporte@replymesh.cloud",
      password: "smtp-password-test",
      from_email: "suporte@replymesh.cloud",
      from_name: "Replymesh"
    )

    result = described_class.start(email: user.email, company_slug: company.slug, request:)

    expect(result).to be_success
    expect(ActionMailer::Base.deliveries.size).to eq(1)
    mail = ActionMailer::Base.deliveries.last
    expect(mail.to).to eq([user.email])
    expect(mail.from).to eq(["suporte@replymesh.cloud"])
    expect(mail.subject).to eq("Código para redefinir sua senha Replymesh")
    expect(mail.body.encoded).to match(/\d{6}/)
  end
end
