require "rails_helper"

RSpec.describe "Store multi-tenant isolation", type: :request do
  let!(:company_a) { create_company(name: "Empresa A") }
  let!(:company_b) { create_company(name: "Empresa B") }
  let!(:user_a) { create_user(email: "admin-a@example.com") }

  before do
    add_member(user_a, company_a)
    assign_plan(company_a, slug: "pro")
    assign_plan(company_b, slug: "pro")
    create_store(company_a)
    create_store(company_b)
    _category_a, @product_a = create_catalog(company_a)
    _category_b, @product_b = create_catalog(company_b)
    @customer_a = create_customer(company_a, phone: "21911111111")
    @customer_b = create_customer(company_b, phone: "21922222222")
    @order_a = create_order(company: company_a, customer: @customer_a)
    @order_b = create_order(company: company_b, customer: @customer_b)
    @coupon_a = Coupon.create!(company: company_a, code: "A10", title: "A", discount_type: "fixed", discount_value: 10)
    @coupon_b = Coupon.create!(company: company_b, code: "B10", title: "B", discount_type: "fixed", discount_value: 10)
  end

  it "isolates products by company" do
    get "/api/v1/store/products", headers: auth_headers(user_a)
    ids = json["products"].map { |item| item["id"] }
    expect(ids).to include(@product_a.id)
    expect(ids).not_to include(@product_b.id)
  end

  it "isolates orders by company" do
    get "/api/v1/store/orders", headers: auth_headers(user_a)
    ids = json["orders"].map { |item| item["id"] }
    expect(ids).to include(@order_a.id)
    expect(ids).not_to include(@order_b.id)
  end

  it "isolates customers by company" do
    get "/api/v1/store/customers", headers: auth_headers(user_a)
    ids = json["customers"].map { |item| item["id"] }
    expect(ids).to include(@customer_a.id)
    expect(ids).not_to include(@customer_b.id)
  end

  it "isolates coupons by company" do
    get "/api/v1/store/coupons", headers: auth_headers(user_a)
    ids = json["coupons"].map { |item| item["id"] }
    expect(ids).to include(@coupon_a.id)
    expect(ids).not_to include(@coupon_b.id)
  end

  it "isolates marketing customers by company" do
    get "/api/v1/store/marketing/customers", headers: auth_headers(user_a)
    ids = json["customers"].map { |item| item["id"] }
    expect(ids).to include(@customer_a.id)
    expect(ids).not_to include(@customer_b.id)
  end

  it "isolates recovery customers by company" do
    @customer_a.update!(last_order_at: 45.days.ago, total_orders: 2, total_spent_cents: 10_000)
    @customer_b.update!(last_order_at: 45.days.ago, total_orders: 2, total_spent_cents: 10_000)

    get "/api/v1/store/sales_recovery/customers", params: { days: 30 }, headers: auth_headers(user_a)
    ids = json["customers"].map { |item| item["id"] }
    expect(ids).to include(@customer_a.id)
    expect(ids).not_to include(@customer_b.id)
  end
end
