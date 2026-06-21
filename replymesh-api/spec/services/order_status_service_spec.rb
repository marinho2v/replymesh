require "rails_helper"

RSpec.describe OrderStatusService do
  let!(:company) { create_company(slug: "order-status-test-#{SecureRandom.hex(3)}") }
  let!(:order) { create_order(company: company) }

  it "keeps acceptance available when the WhatsApp template is disabled" do
    WhatsappTemplate.create!(
      company: company,
      template_key: "pedido_aceito",
      title: "Aceito",
      message: "Pedido aceito",
      enabled: false
    )

    result = described_class.call(
      order: order,
      new_status: "accepted",
      skip_side_effects: true
    )

    expect(result).to be_success
    expect(result.order.status).to eq("accepted")
  end

  it "cancels pending pickup orders" do
    pickup_order = create_order(
      company: company,
      customer: order.customer,
      status: "pending",
      order_type: "pickup"
    )

    expect(WhatsappStatusDispatcher).to receive(:call).with(
      order: pickup_order,
      status: "cancelled",
      user: nil
    )

    result = described_class.call(
      order: pickup_order,
      new_status: "cancelled",
      skip_side_effects: true
    )

    expect(result).to be_success
    expect(result.order.status).to eq("cancelled")
    expect(result.order.cancelled_at).to be_present
  end

  it "normalizes canceled spelling and cancels assigned motoboy delivery" do
    motoboy_user = create_user(email: "delivery-cancel-moto@example.com", role: "motoboy")
    motoboy = Motoboy.create!(
      company: company,
      user: motoboy_user,
      name: "Moto Cancel",
      phone: "21999998888",
      active: true,
      is_available: true
    )
    delivery_order = create_order(
      company: company,
      customer: order.customer,
      status: "out_for_delivery",
      order_type: "delivery"
    )
    delivery_order.update!(motoboy: motoboy, delivery_status: "on_the_way", delivery_fee_cents: 600)
    DeliveryHistory.create!(
      company: company,
      order: delivery_order,
      motoboy: motoboy,
      status: "on_the_way",
      assigned_at: 10.minutes.ago
    )

    result = described_class.call(
      order: delivery_order,
      new_status: "canceled",
      skip_side_effects: false
    )

    expect(result).to be_success
    expect(result.order.status).to eq("cancelled")
    expect(result.order.delivery_status).to eq("cancelled")
    expect(result.order.delivery_history.status).to eq("cancelled")
  end

  it "enables the cancellation message for new companies" do
    WhatsappTemplate.sync_defaults_for!(company)

    template = company.whatsapp_templates.find_by!(template_key: "pedido_cancelado")
    expect(template).to be_enabled
  end

  it "changes status normally and returns a manual WhatsApp preview" do
    create_store(company).update!(whatsapp_mode: "manual")
    WhatsappTemplate.create!(
      company: company,
      template_key: "pedido_aceito",
      title: "Aceito",
      message: "Pedido {{numero_pedido}} aceito",
      enabled: true
    )

    result = described_class.call(
      order: order,
      new_status: "accepted",
      skip_side_effects: true
    )

    expect(result).to be_success
    expect(result.order.status).to eq("accepted")
    expect(result.whatsapp.sent).to be(false)
    expect(result.whatsapp.manual_preview[:available]).to be(true)
  end
end
