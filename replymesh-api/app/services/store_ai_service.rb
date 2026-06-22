class StoreAiService
  MEMORY_MESSAGES = 10
  OUT_OF_SCOPE = "Posso ajudar com produtos, pedidos, horarios, pagamentos e entregas da loja."
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
    return response("A IA das lojas esta desativada globalmente.", "disabled", [], error_code: "store_ai_global_disabled") unless store_ai_globally_enabled?
    return response("A IA da loja esta desativada.", "disabled", []) unless @settings.enabled? || @simulate
    return response("Escreva uma pergunta para testar a IA da loja.", "blocked", []) if @question.blank?
    return response("A IA das lojas esta sem provider configurado no Master.", "blocked", [], error_code: "ai_provider_not_configured") if store_provider.blank? || store_provider == "disabled" || !store_provider_configured?(store_provider)
    return sales_response if @settings.respond_to?(:sales_mode?) && @settings.sales_mode?

    @intent = StoreAiIntentClassifier.call(@question)
    return ignored_response if @intent == :trivial
    return response(human_handoff_answer, "handoff", []) if @intent == :human_request
    return response(greeting_answer, "success", []) if greeting?
    return response(out_of_scope_answer, "blocked", []) if out_of_scope? || @intent.nil?
    return response("", "limited", []) if limit_reached?

    chunks = StoreRagService.search(
      company: @company,
      query: @question,
      permissions: permissions,
      phone: @phone
    )
    return response(fallback_answer, "fallback", []) if chunks.empty?

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
    response(
      answer,
      provider_result&.success? ? "success" : "fallback",
      chunks,
      tokens: tokens,
      provider_called: provider_result.present?,
      fallback: !provider_result&.success?
    )
  end

  private

  def call_provider(chunks, conversation)
    provider = store_provider
    return nil if provider == "disabled"
    return nil unless store_provider_configured?(provider)

    AiProviderService.build(
      provider: provider,
      api_key: api_key_for(provider),
      model: store_model
    ).chat(
      system_prompt: system_prompt(chunks),
      user_message: prompt_for(chunks, conversation),
      max_tokens: 450
    )
  end

  def sales_response
    result = StoreAiSalesService.call(
      company: @company,
      user: @user,
      question: @question,
      phone: @phone,
      settings: @settings,
      global: @global,
      simulate: @simulate
    ).to_h

    response(
      result[:answer],
      result[:status],
      [],
      tokens: estimate_tokens(@question + result[:answer].to_s),
      provider_called: result[:provider_called],
      fallback: result[:fallback]
    ).merge(result)
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
      Para concluir uma compra, use somente os links presentes nos chunks.

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
      products = Array(payload).first(3)
      return "Nao encontrei produto ativo com esse nome agora." if products.empty?

      intro = exact_product_match?(products) ? "Tem sim. Olha essas opcoes:" : "Nao achei esse item exato, mas encontrei opcoes parecidas:"
      list = products.map do |product|
        price = product["promocional_centavos"].presence || product["preco_centavos"]
        ["- #{product['nome']}", product["descricao"].presence, "Preco: #{format_brl(price)}", product["categoria"].present? ? "Categoria: #{product['categoria']}" : nil].compact.join("\n")
      end.join("\n\n")
      product_link = products.first["link"].presence || menu_url
      "#{intro}\n\n#{list}\n\nVoce pode pedir aqui: #{product_link}"
    when "horarios"
      hours_answer(Array(payload))
    when "promocoes"
      coupons = Array(payload)
      return "Nao ha cupons ativos disponiveis agora." if coupons.empty?

      "Estas promocoes estao disponiveis:\n\n" + coupons.first(4).map do |coupon|
        code = coupon["codigo"].to_s.strip
        ["- #{coupon['titulo']}", code.present? ? "Cupom: #{code}" : nil].compact.join("\n")
      end.join("\n\n")
    when "pedidos"
      return chunk[:content] unless payload.is_a?(Hash)

      details = ["Seu pedido ##{payload['numero']} esta #{order_status_label(payload['status'])}."]
      details << "Situacao da entrega: #{delivery_status_label(payload['delivery_status'])}." if payload["delivery_status"].present?
      details << "A localizacao para entrega ja foi recebida." if payload["location_received"]
      details << "Total: #{format_brl(payload['total_centavos'])}."
      details.join("\n")
    when "loja"
      "#{payload['nome']} esta com status #{payload['status']}. Endereco: #{payload['endereco'].presence || 'nao informado'}."
    when "pagamentos"
      forms = Array(payload["formas"]).map { |item| payment_label(item) }
      forms << "Pix" if payload["pix_ativo"] && forms.none? { |item| item.downcase == "pix" }
      "Aceitamos: #{forms.compact_blank.uniq.join(', ')}."
    when "entrega"
      parts = []
      parts << (payload["entrega_ativa"] ? "Fazemos entrega." : "A entrega esta indisponivel no momento.")
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
      parts << "Cardapio: #{menu_url}"
      parts.join("\n")
    when "pedido"
      "Claro. Para fazer seu pedido, acesse:\n#{payload['link'].presence || menu_url}"
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

  def hours_answer(hours)
    return "Nao encontrei horarios cadastrados para a loja agora." if hours.empty?

    today_hour = hours.find { |hour| hour["dia"].to_i == current_store_time.wday }

    if question_about_today?
      return "Hoje a loja esta fechada." unless today_hour&.dig("aberto")

      status = open_now?(today_hour) ? "aberta agora" : "fechada agora"
      return "Hoje a loja esta #{status}. Horario de hoje: #{today_hour['abre']} as #{today_hour['fecha']}."
    end

    if @question.match?(/fecha|fechar/i) && today_hour&.dig("aberto")
      return "Hoje a loja fecha as #{today_hour['fecha']}."
    end

    days = %w[domingo segunda terca quarta quinta sexta sabado]
    hours.map do |hour|
      hour["aberto"] ? "#{days[hour['dia'].to_i].capitalize}: #{hour['abre']} as #{hour['fecha']}" : "#{days[hour['dia'].to_i].capitalize}: fechado"
    end.join("\n")
  end

  def greeting?
    ReplymeshKnowledgeService.greeting?(@question)
  end

  def greeting_answer
    store_name = @company.store_setting&.company_name.presence || @company.name
    greeting = case current_store_time.hour
               when 5...12 then "Bom dia"
               when 12...18 then "Boa tarde"
               else "Boa noite"
               end
    initial_message = @settings.initial_message.to_s.strip
    initial_message = "Como posso ajudar voce hoje?" if initial_message.blank?
    "#{greeting}! Seja bem-vindo a #{store_name}.\n#{initial_message}\n\nCardapio: #{menu_url}"
  end

  def find_or_create_conversation
    phone = normalized_phone
    conversation = StoreAiConversation.latest_for_phone(@company.id, phone).first if phone.present?
    conversation&.resume_if_expired!
    conversation = nil if conversation&.status == "handed_off"
    conversation ||= @company.store_ai_conversations.create!(
      phone: phone,
      channel: @simulate ? "simulator" : "whatsapp",
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
      allow_delivery: @settings.allow_delivery,
      allow_payments: @settings.allow_payments,
      allow_promotions: @settings.allow_promotions,
      allow_order_status: @settings.allow_order_status
    }
  end

  def out_of_scope?
    normalized = ReplymeshKnowledgeService.normalize(@question)
    ReplymeshKnowledgeService::OUT_OF_SCOPE_PATTERNS.any? { |pattern| normalized.match?(pattern) } ||
      TECHNICAL_SCOPE_PATTERNS.any? { |pattern| normalized.match?(pattern) }
  end

  def out_of_scope_answer
    OUT_OF_SCOPE
  end

  def fallback_answer
    "Nao consegui entender direitinho. Me chama com o nome do produto, bairro, forma de pagamento ou pedido que eu te ajudo por aqui."
  end

  def human_handoff_answer
    "Certo, vou deixar um atendente continuar por aqui."
  end

  def menu_url
    "https://#{@company.slug}.replymesh.cloud/menu"
  end

  def matching_delivery_zone(zones)
    normalized_question = ReplymeshKnowledgeService.normalize(@question)
    Array(zones).find do |zone|
      names = [zone["nome"], *Array(zone["aliases"])].map { |value| ReplymeshKnowledgeService.normalize(value) }
      names.any? { |name| name.present? && normalized_question.include?(name) }
    end
  end

  def current_store_time
    Time.current.in_time_zone(store_timezone)
  end

  def store_timezone
    @company.respond_to?(:timezone) && @company.timezone.present? ? @company.timezone : "America/Sao_Paulo"
  end

  def question_about_today?
    ReplymeshKnowledgeService.normalize(@question).match?(/hoje|agora|aberto|aberta|fecha|fechado|fechada/)
  end

  def open_now?(hour)
    return false unless hour&.dig("aberto")

    open_minutes = minutes_for(hour["abre"])
    close_minutes = minutes_for(hour["fecha"])
    current_minutes = current_store_time.hour * 60 + current_store_time.min
    return false if open_minutes.nil? || close_minutes.nil?

    if close_minutes < open_minutes
      current_minutes >= open_minutes || current_minutes <= close_minutes
    else
      current_minutes.between?(open_minutes, close_minutes)
    end
  end

  def minutes_for(value)
    hour, minute = value.to_s.split(":").map(&:to_i)
    return if hour.nil?

    hour * 60 + minute.to_i
  end

  def limit_reached?
    AiUsageLog.today_for_company(@company.id).where(assistant_type: "store_ai").count >= daily_message_limit
  end

  def response(answer, status, chunks, tokens: nil, provider_called: false, fallback: false, error_code: nil)
    total_tokens = tokens || estimate_tokens(@question + answer.to_s)
    AiUsageLog.create!(
      company: @company,
      user: @user,
      assistant_type: "store_ai",
      provider: store_provider,
      model: store_model,
      total_tokens: total_tokens,
      estimated_cost_usd: estimate_cost(total_tokens),
      response_time_ms: elapsed_ms,
      status: status
    )

    {
      answer: answer,
      status: status,
      intent: @intent,
      provider_called: provider_called,
      fallback: fallback,
      chunks: chunks.map { |chunk| chunk.slice(:id, :module, :title, :score) },
      response_time_ms: elapsed_ms,
      tokens_estimated: total_tokens
    }.tap do |payload|
      payload[:error_code] = error_code if error_code.present?
    end
  end

  def store_provider
    provider = @settings.respond_to?(:effective_provider) ? @settings.effective_provider : nil
    provider = @global.store_ai_provider if provider.blank? && @global.respond_to?(:store_ai_provider)
    provider = @global.provider if provider.blank?
    provider == "claude" ? "anthropic" : provider
  end

  def store_model
    global_model = @global.respond_to?(:store_ai_model) ? @global.store_ai_model : @global.model
    @settings.effective_model(global_model)
  end

  def api_key_for(provider)
    return @global.store_ai_api_key_for(provider) if @global.respond_to?(:store_ai_api_key_for)

    provider.to_s == "anthropic" ? @global.api_key : nil
  end

  def store_ai_globally_enabled?
    return true unless @global.respond_to?(:store_ai_enabled)

    @global.store_ai_enabled?
  end

  def store_provider_configured?(provider)
    return false if provider.blank? || provider == "disabled"

    api_key_for(provider).present?
  end

  def daily_message_limit
    @settings.ai_daily_message_limit.presence ||
      (@global.respond_to?(:store_ai_daily_message_limit) ? @global.store_ai_daily_message_limit : nil) ||
      @settings.daily_limit
  end

  def ignored_response
    {
      answer: "",
      status: "ignored",
      intent: "trivial",
      provider_called: false,
      fallback: false,
      chunks: [],
      response_time_ms: elapsed_ms,
      tokens_estimated: 0
    }
  end

  def delivery_status_label(value)
    {
      "pending" => "aguardando atribuicao",
      "assigned" => "atribuida ao motoboy",
      "on_the_way" => "a caminho",
      "delivered" => "entregue"
    }[value.to_s] || value.to_s.humanize
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
