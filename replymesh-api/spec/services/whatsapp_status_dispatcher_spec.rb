require "rails_helper"

RSpec.describe WhatsappStatusDispatcher do
  let!(:company) { create_company(slug: "whatsapp-test") }
  let!(:order) { create_order(company: company) }

  it "creates a log for an enabled template" do
    WhatsappTemplate.create!(
      company: company, template_key: "pedido_aceito",
      title: "Aceito", message: "Pedido aceito", enabled: true
    )
    WhatsappInstance.create!(
      company: company,
      instance_name: "replymesh_whatsapp_test",
      instance_token: "instance-token",
      provider: "evolution_go",
      status: "connected"
    )
    client = instance_double(EvolutionGoClient, send_text: { success: true, mode: "test" })
    allow(EvolutionGoClient).to receive(:new).and_return(client)

    result = described_class.call(order: order, status: "accepted")

    expect(result).to be_success
    expect(result.sent).to be(true)
    expect(result.log).to be_persisted
    expect(result.log.metadata_json["template_enabled"]).to be(true)
    expect(result.log.metadata_json["delivery_mode"]).to eq("real_auto")
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

  it "does not require a production allowlist for operational messages" do
    WhatsappTemplate.create!(
      company: company, template_key: "pedido_aceito",
      title: "Aceito", message: "Pedido aceito", enabled: true
    )
    WhatsappInstance.create!(
      company: company,
      instance_name: "replymesh_whatsapp_test",
      instance_token: "instance-token",
      provider: "evolution_go",
      status: "connected"
    )
    client = instance_double(EvolutionGoClient, send_text: { success: true, mode: "test" })
    allow(EvolutionGoClient).to receive(:new).and_return(client)
    allow(Rails.env).to receive(:development?).and_return(false)

    result = described_class.call(order: order, status: "accepted")

    expect(result.sent).to be(true)
  end

  it "maps pending orders to pedido_recebido and avoids duplicate sends" do
    WhatsappTemplate.create!(
      company: company, template_key: "pedido_recebido",
      title: "Recebido", message: 'Pedido #{{numero_pedido}} recebido', enabled: true
    )
    WhatsappInstance.create!(
      company: company,
      instance_name: "replymesh_whatsapp_test",
      instance_token: "instance-token",
      provider: "evolution_go",
      status: "connected"
    )
    client = instance_double(EvolutionGoClient, send_text: { success: true, mode: "test" })
    allow(EvolutionGoClient).to receive(:new).and_return(client)

    first = described_class.call(order: order, status: "pending")
    second = described_class.call(order: order, status: "pending")

    expect(first.sent).to be(true)
    expect(second.sent).to be(false)
    expect(second.error).to eq("notificacao ja enviada")
    expect(client).to have_received(:send_text).once
  end

  it "prepares a manual message without calling Evolution" do
    create_store(company).update!(whatsapp_mode: "manual")
    WhatsappTemplate.create!(
      company: company, template_key: "pedido_aceito",
      title: "Aceito", message: "Pedido {{numero_pedido}} aceito", enabled: true
    )
    allow(EvolutionGoClient).to receive(:new)

    result = described_class.call(order: order, status: "accepted")

    expect(result).to be_success
    expect(result.sent).to be(false)
    expect(result.manual_preview[:available]).to be(true)
    expect(result.manual_preview[:url]).to start_with("https://wa.me/")
    expect(result.log.metadata_json["skipped_reason"]).to eq("skipped_manual_mode")
    expect(EvolutionGoClient).not_to have_received(:new)
  end
end
