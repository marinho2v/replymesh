require "rails_helper"

RSpec.describe "Store AI WhatsApp multi-tenant answers" do
  let!(:company) { create_company(name: "Teste Multiempresa", slug: "testemultiempresa") }
  let!(:store) { create_store(company, delivery_fee_cents: 800) }

  before do
    category, product = create_catalog(company, price_cents: 2_200)
    product.update!(name: "X-Picanha", slug: "x-picanha")
    DeliveryZone.create!(
      company: company,
      name: "Centro",
      slug: "centro",
      delivery_fee_cents: 500,
      minimum_order_cents: 0,
      estimated_minutes: 30,
      is_active: true,
      aliases: []
    )
    PaymentMethod.create!(company: company, name: "Pix", method_type: "pix", enabled: true)
    BusinessHour.create!(
      company: company,
      day_of_week: 1,
      is_open: true,
      open_time: "18:00",
      close_time: "23:00"
    )
    StoreAiSetting.for_company(company).update!(enabled: true, auto_reply_whatsapp: true)
  end

  {
    "tem x picanha?" => ["X-Picanha", "testemultiempresa.replymesh.cloud"],
    "voces entregam no centro?" => ["Centro", "R$ 5,00"],
    "qual horario de funcionamento?" => ["Segunda"],
    "aceita pix?" => ["Pix"],
    "posso retirar no local?" => ["retirar no local"],
    "quero fazer um pedido" => ["testemultiempresa.replymesh.cloud/menu"],
    "cade meu pedido?" => ["Nenhum pedido encontrado"],
    "tem promocao?" => ["Nao ha cupons ativos"],
    "como configuro meu painel?" => [StoreAiService::OUT_OF_SCOPE],
    "me ajuda com token?" => [StoreAiService::OUT_OF_SCOPE]
  }.each do |question, expected_parts|
    it "answers #{question.inspect} inside the store boundary" do
      result = StoreAiService.call(
        company: company,
        user: nil,
        question: question,
        phone: "5521959099803",
        simulate: true
      )

      expected_parts.each { |part| expect(result[:answer]).to include(part) }
      expect(result[:answer]).not_to include("ReplymeshKnowledgeService")
    end
  end

  it "uses the company initial message and its own menu link in greetings" do
    StoreAiSetting.for_company(company).update!(initial_message: "Posso ajudar com o seu pedido.")

    result = StoreAiService.call(
      company: company,
      user: nil,
      question: "ola",
      phone: "5521959099803",
      simulate: true
    )

    expect(result[:answer]).to include(
      "Posso ajudar com o seu pedido.",
      "testemultiempresa.replymesh.cloud/menu"
    )
  end
end
