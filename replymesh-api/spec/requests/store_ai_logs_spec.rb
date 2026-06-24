require "rails_helper"

RSpec.describe "Store AI logs", type: :request do
  let!(:company) { create_company(name: "QA Logs IA", slug: "qa-logs-ia") }
  let!(:user) { create_user(email: "admin-logs-ia@example.com") }

  before do
    host! "localhost"
    add_member(user, company, role: "store_admin")
    allow(FeatureGate).to receive(:enabled?).and_return(true)
    allow(FeatureGate).to receive(:check).and_return(
      FeatureGate::Result.new(enabled: true, feature: "store_ai", required_plan: "pro", source: "test")
    )
  end

  it "returns only the current company conversations with provider and created order" do
    conversation = company.store_ai_conversations.create!(
      phone: "5521999991234",
      channel: "whatsapp",
      status: "closed",
      last_message_at: Time.current
    )
    conversation.store_ai_messages.create!(role: "user", content: "Quero um lanche")
    assistant = conversation.store_ai_messages.create!(
      role: "assistant",
      content: "Pedido criado.",
      tokens_used: 42,
      response_time_ms: 120
    )
    AiUsageLog.create!(
      company: company,
      user: user,
      assistant_type: "store_ai",
      provider: "groq",
      model: "llama-test",
      total_tokens: 42,
      response_time_ms: 120,
      status: "success",
      created_at: assistant.created_at
    )
    create_order(company: company).update!(
      customer_phone: "21999991234",
      legacy_source: "whatsapp_ai",
      created_at: assistant.created_at
    )

    other_company = create_company(name: "Outra Empresa", slug: "outra-empresa-logs")
    other_company.store_ai_conversations.create!(
      phone: "5521888880000",
      channel: "whatsapp",
      status: "open",
      last_message_at: Time.current
    ).store_ai_messages.create!(role: "assistant", content: "Nao pode aparecer")

    get "/api/v1/store/store_ai/logs",
        params: { period: "today" },
        headers: auth_headers(user, company: company)

    expect(response).to have_http_status(:ok)
    expect(json.dig("company", "id")).to eq(company.id)
    expect(json.fetch("logs").size).to eq(1)
    expect(json.dig("logs", 0)).to include(
      "question" => "Quero um lanche",
      "answer" => "Pedido criado.",
      "provider" => "groq",
      "order_created" => true
    )
    expect(json.dig("logs", 0, "phone")).to eq("••••1234")
  end
end
