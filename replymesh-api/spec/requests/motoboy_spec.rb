require "rails_helper"

RSpec.describe "Motoboy flow", type: :request do
  let!(:company) { create_company(slug: "motoboy-test") }
  let!(:plan) { assign_plan(company, slug: "start") }
  let!(:user) { create_user(email: "motoboy@example.com", role: "motoboy", password: "senha123456") }
  let!(:motoboy) { Motoboy.create!(company: company, user: user, name: "Moto Teste", phone: "21988887777", active: true, is_available: true) }
  let!(:order) do
    create_order(company: company, status: "ready").tap do |record|
      record.update!(motoboy: motoboy, delivery_status: "assigned")
      DeliveryHistory.create!(company: company, order: record, motoboy: motoboy, status: "assigned", assigned_at: Time.current)
    end
  end

  it "logs in, lists, completes and moves the order to history" do
    post "/api/v1/motoboy/auth/login", params: {
      phone: motoboy.phone, password: "senha123456", company_slug: company.slug
    }
    expect(response).to have_http_status(:ok)
    token = json["token"]
    headers = { "Authorization" => "Bearer #{token}" }

    get "/api/v1/motoboy/orders", headers: headers
    expect(json["orders"].map { |item| item["id"] }).to include(order.id)

    post "/api/v1/motoboy/orders/#{order.id}/complete", headers: headers
    expect(response).to have_http_status(:ok)
    expect(order.reload.status).to eq("completed")
    expect(order.delivery_status).to eq("delivered")

    get "/api/v1/motoboy/history", headers: headers
    expect(json["history"].map { |item| item.dig("order", "id") }).to include(order.id)
  end

  it "lists the most recent assigned delivery first" do
    newer_order = create_order(
      company: company,
      customer: create_customer(company, phone: "21999990002"),
      status: "ready"
    )
    newer_order.update!(motoboy: motoboy, delivery_status: "assigned")
    DeliveryHistory.create!(
      company: company,
      order: newer_order,
      motoboy: motoboy,
      status: "assigned",
      assigned_at: Time.current
    )

    post "/api/v1/motoboy/auth/login", params: {
      phone: motoboy.phone, password: "senha123456", company_slug: company.slug
    }
    headers = { "Authorization" => "Bearer #{json['token']}" }

    get "/api/v1/motoboy/orders", headers: headers

    expect(response).to have_http_status(:ok)
    expect(json["orders"].first["id"]).to eq(newer_order.id)
  end

  it "blocks motoboy login when the web panel feature is manually blocked" do
    admin = create_user(email: "feature-owner@example.com")
    CompanyFeatureOverride.create!(
      company: company,
      feature_key: "motoboy_panel",
      mode: "block",
      created_by: admin
    )

    post "/api/v1/motoboy/auth/login", params: {
      phone: motoboy.phone, password: "senha123456", company_slug: company.slug
    }

    expect(response).to have_http_status(:forbidden)
    expect(json["error"]).to eq("feature_not_available")
    expect(json["feature"]).to eq("motoboy_panel")
    expect(json["message"]).to include("Plano START")
  end

  it "blocks direct localhost-style motoboy login without company slug when phone resolves one store" do
    admin = create_user(email: "direct-feature-owner@example.com")
    CompanyFeatureOverride.create!(
      company: company,
      feature_key: "motoboy_panel",
      mode: "block",
      created_by: admin
    )

    post "/api/v1/motoboy/auth/login", params: {
      phone: motoboy.phone, password: "senha123456"
    }, headers: {
      "Host" => "localhost:5173"
    }

    expect(response).to have_http_status(:forbidden)
    expect(json["error"]).to eq("feature_not_available")
    expect(json["feature"]).to eq("motoboy_panel")
  end

  it "blocks motoboy API access when the panel is blocked after a token was issued" do
    post "/api/v1/motoboy/auth/login", params: {
      phone: motoboy.phone, password: "senha123456", company_slug: company.slug
    }
    token = json["token"]

    admin = create_user(email: "late-feature-owner@example.com")
    CompanyFeatureOverride.create!(
      company: company,
      feature_key: "motoboy_panel",
      mode: "block",
      created_by: admin
    )

    get "/api/v1/motoboy/orders", headers: { "Authorization" => "Bearer #{token}" }

    expect(response).to have_http_status(:forbidden)
    expect(json["error"]).to eq("feature_not_available")
  end
end
