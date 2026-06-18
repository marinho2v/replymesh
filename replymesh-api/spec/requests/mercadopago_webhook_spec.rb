require "rails_helper"

RSpec.describe "Mercado Pago webhook", type: :request do
  let!(:company) { create_company(slug: "mp-webhook-store") }
  let!(:settings) { create_store(company) }
  let!(:order) do
    create_order(
      company: company,
      payment_method: "pix",
      payment_status: "pending_payment"
    ).tap { |record| record.update!(pix_qr_code: "000201PIX") }
  end

  before do
    settings.update!(
      pix_provider: "mercadopago",
      mercadopago_enabled: true,
      mercadopago_access_token: "APP_USR-test-token"
    )

    allow(InventoryService).to receive(:deduct_for_order).and_return(
      InventoryService::Result.new(success: true, data: nil)
    )
  end

  it "confirms a payment found by external_reference when payment_id is not stored yet" do
    allow_any_instance_of(MercadoPagoPixService).to receive(:check_payment).and_return(
      {
        id: "mp-copy-paste-1",
        status: "approved",
        detail: "accredited",
        external_reference: "replymesh:#{company.slug}:#{order.id}:#{order.public_token}",
        metadata: {}
      }
    )

    post "/api/v1/webhooks/mercadopago",
         params: { type: "payment", data: { id: "mp-copy-paste-1" } }

    expect(response).to have_http_status(:ok)
    expect(order.reload.payment_status).to eq("paid")
    expect(order.status).to eq("accepted")
    expect(order.external_payment_id).to eq("mp-copy-paste-1")
  end

  it "ignores non-payment webhook topics" do
    post "/api/v1/webhooks/mercadopago",
         params: { type: "merchant_order", data: { id: "abc123" } }

    expect(response).to have_http_status(:bad_request)
  end
end
