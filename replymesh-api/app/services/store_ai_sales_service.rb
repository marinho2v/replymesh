require "cgi"

class StoreAiSalesService
  STAGE_LABELS = {
    "greeting" => "Saudacao",
    "product_discovery" => "Descoberta de produto",
    "product_selection" => "Selecao de produto",
    "upsell" => "Sugestao adicional",
    "customer_identification" => "Identificacao do cliente",
    "address_collection" => "Coleta de endereco",
    "payment_selection" => "Selecao de pagamento",
    "order_confirmation" => "Confirmacao do pedido",
    "waiting_payment" => "Aguardando pagamento",
    "completed" => "Concluido",
    "handoff" => "Atendimento humano"
  }.freeze

  Result = Struct.new(:answer, :status, :stage, :next_action, :products, :cart, :order, :provider_called, :fallback, keyword_init: true) do
    def to_h
      {
        answer: answer,
        status: status,
        stage: stage,
        next_action: next_action,
        products: products,
        cart: cart,
        order: order,
        provider_called: provider_called,
        fallback: fallback
      }
    end
  end

  def self.call(company:, user:, question:, phone:, settings:, global:, simulate: false)
    new(company: company, user: user, question: question, phone: phone, settings: settings, global: global, simulate: simulate).call
  end

  def initialize(company:, user:, question:, phone:, settings:, global:, simulate: false)
    @company = company
    @user = user
    @question = question.to_s.strip
    @phone = phone.to_s.gsub(/\D/, "").presence || "simulator"
    @settings = settings
    @global = global
    @simulate = simulate
  end

  def call
    conversation.store_ai_messages.create!(role: "user", content: @question) if @question.present?

    return handoff!("customer_requested_human") if human_request?
    return existing_pix_status_answer if existing_pix_status_request?
    return order_status_answer if order_status_request?
    return completed_order_answer if recently_completed_order?
    return handle_greeting if greeting_without_cart?
    return handle_photo_request if photo_request?
    return handle_confirmation if confirmation?
    return handle_payment_details if collecting_payment_details?
    return handle_payment_selection if payment_selection?
    return handle_upsell if waiting_for_upsell?
    return handle_customer_name if waiting_for_customer_name?
    return handle_address if waiting_for_address?
    return handle_product_number if product_number_selection?
    return handle_product_search
  rescue StandardError => e
    log_event("flow_failed", exception: e)
    answer(
      "Nao consegui continuar o atendimento automatico com seguranca. Vou deixar um atendente assumir por aqui.",
      "fallback",
      stage: "handoff",
      next_action: "human_handoff",
      fallback: true
    )
  ensure
    persist_assistant_message if @last_answer.present?
  end

  private

  def conversation
    @conversation ||= begin
      current = StoreAiConversation.latest_for_phone(@company.id, @phone).first
      current&.resume_if_expired!
      current = nil if current&.status == "handed_off"
      current = nil if current&.status == "closed" && current.last_message_at.to_i < 30.minutes.ago.to_i
      current ||= @company.store_ai_conversations.create!(
        phone: @phone,
        channel: @simulate ? "simulator" : "whatsapp",
        status: "open",
        last_message_at: Time.current
      )
      current
    end
  end

  def cart
    @cart ||= begin
      current = conversation.store_ai_cart
      current = nil if current&.expired? && conversation.status != "closed"
      current ||= @company.store_ai_carts.create!(
        store_ai_conversation: conversation,
        customer_phone: @phone,
        stage: "greeting",
        expires_at: 2.hours.from_now
      )
      current
    end
  end

  def handle_product_search
    products = relevant_products
    return unknown_product_answer if products.empty?

    if products.one? || exact_product?(products.first)
      add_product(products.first)
      return offer_upsell_or_continue
    end

    cart.update!(
      stage: "product_selection",
      metadata_json: cart.metadata_json.merge("candidate_product_ids" => products.map(&:id))
    )
    answer(
      WhatsappMessageBuilder.fallback_text(
        WhatsappMessageBuilder.list(
          body: "Encontrei essas opcoes para voce:",
          items: products.map { |product| { label: "#{product.name} - #{format_brl(price_for(product))}" } }
        )
      ),
      "success",
      products: serialize_products(products),
      next_action: "select_product"
    )
  end

  def handle_product_number
    ids = Array(cart.metadata_json["candidate_product_ids"])
    index = @question[/\d+/].to_i - 1
    product = @company.products.active.find_by(id: ids[index])
    return handle_product_search unless product

    add_product(product)
    offer_upsell_or_continue
  end

  def handle_greeting
    customer = customer_by_phone
    products = recommended_products(@company.products.active.includes(:category).limit(80))
    intro = if customer
      cart.update!(
        stage: "product_selection",
        metadata_json: cart.metadata_json.merge(
          "customer_id" => customer.id,
          "candidate_product_ids" => products.map(&:id)
        )
      )
      "Ola, #{customer.full_name}! Sou a assistente virtual da loja e posso ajudar voce a fazer seu pedido."
    else
      cart.update!(
        stage: "customer_identification",
        metadata_json: cart.metadata_json.merge("name_context" => "greeting")
      )
      "Ola! Sou a assistente virtual da loja e posso ajudar voce a fazer seu pedido.\n\nAntes de comecar, qual seu nome?"
    end

    return answer(intro, "success", next_action: customer ? "product_discovery" : "collect_customer_name") unless customer

    answer(
      "#{intro}\n\n#{recommendation_text(products)}",
      "success",
      products: serialize_products(products),
      next_action: "select_product"
    )
  end

  def add_product(product)
    item = {
      "product_id" => product.id,
      "name" => product.name,
      "quantity" => 1,
      "unit_price_cents" => price_for(product),
      "total_cents" => price_for(product),
      "selected_options" => []
    }
    cart.update!(items: Array(cart.items) + [item])
    cart.refresh_totals!
    log_event("product_selected", product_id: product.id, total_cents: cart.total_cents)
  end

  def ask_address
    customer = customer_by_phone
    if customer && @settings.confirm_saved_address? && customer.customer_addresses.any?
      address = customer.customer_addresses.order(is_default: :desc, updated_at: :desc).first
      cart.update!(
        stage: "address_confirmation",
        delivery_address: serialize_address(address),
        metadata_json: cart.metadata_json.merge("customer_id" => customer.id)
      )
      return answer(
        "Separei #{cart.items.last['name']} no carrinho.\n\nEncontrei este endereco salvo:\n#{address_line(address)}\n\nPode usar esse endereco? Responda *sim* ou envie outro endereco.",
        "success",
        next_action: "confirm_address"
      )
    end

    unless cart.metadata_json["customer_name"].present?
      cart.update!(stage: "customer_identification")
      return answer(
        "Separei #{cart.items.last['name']} no carrinho.\n\nPara finalizar, qual seu nome?",
        "success",
        next_action: "collect_customer_name"
      )
    end

    cart.update!(stage: "address_collection")
    answer(
      "Separei #{cart.items.last['name']} no carrinho.\n\nAgora me envie o endereco de entrega com rua, numero e bairro.",
      "success",
      next_action: "collect_address"
    )
  end

  def handle_customer_name
    name = @question.to_s.squish
    if name.length < 2 || name.match?(/\d{4,}/)
      return answer("Me informe seu nome para continuar o pedido.", "blocked", next_action: "collect_customer_name")
    end

    cart.update!(
      stage: cart.items.any? ? "address_collection" : "product_discovery",
      metadata_json: cart.metadata_json.merge("customer_name" => name).except("name_context")
    )
    unless cart.items.any?
      products = recommended_products(@company.products.active.includes(:category).limit(80))
      cart.update!(
        stage: "product_selection",
        metadata_json: cart.metadata_json.merge("candidate_product_ids" => products.map(&:id))
      )
      return answer(
        "Obrigado, #{name}.\n\n#{recommendation_text(products)}",
        "success",
        products: serialize_products(products),
        next_action: "select_product"
      )
    end

    answer(
      "Obrigado, #{name}. Agora me envie o endereco de entrega com rua, numero e bairro.",
      "success",
      next_action: "collect_address"
    )
  end

  def offer_upsell_or_continue
    suggestion = upsell_product
    return ask_address unless suggestion

    cart.update!(
      stage: "upsell",
      metadata_json: cart.metadata_json.merge("upsell_product_id" => suggestion.id)
    )
    answer(
      "Boa escolha! Gostaria de adicionar #{suggestion.name} por #{format_brl(price_for(suggestion))}? Responda *sim* ou *nao*.",
      "success",
      products: serialize_products([suggestion]),
      next_action: "offer_upsell"
    )
  end

  def handle_upsell
    suggestion = @company.products.active.find_by(id: cart.metadata_json["upsell_product_id"])
    if yes? && suggestion
      add_product(suggestion)
      cart.update!(metadata_json: cart.metadata_json.except("upsell_product_id"))
      continuation = ask_address
      return answer(
        "#{suggestion.name} foi adicionado ao pedido.\n\n#{continuation.answer}",
        "success",
        next_action: continuation.next_action
      )
    end

    if negative_answer?
      cart.update!(metadata_json: cart.metadata_json.except("upsell_product_id"))
      return ask_address
    end

    answer("Deseja adicionar o item sugerido? Responda *sim* ou *nao*.", "blocked", next_action: "offer_upsell")
  end

  def handle_address
    if yes? && cart.delivery_address.present?
      calculate_delivery
      return ask_payment
    end

    if cart.stage == "address_confirmation" && !looks_like_address?
      return answer(
        "Pode confirmar se vamos usar o endereco salvo? Responda *sim* ou envie outro endereco completo com rua, numero e bairro.",
        "blocked",
        next_action: "confirm_address"
      )
    end

    unless looks_like_address?
      return answer(
        "Me envie o endereco de entrega com rua, numero e bairro para continuar.",
        "blocked",
        next_action: "collect_address"
      )
    end

    parsed = parse_address(@question)
    cart.update!(delivery_address: parsed, stage: "delivery_calculation")
    calculate_delivery
    ask_payment
  end

  def ask_payment
    methods = []
    methods << "Dinheiro" if @settings.offer_cash?
    methods << "Pix" if pix_available?
    methods << "Cartao na entrega"
    cart.update!(
      stage: "payment_selection",
      metadata_json: cart.metadata_json.except(
        "payment_step", "payment_mode", "needs_change", "change_for_cents", "card_type"
      )
    )
    answer(
      "Pedido ate aqui:\n#{cart_summary}\n\nForma de pagamento: #{methods.uniq.join(', ')}?",
      "success",
      next_action: "select_payment"
    )
  end

  def handle_payment_selection
    if normalized_question.match?(/pix/)
      return pix_unavailable_answer unless pix_available?

      mode = automatic_pix_available? ? "mercadopago" : "manual"
      cart.update!(
        payment_method: "pix",
        stage: "order_confirmation",
        metadata_json: cart.metadata_json.merge("payment_mode" => mode).except("payment_step")
      )
      return ask_final_confirmation
    end

    if normalized_question.match?(/dinheiro|troco/)
      amount_cents = money_cents_from(@question) if normalized_question.match?(/troco/)
      if amount_cents.present?
        cart.update!(
          payment_method: "money",
          stage: "order_confirmation",
          metadata_json: cart.metadata_json.merge(
            "needs_change" => true,
            "change_for_cents" => amount_cents
          ).except("payment_step")
        )
        return ask_final_confirmation
      end

      cart.update!(
        payment_method: "money",
        metadata_json: cart.metadata_json.merge("payment_step" => "cash_change_question")
      )
      return answer(
        "Vai precisar de troco? Responda *nao* ou *sim*.",
        "success",
        next_action: "ask_change"
      )
    end

    if normalized_question.match?(/credito|debito/)
      return select_card_type(normalized_question.match?(/credito/) ? "credito" : "debito")
    end

    if normalized_question.match?(/cartao/)
      cart.update!(
        payment_method: "card_on_delivery",
        metadata_json: cart.metadata_json.merge("payment_step" => "card_type")
      )
      return answer(
        "Vai pagar no *credito* ou *debito*?",
        "success",
        next_action: "ask_card_type"
      )
    end

    return answer(
      "Escolha a forma de pagamento para finalizar: *Pix*, *dinheiro* ou *cartao*.",
      "blocked",
      next_action: "select_payment"
    )
  end

  def handle_payment_details
    case cart.metadata_json["payment_step"]
    when "cash_change_question"
      return handle_cash_change_question
    when "cash_change_amount"
      return handle_cash_change_amount
    when "card_type"
      return select_card_type("credito") if normalized_question.match?(/credito/)
      return select_card_type("debito") if normalized_question.match?(/debito/)

      answer("Me confirme se o cartao sera *credito* ou *debito*.", "blocked", next_action: "ask_card_type")
    end
  end

  def handle_cash_change_question
    amount_cents = money_cents_from(@question)
    return save_cash_change_amount(amount_cents) if amount_cents.present?

    if negative_answer?
      cart.update!(
        stage: "order_confirmation",
        metadata_json: cart.metadata_json.merge(
          "needs_change" => false,
          "change_for_cents" => nil
        ).except("payment_step")
      )
      return ask_final_confirmation
    end

    if yes?
      cart.update!(metadata_json: cart.metadata_json.merge("payment_step" => "cash_change_amount"))
      return answer("Troco para quanto?", "success", next_action: "ask_change_amount")
    end

    answer("Responda *nao* se nao precisa de troco ou *sim* se precisa.", "blocked", next_action: "ask_change")
  end

  def handle_cash_change_amount
    amount_cents = money_cents_from(@question)
    save_cash_change_amount(amount_cents)
  end

  def save_cash_change_amount(amount_cents)
    if amount_cents.blank? || amount_cents < cart.total_cents
      return answer(
        "Informe um valor de troco igual ou maior que #{format_brl(cart.total_cents)}. Exemplo: *troco para 100*.",
        "blocked",
        next_action: "ask_change_amount"
      )
    end

    cart.update!(
      stage: "order_confirmation",
      metadata_json: cart.metadata_json.merge(
        "needs_change" => true,
        "change_for_cents" => amount_cents
      ).except("payment_step")
    )
    ask_final_confirmation
  end

  def select_card_type(card_type)
    cart.update!(
      payment_method: "card_on_delivery",
      stage: "order_confirmation",
      metadata_json: cart.metadata_json.merge("card_type" => card_type).except("payment_step")
    )
    ask_final_confirmation
  end

  def ask_final_confirmation
    answer(
      "Confira seu pedido:\n\n#{final_order_summary}\n\nResponda *CONFIRMAR* para finalizar ou *ATENDENTE* para falar com a equipe.",
      "success",
      next_action: "confirm_order"
    )
  end

  def handle_confirmation
    unless cart.items.any? && cart.payment_method.present?
      return answer("Antes de confirmar, preciso montar o carrinho e escolher a forma de pagamento.", "blocked", next_action: "continue_sale")
    end

    if @simulate || !@settings.create_order_after_confirmation?
      cart.update!(stage: "completed")
      return answer(
        "Simulacao segura: o pedido esta pronto para ser criado, mas nenhum pedido real foi gravado.\n\n#{cart_summary}",
        "success",
        stage: "completed",
        next_action: "simulated_order_ready"
      )
    end

    checkout = CheckoutService.call(company: @company, params: checkout_params, ip: nil)
    unless checkout.success?
      log_event("order_creation_failed", errors: checkout.errors)
      return answer(
        "Nao consegui finalizar seu pedido com seguranca. Vou deixar a equipe continuar por aqui.",
        "fallback",
        next_action: "human_handoff",
        fallback: true
      )
    end

    order = checkout.order
    order.update!(legacy_source: "whatsapp_ai") if order.respond_to?(:legacy_source=)
    log_event(
      "order_created",
      order_id: order.id,
      total_cents: order.total_cents,
      payment_method: order.payment_method
    )
    pix_text = finalize_pix_payment(order)
    cart.complete!
    conversation.update!(status: "closed", last_message_at: Time.current)
    answer(
      ["Pedido ##{order.order_number} criado com sucesso.", pix_text, "A equipe da loja ja recebeu o pedido."].compact_blank.join("\n\n"),
      "success",
      stage: cart.stage,
      next_action: pix_text.present? ? "waiting_payment" : "completed",
      order: serialize_order(order)
    )
  end

  def finalize_pix_payment(order)
    return nil unless order.payment_method == "pix"

    return manual_pix_instructions(order) unless automatic_pix_available?

    settings = store_settings
    result = MercadoPagoPixService.new(settings.mercadopago_access_token).create_pix_payment(
      order: order,
      payer_email: order.customer&.email
    )
    return "Nao consegui gerar o Pix agora. A loja vai continuar o atendimento." unless result.success?

    order.update!(
      external_payment_id: result.payment_id,
      payment_status: "pending_payment",
      pix_copy_paste: result.qr_code,
      pix_qr_code_base64: result.qr_code_base64,
      pix_ticket_url: result.ticket_url
    )
    cart.update!(stage: "waiting_payment")
    [
      "Pedido gerado! Total: #{format_brl(order.total_cents)}.",
      result.qr_code.present? ? "Pague pelo Pix abaixo:\n\n#{result.qr_code}" : nil,
      result.ticket_url.present? ? "Link para pagamento: #{result.ticket_url}" : nil,
      "Assim que o pagamento for aprovado, o sistema confirma automaticamente."
    ].compact.join("\n\n")
  rescue StandardError => e
    Rails.logger.warn("Store AI Mercado Pago pix failed: #{e.class}")
    "Nao consegui gerar o Pix agora. A loja vai continuar o atendimento."
  end

  def manual_pix_instructions(order)
    order.update!(payment_status: "pending")
    settings = store_settings
    pix_value = settings.pix_payload.presence || settings.pix_key.presence
    receiver = settings.pix_receiver_name.presence
    cart.update!(stage: "completed")

    [
      "Pedido recebido! Total: #{format_brl(order.total_cents)}.",
      "Pagamento via Pix manual:",
      pix_value.present? ? "Chave Pix:\n#{pix_value}" : nil,
      receiver.present? ? "Nome/beneficiario:\n#{receiver}" : nil,
      "Depois de pagar, envie o comprovante por aqui.",
      "A loja vai conferir e confirmar seu pedido."
    ].compact.join("\n\n")
  end

  def handle_photo_request
    product = selected_product || relevant_products.first
    return answer("Me diga de qual produto voce quer a foto.", "blocked", next_action: "ask_product_photo") unless product

    link = public_product_link(product)
    details = [product.description.to_s.squish.presence, "Preco: #{format_brl(price_for(product))}"].compact.join("\n")
    text = if product.respond_to?(:image_url) && product.image_url.present?
      "Veja a foto e os detalhes de #{product.name} aqui: #{link}\n\n#{details}"
    else
      "Nao encontrei foto cadastrada para #{product.name}. Veja os detalhes no cardapio: #{link}\n\n#{details}"
    end
    answer(text, "success", products: serialize_products([product]), next_action: "show_product")
  end

  def handoff!(reason)
    cart.handoff!(reason: reason)
    conversation.pause_for!(30.minutes, reason: reason)
    answer("Certo, vou deixar um atendente continuar por aqui.", "handoff", stage: "handoff", next_action: "human_handoff")
  end

  def unknown_product_answer
    if @settings.handoff_on_unknown?
      cart.metadata_json["unknown_count"] = cart.metadata_json["unknown_count"].to_i + 1
      cart.save!
      return handoff!("unknown_after_two_attempts") if cart.metadata_json["unknown_count"].to_i >= 2
    end

    answer("Nao encontrei esse produto no cardapio atual. Pode me dizer outro nome ou categoria?", "fallback", next_action: "product_discovery", fallback: true)
  end

  def answer(text, status, stage: nil, next_action: nil, products: [], order: nil, provider_called: false, fallback: false)
    @last_answer = text
    @last_result = Result.new(
      answer: text,
      status: status,
      stage: stage || cart.stage,
      next_action: next_action,
      products: products,
      cart: serialize_cart,
      order: order,
      provider_called: provider_called,
      fallback: fallback
    )
  end

  def persist_assistant_message
    conversation.store_ai_messages.create!(
      role: "assistant",
      content: @last_answer,
      rag_chunks: [],
      tokens_used: estimate_tokens(@question + @last_answer.to_s),
      response_time_ms: 0
    )
    conversation.update!(last_message_at: Time.current)
  rescue StandardError => e
    Rails.logger.warn("Store AI sales message log failed: #{e.class}")
  end

  def relevant_products
    @relevant_products ||= begin
      linked_product = product_from_link
      if linked_product
        [linked_product]
      else
        terms = expanded_search_terms(normalized_question.split - ReplymeshKnowledgeService::STOP_WORDS)
        scope = @company.products.active.includes(:category).ordered.limit(80)
        if recommendation_request?
          recommended_products(scope)
        else
          ranked = scope.map do |product|
            haystack = ReplymeshKnowledgeService.normalize([product.name, product.description, product.category&.name].join(" "))
            score = terms.sum { |term| haystack.include?(term) ? (haystack.start_with?(term) ? 8 : 3) : 0 }
            score += 2 if normalized_question.match?(/hamburg|burger|lanche/) && haystack.match?(/hamburg|burger|lanche/)
            score += 2 if product.is_featured?
            score += 1 if product.is_promotional?
            [product, score]
          end
          ranked.select { |_product, score| score.positive? }.sort_by { |_product, score| -score }.map(&:first).first(5)
        end
      end
    end
  end

  def recommended_products(scope)
    sales = OrderItem
      .joins(:order)
      .where(orders: { company_id: @company.id })
      .where.not(orders: { status: "cancelled" })
      .where(product_id: scope.map(&:id))
      .group(:product_id)
      .sum(:quantity)

    scope.sort_by do |product|
      [
        -sales.fetch(product.id, 0),
        product.is_featured? ? 0 : 1,
        product.is_promotional? ? 0 : 1,
        -product.created_at.to_i,
        product.sort_order
      ]
    end.first(5)
  end

  def expanded_search_terms(terms)
    related = {
      "coca" => %w[coca cola refrigerante bebida],
      "refri" => %w[refrigerante bebida coca cola],
      "batata" => %w[batata frita acompanhamento],
      "lanche" => %w[lanche hamburguer burger sanduiche],
      "hamburguer" => %w[hamburguer burger lanche],
      "costela" => %w[costela artesanal],
      "bacon" => %w[bacon],
      "cheddar" => %w[cheddar queijo],
      "doce" => %w[doce sobremesa],
      "combo" => %w[combo promocao]
    }
    (terms + terms.flat_map { |term| related.fetch(term, []) }).uniq
  end

  def upsell_product
    return if cart.items.size > 1

    selected_ids = Array(cart.items).map { |item| item["product_id"] }
    candidates = @company.products.active.includes(:category).where.not(id: selected_ids).limit(80)
    candidates.min_by do |product|
      text = ReplymeshKnowledgeService.normalize([product.name, product.description, product.category&.name].join(" "))
      priority = if text.match?(/bebida|refrigerante|coca|suco/)
        0
      elsif text.match?(/batata|acompanhamento|sobremesa|doce|combo/)
        1
      else
        3
      end
      [priority, product.is_promotional? ? 0 : 1, product.is_featured? ? 0 : 1, product.sort_order]
    end
  end

  def recommendation_text(products)
    return "Me diga o que voce gostaria de pedir hoje." if products.empty?

    lines = products.first(5).each_with_index.map do |product, index|
      "#{index + 1} - #{product.name} - #{format_brl(price_for(product))}"
    end
    "Hoje nossas recomendacoes sao:\n\n#{lines.join("\n")}\n\nQual voce gostaria?"
  end

  def product_from_link
    slug = @question.to_s[/[?&]produto=([^&#\s]+)/i, 1]
    slug ||= @question.to_s[%r{/produtos?/([^/?#\s]+)}i, 1]
    return if slug.blank?

    @company.products.active.find_by(slug: CGI.unescape(slug))
  rescue ArgumentError
    nil
  end

  def recommendation_request?
    normalized_question.match?(/recomenda|recomendacao|mais vendido|melhor|destaque|promocao/)
  end

  def selected_product
    product_id = Array(cart.items).last&.dig("product_id")
    @company.products.active.find_by(id: product_id) if product_id
  end

  def exact_product?(product)
    ReplymeshKnowledgeService.normalize(product.name).split.all? { |term| normalized_question.include?(term) }
  end

  def calculate_delivery
    return cart.update!(delivery_fee_cents: 0).tap { cart.refresh_totals! } unless @settings.calculate_delivery_fee?

    neighborhood = ReplymeshKnowledgeService.normalize(cart.delivery_address["neighborhood"].to_s)
    zone = @company.delivery_zones.active.by_priority.find do |item|
      names = [item.name, *Array(item.aliases)].map { |value| ReplymeshKnowledgeService.normalize(value) }
      names.any? { |name| name.present? && neighborhood.include?(name) }
    end
    cart.update!(delivery_fee_cents: zone&.delivery_fee_cents.to_i || @company.store_setting&.delivery_fee_cents.to_i)
    cart.refresh_totals!
  end

  def parse_address(text)
    parts = text.to_s.split(",").map(&:strip)
    {
      "street" => parts[0].presence || text.to_s,
      "number" => parts[1].to_s[/\d+/],
      "neighborhood" => parts[2].presence || text.to_s,
      "city" => @company.store_setting&.city,
      "state" => @company.store_setting&.state
    }.compact
  end

  def checkout_params
    metadata = cart.metadata_json
    notes = []
    notes << "Cartao na entrega: #{metadata['card_type']}" if metadata["card_type"].present?
    notes << "Pix manual - aguardando confirmacao da loja" if metadata["payment_mode"] == "manual"

    {
      order_type: "delivery",
      payment_method: cart.payment_method.presence || "money",
      needs_change: metadata["needs_change"] == true,
      change_for_cents: metadata["change_for_cents"],
      notes: notes.presence&.join(" | "),
      customer: {
        full_name: customer_by_phone&.full_name.presence || cart.metadata_json["customer_name"],
        phone: @phone,
        whatsapp: @phone
      },
      address: cart.delivery_address,
      items: Array(cart.items).map do |item|
        {
          product_id: item["product_id"],
          quantity: item["quantity"],
          selected_options: item["selected_options"]
        }
      end
    }
  end

  def customer_by_phone
    return nil unless @settings.identify_customer_by_phone?

    @customer_by_phone ||= @company.customers.where(phone: [@phone, @phone.sub(/\A55/, "")]).first
  end

  def serialize_cart
    {
      stage: cart.stage,
      stage_label: STAGE_LABELS[cart.stage],
      items: cart.items,
      delivery_address: cart.delivery_address,
      delivery_fee_cents: cart.delivery_fee_cents,
      subtotal_cents: cart.subtotal_cents,
      discount_cents: cart.discount_cents,
      total_cents: cart.total_cents,
      payment_method: cart.payment_method,
      payment_mode: cart.metadata_json["payment_mode"],
      needs_change: cart.metadata_json["needs_change"],
      change_for_cents: cart.metadata_json["change_for_cents"],
      card_type: cart.metadata_json["card_type"],
      expires_at: cart.expires_at
    }
  end

  def serialize_products(products)
    Array(products).map do |product|
      {
        id: product.id,
        name: product.name,
        price_cents: price_for(product),
        category: product.category&.name,
        link: public_product_link(product)
      }
    end
  end

  def serialize_order(order)
    {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      total_cents: order.total_cents
    }
  end

  def serialize_address(address)
    {
      "street" => address.street,
      "number" => address.number,
      "complement" => address.complement,
      "neighborhood" => address.neighborhood,
      "city" => address.city,
      "state" => address.state,
      "reference" => address.reference
    }.compact
  end

  def address_line(address)
    [address.street, address.number, address.neighborhood, address.city].compact_blank.join(", ")
  end

  def cart_summary
    item_lines = Array(cart.items).map { |item| "- #{item['quantity']}x #{item['name']} — #{format_brl(item['total_cents'])}" }
    (item_lines + ["Entrega: #{format_brl(cart.delivery_fee_cents)}", "Total: #{format_brl(cart.total_cents)}"]).join("\n")
  end

  def final_order_summary
    address = cart.delivery_address
    lines = [
      cart_summary,
      "Endereco: #{[address['street'], address['number'], address['neighborhood'], address['city']].compact_blank.join(', ')}",
      "Pagamento: #{payment_description}"
    ]
    if cart.payment_method == "money"
      lines << if cart.metadata_json["needs_change"]
        "Troco para: #{format_brl(cart.metadata_json['change_for_cents'])}"
      else
        "Troco: nao precisa"
      end
    end
    lines.join("\n")
  end

  def payment_description
    case cart.payment_method
    when "pix"
      cart.metadata_json["payment_mode"] == "mercadopago" ? "Pix automatico Mercado Pago" : "Pix manual"
    when "card_on_delivery"
      "Cartao na entrega - #{cart.metadata_json['card_type']}"
    else
      payment_label(cart.payment_method)
    end
  end

  def pix_available?
    @settings.offer_pix? && (automatic_pix_available? || manual_pix_available?)
  end

  def automatic_pix_available?
    settings = store_settings
    FeatureGate.enabled?(@company, "pix") &&
      FeatureGate.enabled?(@company, "mercado_pago") &&
      settings&.mercadopago_enabled? &&
      settings.pix_provider == "mercadopago" &&
      settings.mercadopago_access_token.present?
  end

  def manual_pix_available?
    settings = store_settings
    FeatureGate.enabled?(@company, "pix") &&
      settings&.pix_enabled? &&
      (settings.pix_payload.present? || settings.pix_key.present?)
  end

  def store_settings
    @store_settings ||= @company.store_setting
  end

  def pix_unavailable_answer
    alternatives = []
    alternatives << "dinheiro" if @settings.offer_cash?
    alternatives << "cartao"
    answer(
      "Pix nao esta disponivel nesta loja no momento. Voce pode pagar com #{alternatives.join(' ou ')}.",
      "blocked",
      next_action: "select_payment"
    )
  end

  def existing_pix_status_answer
    order = latest_ai_pix_order
    text = if order.payment_status == "paid"
      "Pagamento aprovado. A loja ja recebeu seu pedido."
    elsif order.external_payment_id.present?
      "Seu Pix esta aguardando pagamento."
    else
      "O Pix manual do pedido ##{order.order_number} esta aguardando a confirmacao da loja."
    end
    answer(text, "success", next_action: order.payment_status == "paid" ? "completed" : "waiting_payment")
  end

  def completed_order_answer
    answer(
      "Pedido recebido! A loja vai acompanhar seu pedido por aqui.",
      "success",
      stage: "completed",
      next_action: "completed"
    )
  end

  def order_status_answer
    order = requested_order || latest_customer_order
    if order
      return answer(
        [
          "Encontrei o pedido ##{order.order_number}.",
          "Status: #{order_status_label(order.status)}.",
          "Pagamento: #{payment_label(order.payment_method)}#{payment_status_suffix(order)}.",
          "Total: #{format_brl(order.total_cents)}."
        ].compact.join("\n"),
        "success",
        next_action: order.completed? || order.cancelled? ? "completed" : "track_order",
        order: serialize_order(order)
      )
    end

    if cart.items.any?
      return answer(
        "Voce ainda tem um pedido em atendimento comigo.\n\n#{cart_progress_text}",
        "success",
        next_action: next_action_for_cart_stage
      )
    end

    answer(
      "Ainda nao encontrei pedido finalizado nesse numero. Se quiser fazer um pedido agora, me diga o produto que voce quer.",
      "blocked",
      next_action: "product_discovery"
    )
  end

  def latest_ai_pix_order
    @latest_ai_pix_order ||= @company.orders
      .where(customer_phone: [@phone, @phone.sub(/\A55/, "")])
      .where(payment_method: "pix", legacy_source: "whatsapp_ai")
      .where("created_at >= ?", 24.hours.ago)
      .order(created_at: :desc)
      .first
  end

  def requested_order
    number = @question.to_s[/#?\s*(\d+)/, 1]
    return nil if number.blank?

    orders_for_phone.where(order_number: number.to_i).order(created_at: :desc).first ||
      @company.orders.where(order_number: number.to_i).where("created_at >= ?", 24.hours.ago).order(created_at: :desc).first
  end

  def latest_customer_order
    orders_for_phone.where("created_at >= ?", 24.hours.ago).order(created_at: :desc).first
  end

  def orders_for_phone
    phones = [@phone, @phone.sub(/\A55/, "")].uniq
    @company.orders.where(customer_phone: phones).or(@company.orders.where(customer_whatsapp: phones))
  end

  def price_for(product)
    product.respond_to?(:promotional_price_cents) && product.promotional_price_cents.present? ? product.promotional_price_cents : product.price_cents
  end

  def payment_label(value)
    { "money" => "Dinheiro", "pix" => "Pix", "card_on_delivery" => "Cartao na entrega" }[value] || value
  end

  def format_brl(cents)
    ActionController::Base.helpers.number_to_currency(cents.to_i / 100.0, unit: "R$ ", separator: ",", delimiter: ".")
  end

  def normalized_question
    @normalized_question ||= ReplymeshKnowledgeService.normalize(@question)
  end

  def human_request?
    StoreAiIntentClassifier.call(@question) == :human_request ||
      normalized_question.match?(/reclamacao|problema|errado|cancelar|atendente/)
  end

  def greeting_without_cart?
    cart.items.empty? && ReplymeshKnowledgeService.greeting?(@question)
  end

  def photo_request?
    normalized_question.match?(/foto|imagem|ver produto/)
  end

  def product_number_selection?
    cart.stage == "product_selection" && @question.match?(/\A\s*\d+\s*\z/)
  end

  def waiting_for_address?
    cart.stage.in?(%w[address_collection address_confirmation delivery_calculation]) ||
      (cart.items.any? && cart.delivery_address.blank? && looks_like_address?)
  end

  def waiting_for_customer_name?
    cart.stage == "customer_identification"
  end

  def waiting_for_upsell?
    cart.stage == "upsell"
  end

  def payment_selection?
    cart.stage == "payment_selection"
  end

  def existing_pix_status_request?
    current_cart = conversation.store_ai_cart
    return false if current_cart && !current_cart.expired? && current_cart.items.any?
    return false unless normalized_question.match?(/pix|pagamento|paguei|pago/)

    latest_ai_pix_order.present?
  end

  def recently_completed_order?
    conversation.status == "closed" &&
      conversation.last_message_at.present? &&
      conversation.last_message_at >= 30.minutes.ago &&
      conversation.store_ai_cart&.stage == "completed"
  end

  def confirmation?
    cart.stage == "order_confirmation" &&
      (yes? || normalized_question.match?(/\A(confirmar|confirma|confirmo|fechar|finalizar|pode fazer|pode confirmar)\z/))
  end

  def collecting_payment_details?
    cart.stage == "payment_selection" && cart.metadata_json["payment_step"].present?
  end

  def yes?
    normalized_question.match?(/\A(s+i+m+|isso|isso mesmo|pode|pode sim|sim pode|ok|ok pode|confirmo|confirmar|confirmado|fechado)\z/)
  end

  def negative_answer?
    normalized_question.match?(/\A(nao|nao quero|nao precisa|sem|sem troco|nenhum)\z/)
  end

  def order_status_request?
    return false if cart.stage.in?(%w[address_confirmation upsell payment_selection order_confirmation]) && (yes? || negative_answer?)

    normalized_question.match?(/pedido|status|acompanha|andamento|aberto|consulta|numero|número|#\s*\d+|chega|tempo/)
  end

  def looks_like_address?
    normalized_question.match?(/\b(rua|av|avenida|travessa|estrada|rodovia|bairro|numero|número|nº|n°|casa|apto|apartamento|bloco|quadra|lote|condominio|condomínio|complemento|referencia|referência)\b/) ||
      (@question.to_s.include?(",") && @question.to_s.match?(/\d/))
  end

  def cart_progress_text
    case cart.stage
    when "address_confirmation"
      "Ja tenho no carrinho: #{cart_item_names}.\nPreciso confirmar o endereco salvo. Responda *sim* ou envie outro endereco completo."
    when "address_collection", "delivery_calculation"
      "Ja tenho no carrinho: #{cart_item_names}.\nAgora preciso do endereco de entrega com rua, numero e bairro."
    when "payment_selection"
      "Ja tenho no carrinho: #{cart_item_names}.\nAgora escolha a forma de pagamento: *Pix*, *dinheiro* ou *cartao*."
    when "order_confirmation"
      "Ja tenho no carrinho: #{cart_item_names}.\nConfira e responda *CONFIRMAR* para finalizar."
    else
      "Ja tenho no carrinho: #{cart_item_names}.\nPodemos continuar seu pedido por aqui."
    end
  end

  def cart_item_names
    Array(cart.items).map { |item| "#{item['quantity']}x #{item['name']}" }.join(", ")
  end

  def next_action_for_cart_stage
    {
      "address_confirmation" => "confirm_address",
      "address_collection" => "collect_address",
      "delivery_calculation" => "collect_address",
      "payment_selection" => "select_payment",
      "order_confirmation" => "confirm_order"
    }[cart.stage] || "continue_sale"
  end

  def order_status_label(status)
    {
      "pending" => "recebido",
      "accepted" => "aceito",
      "preparing" => "em preparo",
      "ready" => "pronto",
      "out_for_delivery" => "saiu para entrega",
      "completed" => "entregue/finalizado",
      "cancelled" => "cancelado"
    }[status] || status
  end

  def payment_status_suffix(order)
    return "" if order.payment_status.blank? || order.payment_status == "not_required"

    " (#{order.payment_status})"
  end

  def money_cents_from(text)
    raw = text.to_s.scan(/\d+(?:[.,]\d{1,2})?/).last
    return if raw.blank?

    (BigDecimal(raw.tr(",", ".")) * 100).round.to_i
  rescue ArgumentError
    nil
  end

  def greeting_answer
    "Oi! Sou o atendimento virtual da #{@company.store_setting&.company_name.presence || @company.name}. Me diga o que voce quer pedir hoje."
  end

  def public_product_link(product)
    "https://#{@company.primary_domain.presence || "#{@company.slug}.replymesh.cloud"}/menu?produto=#{product.slug}"
  end

  def log_event(event, product_id: nil, order_id: nil, total_cents: nil, payment_method: nil, errors: nil, exception: nil)
    Rails.logger.info(
      {
        event: "store_ai_sales_#{event}",
        stage: cart.stage,
        company_id: @company.id,
        phone_last4: @phone.last(4),
        product_id: product_id,
        order_id: order_id,
        total_cents: total_cents || cart.total_cents,
        payment_method: payment_method || cart.payment_method,
        errors: Array(errors).map { |item| safe_log_text(item) }.presence,
        exception_class: exception&.class&.name,
        exception_message: safe_log_text(exception&.message).presence
      }.compact.to_json
    )
  rescue StandardError
    nil
  end

  def safe_log_text(value)
    value.to_s
      .gsub(/[\w.+-]+@[\w.-]+/, "[email]")
      .gsub(/\b\d{8,}\b/, "[number]")
      .truncate(160)
  end

  def estimate_tokens(text)
    (text.to_s.length / 4.0).ceil
  end
end
