require "rails_helper"

RSpec.describe "Public featured products", type: :request do
  it "exposes fields used to prioritize recently featured products" do
    company = create_company(name: "Destaques")
    create_store(company)
    category, product = create_catalog(company)
    product.update!(is_featured: true, sort_order: 25)

    get "/api/v1/public/#{company.slug}/menu"

    expect(response).to have_http_status(:ok)
    payload = json["menu"].find { |item| item["id"] == category.id }
    serialized = payload["products"].find { |item| item["id"] == product.id }

    expect(serialized).to include(
      "is_featured" => true,
      "sort_order" => 25
    )
    expect(serialized["updated_at"]).to be_present
  end
end
