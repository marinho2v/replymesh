require "rails_helper"

RSpec.describe "Public promotions", type: :request do
  let(:company) { create_company(name: "Loja Promocoes") }

  it "does not expose plan details when roulette is unavailable" do
    assign_plan(company, slug: "start")

    get "/api/v1/public/#{company.slug}/promotions"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include(
      "success" => true,
      "roulette_active" => false,
      "promotions" => []
    )
    expect(response.body).not_to match(/plano|upgrade|bloqueado/i)
  end

  it "returns the roulette promotion when the feature and a prize are active" do
    assign_plan(company, slug: "pro")
    WheelPrize.create!(
      company: company,
      name: "10% OFF",
      prize_type: "percentage",
      discount_value: 10,
      probability_weight: 10,
      coupon_valid_days: 7,
      is_active: true
    )

    get "/api/v1/public/#{company.slug}/promotions"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include(
      "success" => true,
      "roulette_active" => true
    )
    expect(response.parsed_body.fetch("promotions")).to include(
      include("key" => "roulette", "title" => "Roleta de Premios", "active" => true)
    )
  end

  it "returns no active promotion when all prizes are disabled" do
    assign_plan(company, slug: "pro")
    WheelPrize.create!(
      company: company,
      name: "Premio pausado",
      prize_type: "fixed",
      discount_value: 5,
      probability_weight: 10,
      coupon_valid_days: 7,
      is_active: false
    )

    get "/api/v1/public/#{company.slug}/promotions"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include("roulette_active" => false, "promotions" => [])
  end
end
