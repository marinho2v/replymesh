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
    expect(json["error"]).to eq("master_forbidden")
  end

  it "blocks a master role user from master endpoints" do
    role = MasterRole.create!(name: "Leitor", key: "reader-#{SecureRandom.hex(2)}", permissions: {}, status: "active")
    restricted = create_user(email: "restricted@example.com", master_role: role)

    get "/api/v1/master/companies", headers: auth_headers(restricted)

    expect(response).to have_http_status(:forbidden)
    expect(json["error"]).to eq("master_forbidden")
  end

  it "allows a master role user when the permission is granted" do
    role = MasterRole.create!(
      name: "Empresas",
      key: "companies-#{SecureRandom.hex(2)}",
      permissions: { "companies.view" => true },
      status: "active"
    )
    master_user = create_user(email: "companies-reader@example.com", master_role: role)

    get "/api/v1/master/companies", headers: auth_headers(master_user)

    expect(response).to have_http_status(:ok)
  end

  it "releases the email when a master user is removed" do
    role = MasterRole.create!(
      name: "Usuarios",
      key: "users-#{SecureRandom.hex(2)}",
      permissions: { "users.edit" => true },
      status: "active"
    )
    target = create_user(email: "removed-master@example.com", master_role: role)

    delete "/api/v1/master/users/#{target.id}", headers: auth_headers(master)

    expect(response).to have_http_status(:ok)
    expect(target.reload.email).to start_with("deleted+")
    expect(User.create!(name: "Novo Master", email: "removed-master@example.com", password: "admin123456", global_role: "user", status: "active", master_role: role)).to be_persisted
  end

  it "releases the email when a store user has no active company membership" do
    delete "/api/v1/store/users/#{store_user.id}", headers: auth_headers(store_user, company: company)

    expect(response).to have_http_status(:ok)
    expect(store_user.reload.email).to start_with("deleted+")
    expect(User.create!(name: "Novo Loja", email: "loja@example.com", password: "admin123456", global_role: "user", status: "active")).to be_persisted
  end
end
