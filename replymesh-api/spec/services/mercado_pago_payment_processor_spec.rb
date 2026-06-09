require "rails_helper"

RSpec.describe MercadoPagoPaymentProcessor do
  let!(:company) { create_company }
  let!(:settings) { create_store(company) }

  def pending_pix_order
    create_order(
      company: company,
      payment_method: "pix",
      payment_status: "pending_payment"
    ).tap { |order| order.update!(external_payment_id: "mp-test-#{order.id}", pix_qr_code: "qr") }
  end

  it "approves Pix and accepts the order" do
    order = pending_pix_order
    allow(InventoryService).to receive(:deduct_for_order).and_return(
      InventoryService::Result.new(success: true, data: nil)
    )

    result = described_class.process_result!(order, { status: "approved", id: "approved-1" })

    expect(result[:payment_status]).to eq("paid")
    expect(result[:order_status]).to eq("accepted")
  end

  it "approves Pix even when the accepted WhatsApp template is disabled" do
    WhatsappTemplate.create!(
      company: company,
      template_key: "pedido_aceito",
      title: "Pedido aceito",
      message: "Seu pedido foi aceito",
      enabled: false
    )
    order = pending_pix_order
    allow(InventoryService).to receive(:deduct_for_order).and_return(
      InventoryService::Result.new(success: true, data: nil)
    )

    result = described_class.process_result!(order, { status: "approved", id: "approved-2" })

    expect(result[:payment_status]).to eq("paid")
    expect(result[:order_status]).to eq("accepted")
  end

  it "expires Pix and cancels the order" do
    order = pending_pix_order
    result = described_class.process_result!(order, { status: "expired", detail: "timeout" })

    expect(result[:payment_status]).to eq("expired")
    expect(result[:order_status]).to eq("cancelled")
  end

  it "allows manual cancellation of pending Pix" do
    order = pending_pix_order
    allow_any_instance_of(described_class).to receive(:check_remote_payment).and_return({})

    result = described_class.cancel_pending!(order)

    expect(result[:cancelled]).to be(true)
    expect(result[:payment_status]).to eq("cancelled")
  end
end
