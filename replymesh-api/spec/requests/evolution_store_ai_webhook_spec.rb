require "rails_helper"

RSpec.describe "Evolution store AI webhook", type: :request do
  let!(:company) { create_company(name: "Teste Multiempresa", slug: "testemultiempresa") }
  let!(:other_company) { create_company(name: "Outra Empresa", slug: "outraempresa") }
  let!(:store) { create_store(company, delivery_fee_cents: 800) }
  let!(:other_store) { create_store(other_company) }
  let!(:instance) do
    WhatsappInstance.create!(
      company: company,
      instance_name: "replymesh_testemultiempresa",
      instance_token: "instance-secret",
      provider: "evolution_go",
      status: "connected"
    )
  end
  let(:webhook_token) { EvolutionWebhookToken.generate(instance) }
  let(:client) { instance_double(EvolutionGoClient, send_text: { success: true, message_id: "synthetic-1" }) }

  before do
    StoreAiSetting.for_company(company).update!(enabled: true, auto_reply_whatsapp: true)
    category, product = create_catalog(company, price_cents: 2_200)
    product.update!(name: "X-Picanha", slug: "x-picanha")
    _other_category, other_product = create_catalog(other_company)
    other_product.update!(name: "Produto Secreto Outra Empresa", slug: "produto-secreto-outra-empresa")
    allow(EvolutionGoClient).to receive(:new).and_return(client)
    allow(StoreAiRateLimiter).to receive(:allow?).and_return(true)
  end

  it "uses the signed instance token and replies with data from the linked company" do
    post "/api/v1/webhooks/evolution/location?token=#{CGI.escape(webhook_token)}",
      params: {
        instanceName: instance.instance_name,
        from: "5521959099803@s.whatsapp.net",
        id: "message-1",
        text: "tem x picanha?"
      },
      as: :json

    expect(response).to have_http_status(:ok)
    expect(json["success"]).to be(true)
    expect(json["company_id"]).to eq(company.id)
    expect(json["intent"]).to eq("products")
    expect(client).to have_received(:send_text).with(
      "instance-secret",
      phone: "5521959099803",
      message: include("X-Picanha", "testemultiempresa.replymesh.cloud")
    )
    expect(WhatsappLog.last.metadata_json["answer"]).not_to include("Produto Secreto Outra Empresa")
  end

  it "rejects a signed token used with another instance name" do
    post "/api/v1/webhooks/evolution/location?token=#{CGI.escape(webhook_token)}",
      params: {
        instanceName: "replymesh_outraempresa",
        from: "5521959099803@s.whatsapp.net",
        id: "message-2",
        text: "tem x picanha?"
      },
      as: :json

    expect(response).to have_http_status(:unauthorized)
    expect(client).not_to have_received(:send_text)
  end

  it "ignores trivial acknowledgements without calling the provider or Evolution" do
    post "/api/v1/webhooks/evolution/location?token=#{CGI.escape(webhook_token)}",
      params: {
        instanceName: instance.instance_name,
        from: "5521959099803@s.whatsapp.net",
        id: "message-3",
        text: "ok"
      },
      as: :json

    expect(response).to have_http_status(:ok)
    expect(json["ignored"]).to be(true)
    expect(json["reason"]).to eq("ignored")
    expect(client).not_to have_received(:send_text)
  end

  it "ignores messages sent by the connected account and group messages" do
    [
      { id: "message-own", from: "5521959099803@s.whatsapp.net", fromMe: true, text: "tem x picanha?" },
      { id: "message-group", from: "120363000000000000@g.us", text: "tem x picanha?" }
    ].each do |payload|
      post "/api/v1/webhooks/evolution/location?token=#{CGI.escape(webhook_token)}",
        params: payload.merge(instanceName: instance.instance_name),
        as: :json

      expect(response).to have_http_status(:ok)
      expect(json["ignored"]).to be(true)
    end

    expect(client).not_to have_received(:send_text)
  end

  it "does not send when the company and phone rate limit is reached" do
    allow(StoreAiRateLimiter).to receive(:allow?).and_return(false)

    post "/api/v1/webhooks/evolution/location?token=#{CGI.escape(webhook_token)}",
      params: {
        instanceName: instance.instance_name,
        from: "5521959099803@s.whatsapp.net",
        id: "message-rate-limit",
        text: "tem x picanha?"
      },
      as: :json

    expect(response).to have_http_status(:ok)
    expect(json["reason"]).to eq("rate_limit")
    expect(client).not_to have_received(:send_text)
  end

  it "records an isolated failure log when Evolution cannot send the answer" do
    allow(client).to receive(:send_text).and_raise(EvolutionGoClient::Error, "synthetic send failure")

    post "/api/v1/webhooks/evolution/location?token=#{CGI.escape(webhook_token)}",
      params: {
        instanceName: instance.instance_name,
        from: "5521959099803@s.whatsapp.net",
        id: "message-send-failure",
        text: "tem x picanha?"
      },
      as: :json

    expect(response).to have_http_status(:bad_gateway)
    log = WhatsappLog.order(:id).last
    expect(log.company_id).to eq(company.id)
    expect(log.whatsapp_instance_id).to eq(instance.id)
    expect(log.metadata_json).to include(
      "status" => "failed",
      "phone_last4" => "9803",
      "error" => "synthetic send failure"
    )
  end
end
