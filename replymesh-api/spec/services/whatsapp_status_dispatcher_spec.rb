require "rails_helper"

RSpec.describe WhatsappStatusDispatcher do
  let!(:company) { create_company(slug: "whatsapp-test") }
  let!(:order) { create_order(company: company) }

  it "creates a log for an enabled template" do
    WhatsappTemplate.create!(
      company: company, template_key: "pedido_aceito",
      title: "Aceito", message: "Pedido aceito", enabled: true
    )

    result = described_class.call(order: order, status: "accepted")

    expect(result).to be_success
    expect(result.log).to be_persisted
    expect(result.log.metadata_json["template_enabled"]).to be(true)
  end

  it "does not send when the template is disabled" do
    WhatsappTemplate.create!(
      company: company, template_key: "pedido_aceito",
      title: "Aceito", message: "Pedido aceito", enabled: false
    )

    result = described_class.call(order: order, status: "accepted")

    expect(result.sent).to be(false)
    expect(result.error).to eq("template desativado")
  end

  it "does not break with an invalid destination number" do
    order.update!(customer_phone: "", customer_whatsapp: "")
    WhatsappTemplate.create!(
      company: company, template_key: "pedido_aceito",
      title: "Aceito", message: "Pedido aceito", enabled: true
    )

    expect { described_class.call(order: order, status: "accepted") }.not_to raise_error
  end
end
