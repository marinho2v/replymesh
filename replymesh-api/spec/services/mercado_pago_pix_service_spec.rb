require "rails_helper"

RSpec.describe MercadoPagoPixService do
  let!(:company) { create_company(slug: "mp-pix-store") }
  let!(:settings) { create_store(company) }
  let!(:order) { create_order(company: company, payment_method: "pix", payment_status: "pending_payment") }

  it "creates Pix payments with a Replymesh webhook and order reference" do
    service = described_class.new("APP_USR-test-token")
    response = {
      "id" => 123456,
      "status" => "pending",
      "point_of_interaction" => {
        "transaction_data" => {
          "qr_code" => "000201PIX",
          "qr_code_base64" => "base64",
          "ticket_url" => "https://mercadopago.test/pix"
        }
      }
    }

    expect(service).to receive(:post) do |path, payload, headers|
      expect(path).to eq("/v1/payments")
      expect(headers).to include("X-Idempotency-Key" => "replymesh-order-#{order.id}-#{company.id}")
      expect(payload).to include(
        payment_method_id: "pix",
        external_reference: "replymesh:#{company.slug}:#{order.id}:#{order.public_token}",
        notification_url: "https://api.replymesh.cloud/api/v1/webhooks/mercadopago"
      )
      expect(payload[:metadata]).to include(
        order_id: order.id,
        company_id: company.id,
        company_slug: company.slug,
        public_token: order.public_token
      )
      response
    end

    result = service.create_pix_payment(order: order)

    expect(result).to be_success
    expect(result.payment_id).to eq("123456")
    expect(result.qr_code).to eq("000201PIX")
  end
end
