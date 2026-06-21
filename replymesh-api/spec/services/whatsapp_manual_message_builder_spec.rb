require "rails_helper"

RSpec.describe WhatsappManualMessageBuilder do
  let!(:company) { create_company(slug: "manual-link") }
  let!(:order) { create_order(company: company) }

  before do
    create_store(company).update!(whatsapp_mode: "manual")
    WhatsappTemplate.create!(
      company: company,
      template_key: "pedido_aceito",
      title: "Aceito",
      message: "Ola {{nome_cliente}}, pedido {{numero_pedido}} aceito!",
      enabled: true
    )
  end

  it "builds a safe wa.me link using the configured template" do
    result = described_class.call(order: order, status: "accepted")

    expect(result).to be_available
    expect(result.phone).to eq("5521999990001")
    expect(result.message).to include(order.order_number.to_s)
    expect(result.url).to start_with("https://wa.me/5521999990001?text=")
    expect(result.url).to include("%20")
  end

  it "does not build a link without a valid customer phone" do
    order.update!(customer_phone: nil, customer_whatsapp: nil)

    result = described_class.call(order: order, status: "accepted")

    expect(result).not_to be_available
    expect(result.error).to eq("Cliente sem telefone valido")
    expect(result.url).to be_nil
  end
end
