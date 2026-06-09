require "rails_helper"

RSpec.describe "Carina RAG and Store AI boundaries" do
  describe CarinaAssistantService do
    let!(:company) { create_company(name: "Loja Carina") }
    let!(:store) { create_store(company) }
    let!(:user) { create_user(email: "carina-context@example.com") }

    before do
      add_member(user, company)
      AiGlobalSetting.current.update!(enabled: true, api_key_encrypted: nil)
    end

    it "answers a new support intent without repeating the previous product topic" do
      AiAssistantLog.create!(
        company: company,
        user: user,
        question: "qual tamanho da imagem do produto?",
        response_summary: "Use 1200x800.",
        status: "success"
      )

      result = described_class.call(
        company: company,
        user: user,
        question: "como eu abro um ticket?",
        page: "/admin/support"
      )

      expect(result[:answer]).to include("Suporte")
      expect(result[:answer]).not_to include("1200x800")
    end

    it "records an uncovered question as a knowledge gap" do
      result = described_class.call(
        company: company,
        user: user,
        question: "onde configuro o modulo quantico zyxw?",
        page: "/admin"
      )

      expect(result[:status]).to eq("gap")
      expect(AiAssistantLog.last.status).to eq("gap")
      expect(AiAssistantLog.last.error_message).to include("knowledge_gap")
    end
  end

  describe ReplymeshKnowledgeService do
    cases = {
      "como eu abro um ticket?" => "Suporte",
      "como eu falo com suporte?" => "Suporte",
      "qual tamanho da foto do produto?" => "1200x800",
      "como conecto o WhatsApp?" => "QR Code",
      "como aceito um pedido?" => "Aceitar",
      "como atribuo motoboy?" => "Atribuir motoboy",
      "como vejo relatorio?" => "Relatorios",
      "como uso recuperador de vendas?" => "Recuperador de vendas",
      "como faco campanha de WhatsApp?" => "Marketing WhatsApp",
      "como configuro Pix Mercado Pago?" => "Public Key",
      "como funciona a roleta?" => "pedido e finalizado",
      "como crio cupom?" => "novo cupom",
      "como altero horario da loja?" => "Configuracoes > Horarios",
      "como cadastro regiao de entrega?" => "Areas de Entrega",
      "como configuro IA da loja?" => "Configuracoes > IA da loja"
    }.freeze

    cases.each do |question, expected|
      it "answers #{question.inspect} from the correct article" do
        answer = described_class.fallback_answer(question)

        expect(answer).to include(expected)
      end
    end

    it "does not let an old product-image question override a new support intent" do
      answer = described_class.fallback_answer(
        "como eu abro um ticket?",
        previous_questions: ["qual tamanho da imagem do produto?"]
      )

      expect(answer).to include("Suporte")
      expect(answer).not_to include("1200x800")
    end

    it "uses previous context only for a short continuation" do
      topics = described_class.new(
        "e onde coloco ela?",
        previous_questions: ["qual tamanho da imagem do produto?"]
      ).relevant_topics

      expect(topics).to include("Imagens do cardapio")
    end
  end

  describe StoreAiService do
    let!(:company) { create_company(name: "Loja IA Cliente") }
    let!(:store) { create_store(company, delivery_fee_cents: 800) }
    let!(:user) { create_user(email: "store-ai-boundary@example.com") }

    before do
      category, expensive = create_catalog(company, price_cents: 3_000)
      expensive.update!(name: "X-Tudo", slug: "x-tudo")
      Product.create!(
        company: company,
        category: category,
        name: "X-Burger",
        slug: "x-burger",
        price_cents: 1_800,
        cost_price_cents: 800,
        is_active: true
      )
      Product.create!(
        company: company,
        category: category,
        name: "Coca-Cola Lata",
        slug: "coca-cola-lata",
        price_cents: 700,
        cost_price_cents: 300,
        is_active: true
      )
      DeliveryZone.create!(
        company: company,
        name: "Centro",
        slug: "centro",
        aliases: ["centro da cidade"],
        delivery_fee_cents: 500,
        minimum_order_cents: 2_000,
        estimated_minutes: 30,
        is_active: true
      )
      StoreAiSetting.for_company(company).update!(enabled: false)
    end

    it "answers product, price, delivery and payment questions with company data" do
      questions = {
        "voces entregam?" => "Fazemos entrega",
        "quais formas de pagamento?" => "Aceitamos",
        "tem coca cola?" => "Coca-Cola",
        "qual hamburguer mais barato?" => "X-Burger",
        "posso retirar no local?" => "retirar no local",
        "qual taxa para o Centro?" => "R$ 5,00"
      }

      questions.each do |question, expected|
        result = described_class.call(company: company, user: user, question: question, simulate: true)
        expect(result[:answer]).to include(expected)
      end
    end

    it "blocks technical Replymesh support questions from the customer assistant" do
      result = described_class.call(
        company: company,
        user: user,
        question: "como configuro o webhook da Evolution no painel?",
        simulate: true
      )

      expect(result[:status]).to eq("blocked")
      expect(result[:answer]).to eq(StoreAiService::OUT_OF_SCOPE)
    end

    it "does not include products from another company" do
      other_company = create_company(name: "Outra Loja IA")
      create_store(other_company)
      _category, other_product = create_catalog(other_company)
      other_product.update!(name: "Produto Secreto Outra Loja", slug: "produto-secreto-outra-loja")

      result = described_class.call(company: company, user: user, question: "tem produto secreto?", simulate: true)

      expect(result[:answer]).not_to include("Produto Secreto Outra Loja")
    end
  end
end
