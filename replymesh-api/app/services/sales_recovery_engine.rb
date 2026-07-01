class SalesRecoveryEngine
  DEFAULT_TEMPLATE = <<~TEXT.squish
    Oi, {nome}! Vi que voce estava escolhendo alguns itens na {loja}, mas nao finalizou.
    Separei seu carrinho por aqui: {itens}.
    {beneficio}
    Se quiser continuar, acesse {link_loja} ou responda por aqui que a equipe ajuda voce.
  TEXT

  FALLBACK_TEMPLATES = [
    "Oi, {nome}! Seu carrinho na {loja} ficou esperando voce: {itens}. {beneficio} Quer continuar o pedido? {link_loja}",
    "{nome}, deixamos seu pedido quase pronto na {loja}: {itens}. {beneficio} Pode finalizar pelo cardapio: {link_loja}",
    "Passando rapidinho, {nome}: aqueles itens que voce escolheu ainda estao no carrinho da {loja}. {beneficio} Link: {link_loja}",
    "Oi! Aqui e da {loja}. Voce estava vendo {itens}. {beneficio} Se quiser, finalize por aqui: {link_loja}",
    "Oi, {nome}! Seu pedido ficou quase pronto na {loja}. {itens}. {beneficio} Posso te ajudar a concluir?",
    "{nome}, ainda da tempo de finalizar seu carrinho na {loja}. {itens}. {beneficio}",
    "Voltei so para lembrar do seu carrinho na {loja}: {itens}. {beneficio} O link esta aqui: {link_loja}",
    "Seu carrinho na {loja} esta salvo por enquanto: {itens}. {beneficio} Se quiser, finalize pelo link {link_loja}",
    "Oi, {nome}! Notei que voce parou antes de confirmar na {loja}. {itens}. {beneficio}",
    "{nome}, sua escolha ficou boa: {itens}. {beneficio} Quer continuar agora? {link_loja}",
    "Aqui e da {loja}. Guardamos seu carrinho com {itens}. {beneficio} Finalize quando quiser: {link_loja}",
    "Oi! Se ainda bater aquela fome, seu carrinho na {loja} esta aqui: {itens}. {beneficio}",
    "{nome}, posso te ajudar a concluir o pedido na {loja}? Voce tinha separado {itens}. {beneficio}",
    "Boa noticia, {nome}: seu carrinho na {loja} ainda esta salvo. {itens}. {beneficio}",
    "Oi, {nome}! Seu pedido nao foi finalizado, mas ainda temos {itens} separado por aqui. {beneficio}",
    "A {loja} passou para lembrar: seu carrinho com {itens} ficou em aberto. {beneficio}",
    "Se quiser continuar, {nome}, seu carrinho na {loja} esta pronto com {itens}. {beneficio}",
    "Oi! Vi que voce quase fechou o pedido na {loja}. {itens}. {beneficio} Posso ajudar?",
    "{nome}, deixei seu carrinho salvo na {loja}: {itens}. {beneficio} E so continuar pelo link {link_loja}",
    "Ainda pensando no pedido? Na {loja}, seu carrinho com {itens} esta esperando. {beneficio}"
  ].freeze

  FINAL_STATUSES = %w[queued sent recovered].freeze

  def self.call(company:, now: Time.current, dry_run: false)
    new(company: company, now: now, dry_run: dry_run).call
  end

  def self.deliver(event:)
    new(company: event.company, now: Time.current, dry_run: false).deliver_event(event)
  end

  def initialize(company:, now: Time.current, dry_run: false)
    @company = company
    @now = now
    @dry_run = dry_run
    @setting = SalesRecoverySetting.for_company(company)
    @stats = { scanned: 0, queued: 0, sent: 0, skipped: 0, failed: 0, recovered: 0, blocked: 0 }
  end

  def call
    refresh_recovered_events!
    return result("disabled") unless @setting.enabled?
    return result("outside_window") unless allowed_delivery_window?

    candidates.each_with_index do |cart, index|
      @stats[:scanned] += 1
      if (reason = block_reason_for(cart))
        skip_cart!(cart, reason)
        next
      end

      event = queue_event_for(cart, index)
      @stats[:queued] += 1 if event.previously_new_record? || event.status == "queued"
      send_event!(event) if event.scheduled_at.blank? || event.scheduled_at <= @now
    rescue StandardError => e
      @stats[:failed] += 1
      Rails.logger.error("SalesRecoveryEngine cart #{cart&.id} failed: #{e.class} #{e.message}")
    end

    result("ok")
  end

  def deliver_event(event)
    return if event.company_id != @company.id
    return unless @setting.enabled?
    return unless allowed_delivery_window?

    if event.store_ai_cart && (reason = block_reason_for(event.store_ai_cart, current_event: event))
      block_event!(event, reason)
      return
    end

    send_event!(event)
  end

  private

  def candidates
    @company.store_ai_carts
      .includes(:store_ai_conversation)
      .where.not(stage: %w[completed handoff])
      .where("updated_at <= ?", @setting.delay_minutes.minutes.ago)
      .where("jsonb_array_length(items) > 0")
      .order(updated_at: :asc)
      .limit(50)
  end

  def queue_event_for(cart, index)
    event = @company.sales_recovery_events.find_or_initialize_by(store_ai_cart: cart)
    customer = find_customer(cart.customer_phone)
    score = recovery_score(cart, customer)
    coupon = event.coupon || (@setting.auto_coupon? ? build_coupon(cart, customer) : nil)
    message, strategy = build_message(cart: cart, customer: customer, coupon: coupon, score: score)
    event.assign_attributes(
      customer: customer,
      coupon: coupon,
      customer_phone: normalize_phone(cart.customer_phone),
      status: "queued",
      block_reason: nil,
      blocked_at: nil,
      scheduled_at: @now + (index * @setting.queue_spacing_minutes).minutes,
      cart_total_cents: cart.total_cents.to_i,
      recovery_score: score,
      abandoned_minutes: abandoned_minutes(cart),
      delivery_strategy: strategy,
      cart_snapshot: cart_snapshot(cart),
      message: message,
      error_message: nil,
      metadata_json: {
        "use_ai" => strategy == "ai",
        "auto_coupon" => @setting.auto_coupon?,
        "free_delivery" => coupon&.discount_type == "free_shipping",
        "delay_minutes" => @setting.delay_minutes,
        "cooldown_hours" => @setting.cooldown_hours,
        "cart_items_count" => cart_items_count(cart),
        "coupon_discount_type" => coupon&.discount_type,
        "coupon_discount_value" => coupon&.discount_value&.to_f
      }
    )
    event.save!
    SalesRecoveryDeliveryJob.set(wait_until: event.scheduled_at).perform_later(event.id) unless @dry_run
    event
  end

  def send_event!(event)
    return if @dry_run || event.status != "queued"

    log = MarketingMessageService.send!(
      company: @company,
      phone: event.customer_phone,
      message: event.message,
      customer: event.customer
    )
    event.update!(
      status: "sent",
      sent_at: Time.current,
      marketing_message_log: log,
      metadata_json: event.metadata_json.merge("provider" => log.provider)
    )
    @stats[:sent] += 1
  rescue StandardError => e
    event.update!(status: "failed", error_message: e.message.to_s.first(500))
    @stats[:failed] += 1
  end

  def build_coupon(cart, customer)
    code = unique_coupon_code
    benefit = coupon_benefit_for(cart, customer)
    @company.coupons.create!(
      customer: customer,
      code: code,
      title: benefit[:title],
      description: "Gerado automaticamente pelo Recuperador de Carrinho.",
      discount_type: benefit[:discount_type],
      discount_value: benefit[:discount_value],
      source: "sales_recovery",
      is_single_use_per_customer: true,
      max_uses: 1,
      starts_at: Time.current,
      expires_at: @setting.coupon_validity_hours.hours.from_now,
      metadata_json: { "engine" => "sales_recovery", "customer_phone" => customer&.phone, "rule" => benefit[:rule] }
    )
  end

  def coupon_benefit_for(cart, customer)
    rules = @setting.coupon_rules_json.to_h
    recurring = customer.present? && customer.total_orders.to_i > 1
    return free_delivery_benefit("recurring_customer") if recurring && truthy?(rules["recurring_free_delivery"])
    return free_delivery_benefit("setting_free_delivery") if @setting.free_delivery?

    threshold = rules["high_cart_threshold_cents"].presence&.to_i || 10_000
    low = rules["low_cart_discount_percent"].presence&.to_i || [@setting.default_discount_percent.to_i, 5].min
    high = rules["high_cart_discount_percent"].presence&.to_i || [@setting.default_discount_percent.to_i + 5, 15].min
    first_order = rules["first_order_discount_percent"].presence&.to_i || @setting.default_discount_percent.to_i
    percent = if customer.present? && customer.total_orders.to_i.zero?
                first_order
              elsif cart.total_cents.to_i >= threshold
                high
              else
                low
              end.clamp(1, 30)

    { title: "Cupom especial para finalizar", discount_type: "percentage", discount_value: percent, rule: "percentage_by_profile" }
  end

  def free_delivery_benefit(rule)
    { title: "Frete gratis para finalizar", discount_type: "free_shipping", discount_value: 0, rule: rule }
  end

  def unique_coupon_code
    loop do
      code = "VOLTA-#{SecureRandom.alphanumeric(5).upcase}"
      return code unless @company.coupons.exists?(code: code)
    end
  end

  def build_message(cart:, customer:, coupon:, score:)
    context = message_context(cart, customer, coupon, score)
    if @setting.use_ai?
      ai_message = ai_message_for(context)
      return [render_template(ai_message, context), "ai"] if ai_message.present?
    end

    [render_template(@setting.message_template.presence || template_for(cart, customer), context), "template"]
  end

  def ai_message_for(context)
    global = AiGlobalSetting.current
    provider = global.store_ai_provider.presence
    return nil if provider.blank? || provider == "disabled" || !global.store_ai_provider_configured?(provider)

    prompt = <<~PROMPT
      Crie uma mensagem curta de WhatsApp para recuperar um carrinho abandonado.
      Use portugues do Brasil, tom humano, simpatico e sem parecer robo.
      Nao use sempre a mesma estrutura.
      Nao invente produtos, precos ou promocoes.
      Loja: #{context[:loja]}
      Cliente: #{context[:nome]}
      Itens do carrinho: #{context[:itens]}
      Valor do carrinho: #{context[:valor]}
      Beneficio real: #{context[:beneficio]}
      Cupom real: #{context[:cupom].presence || "sem cupom"}
      Historico resumido: #{context[:historico]}
      Link da loja: #{context[:link_loja]}
      Responda apenas a mensagem final.
    PROMPT

    result = AiProviderService.build(
      provider: provider,
      api_key: global.store_ai_api_key_for(provider),
      model: global.store_ai_model
    ).chat(system_prompt: "Voce e uma atendente especialista em delivery e recuperacao de vendas.", user_message: prompt, max_tokens: 220)
    result.success? ? result.content.to_s : nil
  rescue StandardError => e
    Rails.logger.warn("Sales recovery AI fallback for company #{@company.id}: #{e.class} #{e.message}")
    nil
  end

  def template_for(cart, customer)
    seed = [cart.id.to_i, customer&.id.to_i, @now.to_date.yday].sum
    FALLBACK_TEMPLATES[seed % FALLBACK_TEMPLATES.length]
  end

  def render_template(template, context)
    template.to_s
      .gsub("{nome}", context[:nome])
      .gsub("{loja}", context[:loja])
      .gsub("{itens}", context[:itens])
      .gsub("{beneficio}", context[:beneficio])
      .gsub("{cupom}", context[:cupom])
      .gsub("{valor}", context[:valor])
      .gsub("{link_loja}", context[:link_loja])
      .strip
  end

  def message_context(cart, customer, coupon, score)
    {
      nome: customer&.full_name.presence || "tudo bem",
      loja: @company.name,
      itens: cart_items_label(cart),
      valor: money(cart.total_cents.to_i),
      beneficio: benefit_text(coupon),
      cupom: coupon&.code.to_s,
      historico: customer_history(customer),
      recovery_score: score,
      link_loja: public_store_url
    }
  end

  def benefit_text(coupon)
    return "Tenho uma condicao especial para voce finalizar hoje." unless coupon
    return "Liberamos frete gratis com o cupom #{coupon.code}." if coupon.discount_type == "free_shipping"

    "Use o cupom #{coupon.code} e ganhe #{coupon.discount_value.to_i}% de desconto."
  end

  def cart_items_label(cart)
    items = Array(cart.items).first(4).map { |item| "#{item['quantity'].to_i.nonzero? || 1}x #{item['name'] || item['product_name']}" }
    items.compact_blank.join(", ").presence || "seus itens"
  end

  def cart_snapshot(cart)
    {
      "items" => Array(cart.items).map { |item| item.slice("product_id", "name", "product_name", "quantity", "total_cents") },
      "stage" => cart.stage,
      "subtotal_cents" => cart.subtotal_cents,
      "delivery_fee_cents" => cart.delivery_fee_cents,
      "discount_cents" => cart.discount_cents,
      "total_cents" => cart.total_cents,
      "abandoned_minutes" => abandoned_minutes(cart),
      "conversation_status" => cart.store_ai_conversation&.status
    }
  end

  def block_reason_for(cart, current_event: nil)
    return "already_recovered" if recovered_before?(cart, current_event: current_event)
    return "empty_cart" if cart_items_count(cart).zero?
    return "cart_below_minimum" if cart.total_cents.to_i < @setting.min_cart_total_cents.to_i
    return "outside_window" unless @setting.allowed_today?(@now) && @setting.within_window?(@now)
    return "quiet_hours" if quiet_hours?
    return "store_closed" unless store_open_now?
    return "order_already_created" if order_created_after_cart?(cart)
    return "recent_customer_reply" if customer_replied_recently?(cart)
    return "active_conversation" if ai_still_conversing?(cart)
    return "cooldown_active" if cooldown_active?(cart.customer_phone, current_event: current_event)
    return "daily_limit_reached" if daily_limit_reached?(current_event: current_event)
    return "customer_limit_reached" if customer_limit_reached?(cart.customer_phone, current_event: current_event)

    nil
  end

  def allowed_delivery_window?
    @setting.allowed_today?(@now) && @setting.within_window?(@now) && !quiet_hours? && store_open_now?
  end

  def quiet_hours?
    return false unless @setting.quiet_hours_enabled?

    local = company_time
    starts = parse_time(@setting.quiet_window_start, local)
    ends_at = parse_time(@setting.quiet_window_end, local)
    ends_at < starts ? (local >= starts || local <= ends_at) : (local >= starts && local <= ends_at)
  end

  def store_open_now?
    hour = @company.business_hours.find { |row| row.day_of_week.to_i == company_time.wday }
    return true unless hour
    return false unless hour.is_open?

    starts = parse_time(hour.open_time, company_time)
    ends_at = parse_time(hour.close_time, company_time)
    ends_at += 1.day if ends_at < starts
    company_time >= starts && company_time <= ends_at
  rescue StandardError
    true
  end

  def customer_replied_recently?(cart)
    conversation = cart.store_ai_conversation
    return false unless conversation

    conversation.store_ai_messages
      .where(role: "user")
      .where("created_at >= ?", @setting.recent_response_minutes.minutes.ago)
      .exists?
  end

  def ai_still_conversing?(cart)
    conversation = cart.store_ai_conversation
    return false unless conversation&.status == "open"
    return false if conversation.last_message_at.blank?

    conversation.last_message_at > @setting.recent_response_minutes.minutes.ago
  end

  def order_created_after_cart?(cart)
    phone = normalize_phone(cart.customer_phone)
    local_phone = phone.sub(/\A55/, "")
    @company.orders
      .where("created_at >= ?", cart.updated_at)
      .where.not(status: "cancelled")
      .where("regexp_replace(coalesce(customer_phone, customer_whatsapp, ''), '\\D', '', 'g') IN (?)", [phone, local_phone])
      .exists?
  end

  def cooldown_active?(phone, current_event: nil)
    scope = @company.sales_recovery_events
      .where(customer_phone: normalize_phone(phone), status: FINAL_STATUSES)
      .where("created_at >= ?", @setting.cooldown_hours.hours.ago)
    scope = scope.where.not(id: current_event.id) if current_event&.persisted?
    scope.exists?
  end

  def recovery_score(cart, customer)
    score = 0
    score += [[cart.total_cents.to_i / 100, 35].min, 0].max
    score += [cart_items_count(cart) * 8, 24].min
    score += [[abandoned_minutes(cart) / 10, 20].min, 0].max
    score += 12 if customer&.total_orders.to_i > 1
    score += 6 if customer&.total_orders.to_i.zero?
    score += 3 if cart.payment_method.present?
    score.clamp(0, 100)
  end

  def cart_items_count(cart)
    Array(cart.items).sum { |item| item["quantity"].to_i.nonzero? || 1 }
  end

  def abandoned_minutes(cart)
    [((@now - cart.updated_at) / 60).floor, 0].max
  end

  def find_customer(phone)
    normalized = normalize_phone(phone)
    @company.customers.find_by(phone: normalized) ||
      @company.customers.find_by(whatsapp: normalized) ||
      @company.customers.where("regexp_replace(phone, '\\D', '', 'g') = ?", normalized.sub(/\A55/, "")).first
  end

  def normalize_phone(phone)
    value = phone.to_s.gsub(/\D/, "")
    value.start_with?("55") ? value : "55#{value}"
  end

  def recovered_before?(cart, current_event: nil)
    scope = @company.sales_recovery_events.where(store_ai_cart_id: cart.id, status: FINAL_STATUSES)
    scope = scope.where.not(id: current_event.id) if current_event&.persisted?
    scope.exists?
  end

  def daily_limit_reached?(current_event: nil)
    scope = @company.sales_recovery_events.today_for(@company).where(status: FINAL_STATUSES)
    scope = scope.where.not(id: current_event.id) if current_event&.persisted?
    scope.count >= @setting.daily_limit
  end

  def customer_limit_reached?(phone, current_event: nil)
    scope = @company.sales_recovery_events.today_for(@company)
      .where(customer_phone: normalize_phone(phone), status: FINAL_STATUSES)
    scope = scope.where.not(id: current_event.id) if current_event&.persisted?
    scope.count >= @setting.per_customer_daily_limit
  end

  def skip_cart!(cart, reason)
    @stats[:skipped] += 1
    @stats[:blocked] += 1
    event = @company.sales_recovery_events.find_or_initialize_by(store_ai_cart: cart)
    return if event.persisted? && FINAL_STATUSES.include?(event.status)

    customer = find_customer(cart.customer_phone)
    event.assign_attributes(
      customer: customer,
      customer_phone: normalize_phone(cart.customer_phone),
      status: "skipped",
      block_reason: reason,
      blocked_at: @now,
      cart_total_cents: cart.total_cents.to_i,
      recovery_score: recovery_score(cart, customer),
      abandoned_minutes: abandoned_minutes(cart),
      delivery_strategy: "blocked",
      cart_snapshot: cart_snapshot(cart),
      metadata_json: event.metadata_json.to_h.merge("blocked_reason" => reason)
    )
    event.save!
    Rails.logger.info("Sales recovery skipped cart #{cart.id}: #{reason}")
  end

  def block_event!(event, reason)
    event.update!(
      status: "skipped",
      block_reason: reason,
      blocked_at: @now,
      delivery_strategy: "blocked",
      metadata_json: event.metadata_json.to_h.merge("blocked_reason" => reason)
    )
    @stats[:skipped] += 1
    @stats[:blocked] += 1
  end

  def refresh_recovered_events!
    @company.sales_recovery_events.sent.where(recovered_at: nil).where.not(coupon_id: nil).includes(:coupon).find_each do |event|
      order = @company.orders.where("created_at >= ?", event.sent_at || event.created_at)
        .where("coupon_id = ? OR coupon_code = ?", event.coupon_id, event.coupon&.code)
        .where.not(status: "cancelled")
        .order(created_at: :asc)
        .first
      next unless order

      event.update!(
        status: "recovered",
        recovered_at: order.created_at,
        recovered_order: order,
        recovered_value_cents: order.total_cents.to_i
      )
      @stats[:recovered] += 1
    end
  end

  def public_store_url
    "https://#{@company.primary_domain.presence || @company.subdomain.presence || "#{@company.slug}.replymesh.cloud"}"
  end

  def company_time
    @now.in_time_zone(@company.timezone.presence || "America/Sao_Paulo")
  end

  def parse_time(value, base_time)
    hour, minute = value.to_s.split(":").map(&:to_i)
    base_time.change(hour: hour, min: minute, sec: 0)
  end

  def customer_history(customer)
    return "cliente ainda sem historico de compras" unless customer
    return "cliente recorrente com #{customer.total_orders} pedidos" if customer.total_orders.to_i > 1

    "cliente novo ou com poucas compras"
  end

  def money(cents)
    ActionController::Base.helpers.number_to_currency(cents.to_i / 100.0, unit: "R$ ", separator: ",", delimiter: ".")
  end

  def truthy?(value)
    ActiveModel::Type::Boolean.new.cast(value)
  end

  def result(status)
    { status: status, stats: @stats }
  end
end
