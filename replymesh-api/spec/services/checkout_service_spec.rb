require "rails_helper"

RSpec.describe CheckoutService do
  let!(:company) { create_company(slug: "checkout-#{SecureRandom.hex(2)}") }
  let!(:settings) { create_store(company, delivery_fee_cents: 700) }
  let!(:category) { create_catalog(company).first }
  let!(:product) { company.products.first }

  def checkout_params(order_type: "delivery", payment_method: "money", coupon_code: nil)
    {
      order_type: order_type,
      payment_method: payment_method,
      delivery_zone_id: @zone&.id,
      needs_change: payment_method == "money",
      change_for_cents: payment_method == "money" ? 5_000 : nil,
      coupon_code: coupon_code,
      customer: { full_name: "Maria", phone: SecureRandom.random_number(10**11).to_s.rjust(11, "9") },
      address: { street: "Rua A", number: "10", neighborhood: "Centro", city: "Marica", state: "RJ" },
      items: [{ product_id: product.id, quantity: 1, selected_options: [] }]
    }
  end

  before do
    @zone = DeliveryZone.create!(
      company: company, name: "Centro", slug: "centro",
      delivery_fee_cents: 700, estimated_minutes: 30, is_active: true
    )
  end

  it "creates a delivery order and calculates delivery fee and change" do
    allow(WhatsappStatusDispatcher).to receive(:call)

    result = described_class.call(company: company, params: checkout_params)

    expect(result).to be_success
    expect(result.order.delivery_fee_cents).to eq(700)
    expect(result.order.total_cents).to eq(3_200)
    expect(result.order.change_for_cents).to eq(5_000)
    expect(WhatsappStatusDispatcher).to have_received(:call).with(order: result.order, status: "pending")
  end

  it "creates a pickup order without delivery fee" do
    result = described_class.call(company: company, params: checkout_params(order_type: "pickup", payment_method: "pix"))

    expect(result).to be_success
    expect(result.order.delivery_fee_cents).to eq(0)
    expect(result.order.total_cents).to eq(2_500)
  end

  it "applies a valid coupon using backend totals" do
    Coupon.create!(
      company: company, code: "VOLTA5", title: "Volte",
      discount_type: "fixed", discount_value: 5, is_active: true
    )

    result = described_class.call(company: company, params: checkout_params(coupon_code: "VOLTA5"))

    expect(result).to be_success
    expect(result.order.discount_cents).to eq(500)
    expect(result.order.total_cents).to eq(2_700)
  end

  it "blocks checkout when the store is closed" do
    settings.update!(store_status: "closed", block_orders_when_closed: true)

    result = described_class.call(company: company, params: checkout_params)

    expect(result).not_to be_success
    expect(result.errors).to include("Loja fechada no momento")
  end
end
