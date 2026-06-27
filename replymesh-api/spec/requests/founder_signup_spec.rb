require "rails_helper"

RSpec.describe "Programa Fundadores", type: :request do
  before do
    host! "localhost"
    FounderProgramSetting.delete_all
    FounderProgramSetting.create!(
      enabled: true,
      allow_signups: true,
      signup_limit: 2,
      started_at: 1.minute.ago,
      default_modules: FounderProgramSetting::DEFAULT_MODULES
    )
    allow(SecureRandom).to receive(:random_number).and_return(123_456)
    allow(FounderSignupMailer).to receive_message_chain(:confirmation_code, :deliver_now)
  end

  let(:signup) do
    {
      responsible_name: "Maria Fundadora",
      email: "maria.fundadora@example.com",
      phone: "21999998888",
      password: "SenhaSegura@123",
      password_confirmation: "SenhaSegura@123",
      company_name: "Lanches da Maria",
      business_type: "Hamburgueria",
      city: "Rio de Janeiro",
      state: "RJ",
      slug: "lanches-maria",
      accepted_terms: true,
      website: ""
    }
  end

  it "cria somente o cadastro pendente antes da confirmação" do
    company_count = Company.count
    expect {
      post "/api/v1/public/founder_signups", params: { signup: signup }
    }.to change(FounderSignupAttempt, :count).by(1)

    expect(response).to have_http_status(:ok)
    expect(Company.count).to eq(company_count)
    expect(FounderSignupAttempt.last.code_digest).not_to eq("123456")
  end

  it "confirma o código e cria empresa fundadora isolada" do
    post "/api/v1/public/founder_signups", params: { signup: signup }
    signup_id = JSON.parse(response.body).fetch("signup_id")

    company_count = Company.count
    post "/api/v1/public/founder_signups/verify", params: { signup_id:, code: "123456" }
    expect(response).to have_http_status(:ok), response.body
    expect(Company.count).to eq(company_count + 1)

    company = Company.find_by!(slug: "lanches-maria")
    expect(company).to have_attributes(
      origin: "founder_program",
      commercial_status: "founder_free",
      status: "active",
      plan_status: "active"
    )
    expect(company.subscriptions.last).to have_attributes(status: "active", price_cents: 0)
    expect(company.store_setting.whatsapp_mode).to eq("manual")
    expect(FeatureGate.check(company, "store_ai")).not_to be_enabled
    expect(FeatureGate.check(company, "whatsapp_basic")).not_to be_enabled
    expect(FeatureGate.check(company, "custom_domain")).not_to be_enabled
  end

  it "bloqueia código incorreto e slug reservado" do
    post "/api/v1/public/founder_signups", params: { signup: signup.merge(slug: "admin") }
    expect(response).to have_http_status(:unprocessable_entity)

    post "/api/v1/public/founder_signups", params: { signup: signup }
    signup_id = JSON.parse(response.body).fetch("signup_id")
    post "/api/v1/public/founder_signups/verify", params: { signup_id:, code: "000000" }
    expect(response).to have_http_status(:unprocessable_entity)
    expect(Company.find_by(slug: "lanches-maria")).to be_nil
  end
end
