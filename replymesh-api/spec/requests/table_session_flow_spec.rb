require "rails_helper"

RSpec.describe "Table session flow (FASE 16.20C)", type: :request do
  let(:company) { create_company }
  let(:admin)   { create_user(email: "admin-mesa@example.com") }
  let(:waiter)  { create_user(email: "garcom-mesa@example.com") }

  let!(:table) do
    DiningTable.create!(
      company: company, name: "Mesa 1", number: 1, slug: "mesa-1",
      status: "available", is_active: true
    )
  end

  before do
    assign_plan(company, slug: "pro")
    create_store(company)
    add_member(admin, company, role: "store_admin")
    add_member(waiter, company, role: "waiter")
  end

  it "waiter abre mesa, envia para cozinha, fecha com pagamento e entra no caixa" do
    _category, product = create_catalog(company, price_cents: 2_500)
    CashService.open_session(company: company, user: admin)

    post "/api/v1/store/table_sessions",
         params: { table_session: { dining_table_id: table.id, notes: "Cliente Mesa" } },
         headers: auth_headers(waiter, company: company), as: :json
    expect(response).to have_http_status(:created)
    session_id = json["table_session"]["id"]

    patch "/api/v1/store/table_sessions/#{session_id}",
          params: {
            table_session: { status: "sent_to_kitchen", sent_to_kitchen_at: Time.current.iso8601 },
            items: [{ product_id: product.id, quantity: 2 }]
          },
          headers: auth_headers(waiter, company: company), as: :json
    expect(response).to have_http_status(:ok)

    order_id = json["table_session"]["order_id"]
    order = Order.find(order_id)
    expect(order.order_type).to eq("dine_in")
    expect(order.status).to eq("pending")
    expect(order.total_cents).to eq(5_000)
    expect(order.delivery_fee_cents).to eq(0)
    expect(order.legacy_source).to eq("table_waiter")

    patch "/api/v1/store/table_sessions/#{session_id}",
          params: {
            table_session: {
              status: "closed", payment_status: "paid", payment_method: "pix",
              total_cents: 5_000, paid_at: Time.current.iso8601, closed_at: Time.current.iso8601
            }
          },
          headers: auth_headers(waiter, company: company), as: :json
    expect(response).to have_http_status(:ok)

    order.reload
    expect(order.status).to eq("completed")
    expect(order.payment_method).to eq("pix")
    expect(order.payment_status).to eq("paid")
    expect(order.financial_recorded_at).to be_present
    expect(CashMovement.where(order_id: order.id, movement_type: "sale_pix").count).to eq(1)

    # mesa nao dispara WhatsApp nem motoboy
    expect(WhatsappLog.where(company_id: company.id).count).to eq(0)
    expect(order.motoboy_id).to be_nil
    expect(table.reload.status).to eq("available")
  end

  it "nao duplica registro no caixa se a mesa for fechada duas vezes" do
    _category, product = create_catalog(company, price_cents: 2_500)
    CashService.open_session(company: company, user: admin)

    post "/api/v1/store/table_sessions",
         params: { table_session: { dining_table_id: table.id } },
         headers: auth_headers(admin, company: company), as: :json
    session_id = json["table_session"]["id"]

    patch "/api/v1/store/table_sessions/#{session_id}",
          params: { table_session: { status: "sent_to_kitchen" }, items: [{ product_id: product.id, quantity: 1 }] },
          headers: auth_headers(admin, company: company), as: :json
    order_id = json["table_session"]["order_id"]

    2.times do
      patch "/api/v1/store/table_sessions/#{session_id}",
            params: { table_session: { status: "closed", payment_status: "paid", payment_method: "money" } },
            headers: auth_headers(admin, company: company), as: :json
    end

    expect(CashMovement.where(order_id: order_id, movement_type: "sale_cash").count).to eq(1)
  end

  describe "permissoes do garcom (waiter)" do
    it "permite mesas e leitura de produtos, bloqueia recursos administrativos com 403" do
      get "/api/v1/store/table_sessions", headers: auth_headers(waiter, company: company)
      expect(response).to have_http_status(:ok)

      get "/api/v1/store/products", headers: auth_headers(waiter, company: company)
      expect(response).to have_http_status(:ok)

      get "/api/v1/store/reports", headers: auth_headers(waiter, company: company)
      expect(response).to have_http_status(:forbidden)

      get "/api/v1/store/users", headers: auth_headers(waiter, company: company)
      expect(response).to have_http_status(:forbidden)

      get "/api/v1/store/inventory_items", headers: auth_headers(waiter, company: company)
      expect(response).to have_http_status(:forbidden)

      get "/api/v1/store/cash_sessions", headers: auth_headers(waiter, company: company)
      expect(response).to have_http_status(:forbidden)

      get "/api/v1/store/coupons", headers: auth_headers(waiter, company: company)
      expect(response).to have_http_status(:forbidden)

      get "/api/v1/store/motoboys", headers: auth_headers(waiter, company: company)
      expect(response).to have_http_status(:forbidden)
    end

    it "impede garcom de criar produtos mesmo com leitura liberada" do
      post "/api/v1/store/products",
           params: { product: { name: "Hack", price_cents: 100 } },
           headers: auth_headers(waiter, company: company), as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end
end
