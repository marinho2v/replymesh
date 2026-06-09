class CarinaAssistantService
  MEMORY_INTERACTIONS = 5

  def self.call(company:, user:, question:, page: nil)
    new(company: company, user: user, question: question, page: page).call
  end

  def initialize(company:, user:, question:, page: nil)
    @company = company
    @user = user
    @question = question.to_s.strip
    @page = page.to_s.presence
    @settings = AiGlobalSetting.current
    @started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  end

  def call
    return finish("A Carina esta temporariamente desativada pelo suporte Replymesh.", "disabled") unless @settings.enabled?
    return finish("Pode escrever sua duvida sobre a Replymesh que eu ajudo voce.", "blocked") if @question.blank?
    return finish("Voce chegou ao limite diario de conversas desta empresa. Abra um ticket e o suporte continua com voce.", "limited") if company_limit_reached?
    return finish("Recebi varias mensagens em seguida. Aguarde um instante e tente novamente, por favor.", "limited") if user_limit_reached?

    local_answer = ReplymeshKnowledgeService.local_answer(@question, user_name: display_user_name)
    if local_answer.present?
      status = local_answer == ReplymeshKnowledgeService::OUT_OF_SCOPE ? "blocked" : "success"
      source = status == "blocked" ? "scope_guard" : "conversation"
      return finish(local_answer, status, source: source)
    end

    provider_result = call_provider
    if provider_result&.success? && provider_result.content.present?
      return finish(provider_result.content, "success", tokens: provider_result.tokens, source: @settings.provider)
    end

    fallback = contextual_fallback
    gap = fallback == ReplymeshKnowledgeService::UNKNOWN
    finish(
      fallback,
      gap ? "gap" : "success",
      source: "knowledge_base",
      error: gap ? knowledge_gap_message(provider_result&.error) : provider_result&.error
    )
  end

  private

  def call_provider
    return nil unless @settings.api_key_configured?

    AiProviderService.build(
      provider: @settings.provider,
      api_key: @settings.api_key,
      model: @settings.model
    ).chat(
      system_prompt: system_prompt,
      user_message: user_message_with_memory,
      max_tokens: 700
    )
  rescue ArgumentError => e
    ClaudeAiService::Result.new(success?: false, error: e.message)
  end

  def system_prompt
    [
      @settings.base_prompt.presence || AiGlobalSetting::DEFAULT_PROMPT,
      premium_behavior,
      "Tom configurado: #{@settings.assistant_tone}.",
      "Contexto seguro da empresa atual:",
      safe_company_context.to_json,
      "Trechos relevantes e reais da base Replymesh:",
      knowledge_context
    ].join("\n\n")
  end

  def premium_behavior
    <<~PROMPT.squish
      Converse como uma atendente experiente, acolhedora e natural.
      Chame o usuario pelo primeiro nome quando isso ficar natural.
      Nunca responda apenas sim, nao, pode ou nao tenho essa informacao.
      Seja direta e escreva para uma janela pequena de chat.
      Comece respondendo a duvida, sem repetir uma lista geral de tudo que o sistema faz.
      Use paragrafos curtos e no maximo quatro passos.
      Separe cada passo em uma linha.
      Use listas somente quando realmente ajudarem.
      Nao use titulos gigantes, tabelas ou blocos longos.
      Nao coloque toda a resposta em negrito.
      Informe o caminho real do menu quando ele estiver na base.
      A pergunta atual sempre tem prioridade. Considere a memoria recente apenas
      quando a pergunta atual for claramente uma continuacao.
      Termine com uma sugestao curta de proximo passo quando for util.
      Nao invente telas, configuracoes ou estados. Se a base nao cobrir a
      pergunta, diga: "#{ReplymeshKnowledgeService::UNKNOWN}"
    PROMPT
  end

  def user_message_with_memory
    memory = conversation_memory
    parts = []
    parts << "Usuario atual: #{display_user_name}"
    parts << "Pagina atual: #{@page || 'nao informada'}"
    parts << "Conversa recente:\n#{memory}" if memory.present?
    parts << "Pergunta atual: #{@question}"
    parts.join("\n\n")
  end

  def conversation_memory
    return "" unless ReplymeshKnowledgeService.continuation?(@question)

    recent_logs.reverse.flat_map do |entry|
      [
        "Usuario: #{entry.question.to_s.truncate(500)}",
        "Carina: #{entry.response_summary.to_s.truncate(700)}"
      ]
    end.join("\n")
  end

  def recent_logs
    return [] unless @user

    @recent_logs ||= AiAssistantLog
      .conversation_for(@company.id, @user.id)
      .limit(MEMORY_INTERACTIONS)
      .to_a
  end

  def previous_questions
    return [] unless ReplymeshKnowledgeService.continuation?(@question)

    recent_logs.map(&:question)
  end

  def knowledge_context
    @rag_result ||= ReplymeshRagService.search(@question, previous_questions: previous_questions)
    @rag_result.chunks.map do |chunk|
      "## #{chunk[:module]}\n#{chunk[:content]}"
    end.join("\n\n")
  end

  def contextual_fallback
    ReplymeshKnowledgeService.fallback_answer(
      @question,
      previous_questions: previous_questions
    )
  end

  def knowledge_gap_message(provider_error)
    probable_module = ReplymeshKnowledgeService.new(@question).relevant_topics.first || "nao_identificado"
    ["knowledge_gap", "module=#{probable_module}", provider_error.presence].compact.join(" | ")
  end

  def safe_company_context
    store = @company.store_setting
    subscription = @company.subscriptions.includes(:plan).order(created_at: :desc).first
    primary_domain = @company.domains.find_by(is_primary: true) || @company.domains.first

    {
      company_id: @company.id,
      company_name: @company.name,
      company_slug: @company.slug,
      plan: subscription&.plan&.name,
      plan_status: subscription&.status || @company.plan_status,
      primary_domain: primary_domain&.domain,
      page: @page,
      modules_active: active_modules,
      whatsapp_connected: @company.whatsapp_instances.where(status: "connected").exists?,
      mercadopago_enabled: boolean_value(store, :mercadopago_enabled),
      pix_manual_enabled: boolean_value(store, :pix_enabled) && store&.pix_provider.to_s != "mercadopago",
      products_count: @company.products.count,
      orders_count: @company.orders.count,
      orders_today: @company.orders.where(created_at: Time.current.beginning_of_day..Time.current.end_of_day).count,
      cash_open: @company.cash_sessions.where(status: "open").exists?,
      open_tickets: @company.support_tickets.where.not(status: %w[resolved closed]).count,
      active_whatsapp_templates: @company.whatsapp_templates.where(enabled: true).count,
      store_status: store&.store_status
    }
  end

  def active_modules
    modules = %w[dashboard pedidos produtos categorias clientes configuracoes suporte]
    modules << "whatsapp" if @company.whatsapp_instances.exists? || @company.whatsapp_templates.exists?
    modules << "mercado_pago" if boolean_value(@company.store_setting, :mercadopago_enabled)
    modules << "pix" if boolean_value(@company.store_setting, :pix_enabled)
    modules << "cupons" if @company.coupons.exists?
    modules << "roleta" if @company.wheel_prizes.exists?
    modules << "mesas" if @company.dining_tables.exists?
    modules << "motoboys" if @company.motoboys.exists?
    modules << "estoque" if @company.inventory_items.exists?
    modules << "caixa" if @company.cash_sessions.exists?
    modules.uniq
  end

  def display_user_name
    name = @user&.name.to_s
    return @company.responsible_name if name.blank? || name.match?(/\Aadmin\b/i)

    name
  end

  def boolean_value(record, attribute)
    record&.respond_to?(attribute) ? ActiveModel::Type::Boolean.new.cast(record.public_send(attribute)) : false
  end

  def company_limit_reached?
    AiAssistantLog.today_for_company(@company.id).where(status: "success").count >= @settings.daily_company_limit
  end

  def user_limit_reached?
    return false unless @user

    AiAssistantLog.last_minute_for_user(@user.id).count >= @settings.per_minute_user_limit
  end

  def finish(answer, status, tokens: nil, source: "system", error: nil)
    used_tokens = tokens || estimate_tokens(@question.to_s + answer.to_s)
    response_time = elapsed_ms
    log!(status, answer, tokens: used_tokens, response_time_ms: response_time, error: error)
    log_usage!(status, used_tokens, response_time)

    {
      success: status != "error",
      status: status,
      answer: answer,
      tokens: used_tokens.to_i,
      response_time_ms: response_time,
      source: source,
      assistant: @settings.as_json_public
    }
  end

  def log_usage!(status, tokens, response_time)
    AiUsageLog.create!(
      company: @company,
      user: @user,
      assistant_type: "carina",
      provider: @settings.provider,
      model: @settings.model,
      total_tokens: tokens.to_i,
      estimated_cost_usd: (tokens.to_i / 1_000_000.0 * 2.0).round(6),
      response_time_ms: response_time,
      status: status == "success" ? "success" : status
    )
  rescue StandardError => e
    Rails.logger.warn("Carina usage log failed: #{e.class}")
  end

  def log!(status, answer, tokens:, response_time_ms:, error: nil)
    AiAssistantLog.create!(
      company: @company,
      user: @user,
      question: @question.truncate(2000),
      response_summary: answer.to_s.truncate(4000),
      status: status,
      page: @page,
      provider: @settings.provider,
      model: @settings.model,
      estimated_tokens: tokens,
      tokens_used: tokens,
      response_time_ms: response_time_ms,
      error_message: error.to_s.truncate(500).presence
    )
  rescue StandardError => e
    Rails.logger.warn("Carina log failed: #{e.class}")
  end

  def elapsed_ms
    ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - @started_at) * 1000).round
  end

  def estimate_tokens(text)
    (text.to_s.length / 4.0).ceil
  end
end
