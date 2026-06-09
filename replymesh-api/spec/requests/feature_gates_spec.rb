require "rails_helper"

RSpec.describe "Store feature gates", type: :request do
  let(:company) { create_company(name: "Loja Gateada") }
  let(:user) { create_user(email: "gate-admin@example.com") }
  let(:headers) { auth_headers(user, company: company) }

  before do
    add_member(user, company)
    create_store(company)
  end

  it "returns feature_not_available for a blocked Start feature" do
    assign_plan(company, slug: "start")

    get "/api/v1/store/marketing/campaigns", headers: headers

    expect(response).to have_http_status(:forbidden)
    expect(json["error"]).to eq("feature_not_available")
    expect(json["feature"]).to eq("marketing_whatsapp")
    expect(json["required_plan"]).to eq("pro")
  end

  it "allows Start companies to use orders and connected WhatsApp basics" do
    assign_plan(company, slug: "start")

    get "/api/v1/store/orders", headers: headers
    expect(response).to have_http_status(:ok)

    get "/api/v1/store/whatsapp/instances", headers: headers
    expect(response).to have_http_status(:ok)
  end

  it "allows Pro companies to use AI, marketing, recovery and stock" do
    assign_plan(company, slug: "pro")

    get "/api/v1/store/store_ai/settings", headers: headers
    expect(response).to have_http_status(:ok)

    get "/api/v1/store/marketing/campaigns", headers: headers
    expect(response).to have_http_status(:ok)

    get "/api/v1/store/sales_recovery/customers", headers: headers
    expect(response).to have_http_status(:ok)

    get "/api/v1/store/inventory_items", headers: headers
    expect(response).to have_http_status(:ok)
  end

  it "returns the feature catalog and company access map to the frontend" do
    assign_plan(company, slug: "start")
    CompanyFeatureOverride.create!(company: company, feature_key: "coupons", mode: "allow", created_by: user)

    get "/api/v1/store/features", headers: headers

    expect(response).to have_http_status(:ok)
    expect(json.dig("feature_access", "plan", "slug")).to eq("start")
    expect(json.dig("feature_access", "allowed")).to include("coupons")
    expect(json.dig("feature_access", "manual_allowed")).to include("coupons")
    expect(json["catalog"]).to be_an(Array)
    expect(json["catalog"].map { |item| item["key"] }).to include("orders", "store_ai", "coupons")
  end
end
