class StoreAiService
  MEMORY_MESSAGES = 10
  OUT_OF_SCOPE = "Posso ajudar apenas com produtos, horarios, entrega, pagamento, promocoes e pedidos desta loja."
  TECHNICAL_SCOPE_PATTERNS = [
    /painel|dashboard|cadastrar produto|editar produto|configurar sistema/,
    /replymesh|suporte|ticket|token|api key|webhook|evolution/,
    /mercado pago tecnico|access token|public key|integracao/,
    /como configurar whatsapp|qr code do whatsapp|usuario|permissao/
  ].freeze

  def self.call(company:, user:, question:, phone: nil, simulate: false)
    new(company: company, user: user, question: question, phone: phone, simulate: simulate).call
  end

  def initialize(company:, user:, question:, phone: nil, simulate: false)
    @company = company
    @user = user
    @question = question.to_s.strip
    @phone = phone.to_s.presence
    @simulate = simulate
    @settings = StoreAiSetting.for_company(company)
    @global = AiGlobalSetting.current
    @started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end

  def call
    return response("A IA da loja esta desativada.", "disabled", []) unless @settings.enabled? || @simulate
    return response("Escreva uma pergunta para testar a IA da loja.", "blocked", []) if @question.blank?
    return response(greeting_answer, "success", []) if greeting?
    return response(OUT_OF_SCOPE, "blocked", []) if out_of_scope?
    return response("O limite diario de mensagens desta loja foi atingido.", "limited", []) if limit_reached?

    chunks = StoreRagService.search(
      company: @company,
      query: @question,
      permissions: permissions,
      phone: @phone
    )
    return response("Nao encontrei essa informacao nos dados atuais da loja.", "fallback", []) if chunks.empty?

    conversation = find_or_create_conversation
    conversation.store_ai_messages.create!(role: "user", content: @question)
    provider_result = call_provider(chunks, conversation)
    answer = provider_result&.success? ? provider_result.content : local_answer(chunks)
    answer = StoreAiWhatsappFormatter.format(answer)
    tokens = provider_result&.tokens.to_i
    tokens = estimate_tokens(prompt_for(chunks, conversation) + answer.to_s) if tokens.zero?

    conversation.store_ai_messages.create!(
      role: "assistant",
      content: answer,
      rag_chunks: chunks.map { |chunk| chunk.slice(:id, :module, :title, :score) },
      tokens_used: tokens,
      response_time_ms: elapsed_ms
    )
    conversation.update!(last_message_at: Time.current)
    response(answer, provider_result&.success? ? "success" : "fallback", chunks, tokens: tokens)
  end

  private

  def call_provider(chunks, conversation)
    return nil unless @global.api_key_configured?

    AiProviderService.build(
      provider: @global.provider,
      api_key: @global.api_key,
      model: @settings.model.presence || @global.model
    ).chat(
      system_prompt: system_prompt(chunks),
      user_message: prompt_for(chunks, conversation),
      max_tokens: 450
    )
  end

  def system_prompt(chunks)
    <<~PROMPT
      Voce e #{@settings.assistant_name}, atendente virtual da loja #{@company.name}.
      Tom: #{@settings.tone}.
      Responda em portugues do Brasil, de forma curta, natural e util.
      Use somente os fatos dos chunks fornecidos. Nunca invente produto, preco, horario, pedido ou promocao.
      Nunca misture dados de outras lojas. Nao revele IDs internos.
      Nao mostre SKU, legacy_id, codigo de homologacao ou nomes tecnicos.
      Formate para WhatsApp com paragrafos curtos, quebras de linha e emojis moderados.
      Se faltar informacao, diga que nao encontrou nos dados atuais da loja.

      CHUNKS:
      #{chunks.map { |chunk| "[#{chunk[:module]}] #{chunk[:title]}\n#{chunk[:content]}" }.join("\n\n")}
    PROMPT
  end

  def prompt_for(_chunks, conversation)
    memory = conversation.store_ai_messages.order(created_at: :desc).limit(MEMORY_MESSAGES).reverse
      .map { |message| "#{message.role}: #{message.content.to_s.truncate(500)}" }.join("\n")
    ["Conversa recente:", memory.presence || "sem historico", "Pergunta: #{@question}"].join("\n")
  end

  def local_answer(chunks)
    chunk = chunks.first
    payload = JSON.parse(chunk[:content])

    case chunk[:module]
    when "produtos"
      products = Array(payload).first(4)
      return "Nao encontrei produto ativo com esse nome agora." if products.empty?

      intro = exact_product_match?(products) ? "Encontrei estas opcoes:" : "No momento nao encontrei esse produto exato.\n\nTemos opcoes parecidas:"
      list = products.map do |product|
        price = product["promocional_centavos"].presence || product["preco_centavos"]
        ["🍔 #{product['nome']}", product["descricao"].presence, "💰 #{format_brl(price)}", product["categoria"].present? ? "Categoria: #{product['categoria']}" : nil].compact.join("\n")
      end.join("\n\n")
      "#{intro}\n\n#{list}\n\nQuer que eu mostre outras opcoes do cardapio?"
    when "horarios"
      days = %w[domingo segunda terca quarta quinta sexta sabado]
      Array(payload).map do |hour|
        hour["aberto"] ? "#{days[hour['dia'].to_i].capitalize}: #{hour['abre']} as #{hour['fecha']}" : "#{days[hour['dia'].to_i].capitalize}: fechado"
      end.join("\n")
    when "promocoes"
      coupons = Array(payload)
      return "Nao ha cupons ativos disponiveis agora." if coupons.empty?

      "Estas promocoes estao disponiveis:\n\n" + coupons.first(4).map do |coupon|
        code = coupon["codigo"].to_s.strip
        ["🏷️ #{coupon['titulo']}", code.present? ? "Cupom: #{code}" : nil].compact.join("\n")
      end.join("\n\n")
    when "pedidos"
      return chunk[:content] unless payload.is_a?(Hash)

      "Seu pedido ##{payload['numero']} esta #{order_status_label(payload['status'])}. Total: #{format_brl(payload['total_centavos'])}."
    when "loja"
      "#{payload['nome']} esta com status #{payload['status']}. Endereco: #{payload['endereco'].presence || 'nao informado'}."
    when "pagamentos"
      forms = Array(payload["formas"]).map { |item| payment_label(item) }
      forms << "Pix" if payload["pix_ativo"] && forms.none? { |item| item.downcase == "pix" }
      "Aceitamos: #{forms.compact_blank.uniq.join(', ')}."
    when "entrega"
      parts = []
      parts << (payload["entrega_ativa"] ? "🛵 Fazemos entrega." : "A entrega esta indisponivel no momento.")
      if (zone = matching_delivery_zone(payload["regioes"]))
        parts << "Regiao: #{zone['nome']}."
        parts << "Taxa: #{format_brl(zone['taxa_centavos'])}."
        parts << "Pedido minimo: #{format_brl(zone['pedido_minimo_centavos'])}." if zone["pedido_minimo_centavos"].to_i.positive?
        parts << "Tempo estimado: #{zone['tempo_estimado_minutos']} minutos." if zone["tempo_estimado_minutos"]
      else
        parts << "Taxa padrao: #{format_brl(payload['taxa_padrao_centavos'])}."
        parts << "Tempo estimado: #{payload['tempo_estimado_minutos']} minutos." if payload["tempo_estimado_minutos"]
        parts << "Informe seu bairro para eu conferir a regiao correta." if Array(payload["regioes"]).any?
      end
      parts << "Tambem e possivel retirar no local." if payload["retirada_ativa"]
      parts.join("\n")
    else
      chunk[:content].to_s.truncate(700)
    end
  rescue JSON::ParserError
    chunk[:content].to_s.truncate(700)
  end

  def format_brl(cents)
    ActionController::Base.helpers.number_to_currency(cents.to_i / 100.0, unit: "R$ ", separator: ",", delimiter: ".")
  end

  def exact_product_match?(products)
    terms = ReplymeshKnowledgeService.normalize(@question).split - %w[tem vende produto produtos cardapio lanche hamburguer]
    products.any? do |product|
      name = ReplymeshKnowledgeService.normalize(product["nome"])
      terms.any? && terms.all? { |term| name.include?(term) }
    end
  end

  def payment_label(value)
    {
      "cash" => "Dinheiro",
      "money" => "Dinheiro",
      "pix" => "Pix",
      "debit_card" => "Cartao de debito",
      "credit_card" => "Cartao de credito",
      "card_on_delivery" => "Cartao na entrega"
    }[value.to_s] || value.to_s.humanize
  end

  def order_status_label(value)
    {
      "pending" => "aguardando confirmacao",
      "accepted" => "aceito",
      "preparing" => "em preparo",
      "ready" => "pronto",
      "out_for_delivery" => "a caminho",
      "completed" => "finalizado",
      "cancelled" => "cancelado"
    }[value.to_s] || "em atualizacao"
  end

  def greeting?
    ReplymeshKnowledgeService.greeting?(@question)
  end

  def greeting_answer
    store_name = @company.store_setting&.company_name.presence || @company.name
    greeting = case Time.current.hour
               when 5...12 then "Bom dia"
               when 12...18 then "Boa tarde"
               else "Boa noite"
               end
    "#{greeting} 😊\nSeja bem-vindo a #{store_name}.\nComo posso ajudar voce hoje?"
  end

  def find_or_create_conversation
    phone = normalized_phone
    conversation = StoreAiConversation.recent_for(@company.id, phone).first if phone.present?
    conversation ||= @company.store_ai_conversations.create!(
      phone: phone,
      channel: @simulate ? "simulator" : "web",
      status: "open",
      last_message_at: Time.current
    )
    conversation
  end

  def normalized_phone
    @phone.to_s.gsub(/\D/, "").presence
  end

  def permissions
    {
      allow_orders: @settings.allow_orders,
      allow_products: @settings.allow_products,
      allow_hours: @settings.allow_hours,
      allow_promotions: @settings.allow_promotions,
      allow_order_status: @settings.allow_order_status
    }
  end

  def out_of_scope?
    normalized = ReplymeshKnowledgeService.normalize(@question)
    ReplymeshKnowledgeService::OUT_OF_SCOPE_PATTERNS.any? { |pattern| normalized.match?(pattern) } ||
      TECHNICAL_SCOPE_PATTERNS.any? { |pattern| normalized.match?(pattern) }
  end

  def matching_delivery_zone(zones)
    normalized_question = ReplymeshKnowledgeService.normalize(@question)
    Array(zones).find do |zone|
      names = [zone["nome"], *Array(zone["aliases"])].map { |value| ReplymeshKnowledgeService.normalize(value) }
      names.any? { |name| name.present? && normalized_question.include?(name) }
    end
  end

  def limit_reached?
    AiUsageLog.today_for_company(@company.id).where(assistant_type: "store_ai").count >= @settings.daily_limit
  end

  def response(answer, status, chunks, tokens: nil)
    total_tokens = tokens || estimate_tokens(@question + answer.to_s)
    AiUsageLog.create!(
      company: @company,
      user: @user,
      assistant_type: "store_ai",
      provider: @global.provider,
      model: @settings.model.presence || @global.model,
      total_tokens: total_tokens,
      estimated_cost_usd: estimate_cost(total_tokens),
      response_time_ms: elapsed_ms,
      status: status
    )

    {
      answer: answer,
      status: status,
      chunks: chunks.map { |chunk| chunk.slice(:id, :module, :title, :score) },
      response_time_ms: elapsed_ms,
      tokens_estimated: total_tokens
    }
  end

  def estimate_tokens(text)
    (text.to_s.length / 4.0).ceil
  end

  def estimate_cost(tokens)
    (tokens.to_i / 1_000_000.0 * 2.0).round(6)
  end

  def elapsed_ms
    ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - @started_at) * 1000).round
  end
end
