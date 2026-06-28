require "rails_helper"

RSpec.describe "Store product resilience", type: :request do
  let!(:company) { create_company(name: "QA Produtos") }
  let!(:user) { create_user(email: "qa-produtos@example.com") }
  let!(:category) do
    Category.create!(
      company: company,
      name: "Lanches",
      slug: "lanches",
      sort_order: 0,
      is_active: true
    )
  end

  before do
    add_member(user, company)
    assign_plan(company, slug: "pro")
    create_store(company)
  end

  it "creates unique internal slugs when products have the same name" do
    2.times do
      post "/api/v1/store/products",
           params: {
             product: {
               name: "X-Bacon",
               category_id: category.id,
               price_cents: 2_500
             }
           },
           headers: auth_headers(user, company: company),
           as: :json

      expect(response).to have_http_status(:created)
    end

    expect(company.products.order(:id).pluck(:slug)).to eq(%w[x-bacon x-bacon-2])
  end

  it "saves option items using the documented item payload" do
    product = Product.create!(
      company: company,
      category: category,
      name: "Smash",
      price_cents: 2_000
    )
    group = ProductOptionGroup.create!(
      company: company,
      product: product,
      name: "Adicionais",
      group_type: "multiple"
    )

    post "/api/v1/store/products/#{product.id}/option_groups/#{group.id}/items",
         params: {
           item: {
             name: "Bacon extra",
             additional_price_cents: 500,
             is_active: true
           }
         },
         headers: auth_headers(user, company: company),
         as: :json

    expect(response).to have_http_status(:created)
    expect(json.dig("item", "name")).to eq("Bacon extra")
  end

  it "returns an empty current cash session without a 404" do
    get "/api/v1/store/cash_sessions/current",
        headers: auth_headers(user, company: company)

    expect(response).to have_http_status(:ok)
    expect(json["cash_session"]).to be_nil
  end

  it "records malformed store requests with company context" do
    product = Product.create!(
      company: company,
      category: category,
      name: "Costela",
      price_cents: 3_000
    )
    group = ProductOptionGroup.create!(
      company: company,
      product: product,
      name: "Ponto",
      group_type: "single"
    )

    expect do
      post "/api/v1/store/products/#{product.id}/option_groups/#{group.id}/items",
           params: { option_item: { name: "Bem passado" } },
           headers: auth_headers(user, company: company),
           as: :json
    end.to change {
      ActivityLog.where(company: company, action: "store_request_error").count
    }.by(1)

    expect(response).to have_http_status(:bad_request)
    expect(json["message"]).to include("item")
  end
end
