require "rails_helper"

RSpec.describe "Authentication", type: :request do
  let!(:company) { create_company }
  let!(:master) { create_user(email: "master@example.com", role: "super_admin") }
  let!(:store_user) { create_user(email: "loja@example.com") }

  before { add_member(store_user, company) }

  it "logs in a master user" do
    post "/api/v1/auth/login", params: { email: master.email, password: "admin123456" }

    expect(response).to have_http_status(:ok)
    expect(json["token"]).to be_present
    expect(json.dig("user", "global_role")).to eq("super_admin")
  end

  it "logs in a store user with company membership" do
    post "/api/v1/auth/login", params: { email: store_user.email, password: "admin123456" }

    expect(response).to have_http_status(:ok)
    expect(json.dig("user", "company_members", 0, "company_id")).to eq(company.id)
  end

  it "blocks a store user from master endpoints" do
    get "/api/v1/master/companies", headers: auth_headers(store_user)

    expect(response).to have_http_status(:forbidden)
  end

  it "blocks a master user without the required permission" do
    role = MasterRole.create!(name: "Leitor", key: "reader-#{SecureRandom.hex(2)}", permissions: {}, status: "active")
    restricted = create_user(email: "restricted@example.com", master_role: role)

    get "/api/v1/master/companies", headers: auth_headers(restricted)

    expect(response).to have_http_status(:forbidden)
  end
end
