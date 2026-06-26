require "rails_helper"

RSpec.describe "Master company core features", type: :request do
  let!(:company) { create_company(name: "Core Modules", slug: "core-modules") }
  let!(:admin) { create_user(email: "core-master@example.com", role: "super_admin") }

  before do
    assign_plan(company, slug: "pro")
    host! "localhost"
  end

  it "rejects a manual block for a core feature" do
    patch "/api/v1/master/companies/#{company.id}/features",
          params: { overrides: [{ feature_key: "orders", mode: "block" }] },
          headers: auth_headers(admin)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(json.fetch("errors").join).to include("obrigatorio")
    expect(FeatureGate.enabled?(company, "orders")).to be(true)
  end
end
