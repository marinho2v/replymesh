require "rails_helper"

RSpec.describe OrderStatusService do
  let!(:company) { create_company(slug: "order-status-test") }
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
end
