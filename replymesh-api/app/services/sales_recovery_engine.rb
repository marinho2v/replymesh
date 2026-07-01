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
    "Oi! Aqui e da {loja}. Voce estava vendo {itens}. {beneficio} Se quiser, finalize por aqui: {link_loja}"
  ].freeze

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
    @stats = { scanned: 0, queued: 0, sent: 0, skipped: 0, failed: 0, recovered: 0 }
  end

  def call
    refresh_recovered_events!
    return result("disabled") unless @setting.enabled?
    return result("outside_window") unless @setting.allowed_today?(@now) && @setting.within_window?(@now)

    candidates.each_with_index do |cart, index|
      @stats[:scanned] += 1
      next skip_cart!(cart, "already_recovered") if recovered_before?(cart)
      next skip_cart!(cart, "daily_limit_reached") if daily_limit_reached?
      next skip_cart!(cart, "customer_limit_reached") if customer_limit_reached?(cart.customer_phone)

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
    return unless @setting.allowed_today?(@now) && @setting.within_window?(@now)

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
    return event unless event.new_record?

    customer = find_customer(cart.customer_phone)
    coupon = @setting.auto_coupon? ? build_coupon(customer) : nil
    message = build_message(cart: cart, customer: customer, coupon: coupon)
    event.assign_attributes(
      customer: customer,
      coupon: coupon,
      customer_phone: normalize_phone(cart.customer_phone),
      status: "queued",
      scheduled_at: @now + (index * @setting.queue_spacing_minutes).minutes,
      cart_total_cents: cart.total_cents.to_i,
      cart_snapshot: cart_snapshot(cart),
      message: message,
      metadata_json: {
        "use_ai" => @setting.use_ai?,
        "auto_coupon" => @setting.auto_coupon?,
        "free_delivery" => @setting.free_delivery?,
        "delay_minutes" => @setting.delay_minutes
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

  def build_coupon(customer)
    code = unique_coupon_code
    @company.coupons.create!(
      customer: customer,
      code: code,
      title: @setting.free_delivery? ? "Frete gratis para voltar" : "Cupom de retorno",
      description: "Gerado automaticamente pelo Recuperador de Carrinho.",
      discount_type: @setting.free_delivery? ? "free_shipping" : "percentage",
      discount_value: @setting.free_delivery? ? 0 : @setting.default_discount_percent,
      source: "sales_recovery",
      is_single_use_per_customer: true,
      max_uses: 1,
      starts_at: Time.current,
      expires_at: @setting.coupon_validity_hours.hours.from_now,
      metadata_json: { "engine" => "sales_recovery", "customer_phone" => customer&.phone }
    )
  end

  def unique_coupon_code
    loop do
      code = "VOLTA-#{SecureRandom.alphanumeric(5).upcase}"
      return code unless @company.coupons.exists?(code: code)
    end
  end

  def build_message(cart:, customer:, coupon:)
    context = message_context(cart, customer, coupon)
    ai_message = @setting.use_ai? ? ai_message_for(context) : nil
    render_template(ai_message.presence || @setting.message_template.presence || template_for(cart), context)
  end

  def ai_message_for(context)
    global = AiGlobalSetting.current
    provider = global.store_ai_provider.presence
    return nil if provider.blank? || provider == "disabled" || !global.store_ai_provider_configured?(provider)

    prompt = <<~PROMPT
      Crie uma mensagem curta de WhatsApp para recuperar um carrinho abandonado.
      Use portugues do Brasil, tom humano, simpatico e sem parecer robo.
      Nao invente produtos, precos ou promocoes.
      Loja: #{context[:loja]}
      Cliente: #{context[:nome]}
      Itens do carrinho: #{context[:itens]}
      Beneficio: #{context[:beneficio]}
      Link da loja: #{context[:link_loja]}
      Responda apenas a mensagem final.
    PROMPT

    result = AiProviderService.build(
      provider: provider,
      api_key: global.store_ai_api_key_for(provider),
      model: global.store_ai_model
    ).chat(system_prompt: "Voce e uma atendente especialista em delivery.", user_message: prompt, max_tokens: 220)
    result.success? ? result.content.to_s : nil
  rescue StandardError => e
    Rails.logger.warn("Sales recovery AI fallback for company #{@company.id}: #{e.class} #{e.message}")
    nil
  end

  def template_for(cart)
    FALLBACK_TEMPLATES[cart.id.to_i % FALLBACK_TEMPLATES.length]
  end

  def render_template(template, context)
    template.to_s
      .gsub("{nome}", context[:nome])
      .gsub("{loja}", context[:loja])
      .gsub("{itens}", context[:itens])
      .gsub("{beneficio}", context[:beneficio])
      .gsub("{cupom}", context[:cupom])
      .gsub("{link_loja}", context[:link_loja])
      .strip
  end

  def message_context(cart, customer, coupon)
    {
      nome: customer&.full_name.presence || "tudo bem",
      loja: @company.name,
      itens: cart_items_label(cart),
      beneficio: benefit_text(coupon),
      cupom: coupon&.code.to_s,
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
      "total_cents" => cart.total_cents
    }
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

  def recovered_before?(cart)
    @company.sales_recovery_events.exists?(store_ai_cart_id: cart.id, status: %w[queued sent recovered])
  end

  def daily_limit_reached?
    @company.sales_recovery_events.today_for(@company).where(status: %w[queued sent recovered]).count >= @setting.daily_limit
  end

  def customer_limit_reached?(phone)
    @company.sales_recovery_events.today_for(@company)
      .where(customer_phone: normalize_phone(phone), status: %w[queued sent recovered])
      .count >= @setting.per_customer_daily_limit
  end

  def skip_cart!(cart, reason)
    @stats[:skipped] += 1
    Rails.logger.info("Sales recovery skipped cart #{cart.id}: #{reason}")
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

  def result(status)
    { status: status, stats: @stats }
  end
end
