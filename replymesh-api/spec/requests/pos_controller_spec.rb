require "rails_helper"

RSpec.describe "PDV / Balcao — PosController (FASE 16.21)", type: :request do
  let(:company) { create_company }
  let(:admin)   { create_user(email: "admin-pdv@example.com") }
  let(:attendant) { create_user(email: "atendente-pdv@example.com") }
  let(:waiter)  { create_user(email: "garcom-pdv@example.com") }
  let(:kitchen) { create_user(email: "cozinha-pdv@example.com") }
  let!(:product) do
    _, p = create_catalog(company, price_cents: 3_000)
    p
  end

  before do
    assign_plan(company, slug: "start")
    create_store(company)
    add_member(admin,     company, role: "store_admin")
    add_member(attendant, company, role: "employee")
    add_member(waiter,    company, role: "waiter")
    add_member(kitchen,   company, role: "kitchen")
  end

  def pos_params(overrides = {})
    {
      items: [{ product_id: product.id, quantity: 1, unit_price_cents: 3_000 }],
      payment_method: "money",
    }.merge(overrides)
  end

  def open_cash!
    CashService.open_session(company: company, user: admin)
  end

  # ─── Caso A: Dinheiro com troco ───────────────────────────────────────────
  describe "Caso A — Dinheiro com troco" do
    before { open_cash! }

    it "cria pedido pos, completa, registra cash_movement origin=pos, calcula troco" do
      allow(WhatsappStatusDispatcher).to receive(:call)
      allow(InventoryService).to receive(:deduct_for_order).and_return(
        instance_double("Result", success?: true, error: nil)
      )

      post "/api/v1/store/pos/sale",
           params: pos_params(change_for_cents: 5_000),
           headers: auth_headers(admin, company: company), as: :json

      expect(response).to have_http_status(:created), "#{response.status}: #{response.body}"

      order = Order.last
      expect(order.order_type).to eq("pos")
      expect(order.status).to eq("completed")
      expect(order.payment_status).to eq("paid")
      expect(order.total_cents).to eq(3_000)
      expect(order.delivery_fee_cents).to eq(0)
      expect(order.change_for_cents).to eq(5_000)

      movement = CashMovement.where(order: order).first
      expect(movement).to be_present
      expect(movement.origin).to eq("pos")
      expect(movement.movement_type).to eq("sale_cash")

      change_mv = CashMovement.where(order: order, movement_type: "change_given").first
      expect(change_mv).to be_present
      expect(change_mv.amount_cents).to eq(2_000)

      expect(WhatsappStatusDispatcher).not_to have_received(:call)
    end

    it "estoque e deducao chamados uma vez" do
      allow(InventoryService).to receive(:deduct_for_order)

      post "/api/v1/store/pos/sale",
           params: pos_params,
           headers: auth_headers(admin, company: company), as: :json

      expect(InventoryService).to have_received(:deduct_for_order).once
    end

    it "nao cria motoboy nem delivery" do
      post "/api/v1/store/pos/sale",
           params: pos_params,
           headers: auth_headers(admin, company: company), as: :json

      order = Order.last
      expect(order.delivery_fee_cents).to eq(0)
      expect(order.legacy_source).to eq("pos")
    end
  end

  # ─── Caso B: Pix sem cliente obrigatorio ──────────────────────────────────
  describe "Caso B — Pix manual sem cliente" do
    before { open_cash! }

    it "cria pedido pos com pix, cash_movement sale_pix, origin=pos" do
      allow(WhatsappStatusDispatcher).to receive(:call)

      post "/api/v1/store/pos/sale",
           params: pos_params(payment_method: "pix"),
           headers: auth_headers(admin, company: company), as: :json

      expect(response).to have_http_status(:created), "#{response.status}: #{response.body}"

      order = Order.last
      expect(order.payment_method).to eq("pix")
      expect(order.order_type).to eq("pos")
      expect(order.status).to eq("completed")

      movement = CashMovement.where(order: order, movement_type: "sale_pix").first
      expect(movement).to be_present
      expect(movement.origin).to eq("pos")

      expect(WhatsappStatusDispatcher).not_to have_received(:call)
    end

    it "aceita ausencia de customer_name e usa Balcao como fallback" do
      post "/api/v1/store/pos/sale",
           params: pos_params(payment_method: "pix"),
           headers: auth_headers(admin, company: company), as: :json

      expect(Order.last.customer_name).to eq("Balcao")
    end
  end

  # ─── Caso C: Cartao com desconto ──────────────────────────────────────────
  describe "Caso C — Cartao com desconto" do
    before { open_cash! }

    it "aplica desconto fixo e registra sale_card" do
      post "/api/v1/store/pos/sale",
           params: pos_params(payment_method: "card_on_delivery", discount_cents: 500),
           headers: auth_headers(admin, company: company), as: :json

      expect(response).to have_http_status(:created), "#{response.status}: #{response.body}"

      order = Order.last
      expect(order.total_cents).to eq(2_500)
      expect(order.discount_cents).to eq(500)
      expect(order.payment_method).to eq("card_on_delivery")

      movement = CashMovement.where(order: order, movement_type: "sale_card").first
      expect(movement).to be_present
      expect(movement.origin).to eq("pos")
    end

    it "aplica desconto percentual" do
      post "/api/v1/store/pos/sale",
           params: pos_params(payment_method: "card_on_delivery", discount_percent: 10),
           headers: auth_headers(admin, company: company), as: :json

      order = Order.last
      expect(order.discount_cents).to eq(300)
      expect(order.total_cents).to eq(2_700)
    end
  end

  # ─── Caso D: Caixa fechado ────────────────────────────────────────────────
  describe "Caso D — Caixa fechado" do
    it "retorna erro amigavel" do
      post "/api/v1/store/pos/sale",
           params: pos_params,
           headers: auth_headers(admin, company: company), as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json["error"]).to match(/Abra o caixa/)
    end
  end

  # ─── Caso E: Permissoes ───────────────────────────────────────────────────
  describe "Caso E — Permissoes" do
    before { open_cash! }

    it "admin acessa" do
      post "/api/v1/store/pos/sale",
           params: pos_params,
           headers: auth_headers(admin, company: company), as: :json
      expect(response).to have_http_status(:created), "#{response.status}: #{response.body}"
    end

    it "attendant/employee acessa" do
      post "/api/v1/store/pos/sale",
           params: pos_params,
           headers: auth_headers(attendant, company: company), as: :json
      expect(response).to have_http_status(:created), "#{response.status}: #{response.body}"
    end

    it "waiter recebe 403" do
      post "/api/v1/store/pos/sale",
           params: pos_params,
           headers: auth_headers(waiter, company: company), as: :json
      expect(response).to have_http_status(:forbidden)
    end

    it "kitchen recebe 403" do
      post "/api/v1/store/pos/sale",
           params: pos_params,
           headers: auth_headers(kitchen, company: company), as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  # ─── Caso F: Regressao — outros tipos nao viram pos ──────────────────────
  describe "Caso F — Regressao" do
    before { open_cash! }

    it "delivery nao vira pos" do
      order = Order.create!(
        company: company,
        order_type: "delivery",
        status: "pending",
        payment_method: "pix",
        payment_status: "pending",
        delivery_status: "pending",
        subtotal_cents: 3_000,
        delivery_fee_cents: 500,
        discount_cents: 0,
        total_cents: 3_500,
        customer_name: "Cliente Teste",
        customer_phone: "21999990001",
        customer_whatsapp: "21999990001"
      )
      expect(order.order_type).to eq("delivery")
      expect(order.order_type).not_to eq("pos")
    end

    it "PDV nao dispara WhatsApp" do
      allow(WhatsappStatusDispatcher).to receive(:call)

      post "/api/v1/store/pos/sale",
           params: pos_params,
           headers: auth_headers(admin, company: company), as: :json

      expect(WhatsappStatusDispatcher).not_to have_received(:call)
    end

    it "PDV nao gera giro de roleta" do
      allow(WheelService).to receive(:grant_for_order)

      post "/api/v1/store/pos/sale",
           params: pos_params,
           headers: auth_headers(admin, company: company), as: :json

      expect(WheelService).not_to have_received(:grant_for_order)
    end
  end
end
