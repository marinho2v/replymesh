class StoreAiSalesService
  STAGE_LABELS = {
    "greeting" => "Saudacao",
    "product_discovery" => "Descoberta de produto",
    "product_selection" => "Selecao de produto",
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
    return answer(greeting_answer, "success", next_action: "product_discovery") if greeting_without_cart?
    return handle_photo_request if photo_request?
    return handle_confirmation if confirmation?
    return handle_payment_selection if payment_selection?
    return handle_address if waiting_for_address?
    return handle_product_number if product_number_selection?
    return handle_product_search
  rescue StandardError => e
    Rails.logger.warn("Store AI sales flow failed: #{e.class}")
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
      current = nil if current&.expired?
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
      return ask_address
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
    ask_address
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
    cart.update!(items: Array(cart.items) + [item], stage: "address_collection")
    cart.refresh_totals!
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

    answer(
      "Separei #{cart.items.last['name']} no carrinho.\n\nAgora me envie o endereco de entrega com rua, numero e bairro.",
      "success",
      next_action: "collect_address"
    )
  end

  def handle_address
    if yes? && cart.delivery_address.present?
      calculate_delivery
      return ask_payment
    end

    parsed = parse_address(@question)
    cart.update!(delivery_address: parsed, stage: "delivery_calculation")
    calculate_delivery
    ask_payment
  end

  def ask_payment
    methods = []
    methods << "Dinheiro" if @settings.offer_cash?
    methods << "Pix" if @settings.offer_pix?
    methods << "Cartao na entrega"
    cart.update!(stage: "payment_selection")
    answer(
      "Pedido ate aqui:\n#{cart_summary}\n\nForma de pagamento: #{methods.uniq.join(', ')}?",
      "success",
      next_action: "select_payment"
    )
  end

  def handle_payment_selection
    method = if normalized_question.match?(/pix/)
      "pix"
    elsif normalized_question.match?(/dinheiro|troco/)
      "money"
    else
      "card_on_delivery"
    end
    cart.update!(payment_method: method, stage: "order_confirmation")
    answer(
      "Perfeito. Confirma o pedido?\n\n#{cart_summary}\n\nPagamento: #{payment_label(method)}\n\nResponda *confirmar* para finalizar ou *atendente* para falar com a equipe.",
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
    return answer("Nao consegui criar o pedido: #{checkout.errors.join(', ')}", "fallback", next_action: "human_handoff", fallback: true) unless checkout.success?

    order = checkout.order
    order.update!(legacy_source: "whatsapp_ai") if order.respond_to?(:legacy_source=)
    pix_text = maybe_generate_pix(order)
    cart.complete!
    conversation.update!(status: "closed", last_message_at: Time.current) if @settings.pause_after_order_confirmation?
    answer(
      ["Pedido ##{order.order_number} criado com sucesso.", pix_text, "A equipe da loja ja recebeu o pedido."].compact_blank.join("\n\n"),
      "success",
      stage: cart.stage,
      next_action: pix_text.present? ? "waiting_payment" : "completed",
      order: serialize_order(order)
    )
  end

  def maybe_generate_pix(order)
    return nil unless order.payment_method == "pix"

    settings = @company.store_setting
    unless settings&.mercadopago_enabled? && settings.mercadopago_access_token.present? && @settings.auto_generate_mercadopago_pix?
      return "Pix selecionado. A loja vai enviar as instrucoes de pagamento."
    end

    result = MercadoPagoPixService.new(settings.mercadopago_access_token).create_pix_payment(order: order)
    return "Nao consegui gerar o Pix agora. A loja vai continuar o atendimento." unless result.success?

    order.update!(
      external_payment_id: result.payment_id,
      payment_status: "pending_payment",
      pix_copy_paste: result.qr_code,
      pix_qr_code_base64: result.qr_code_base64,
      pix_ticket_url: result.ticket_url
    )
    cart.update!(stage: "waiting_payment")
    ["Valor: #{format_brl(order.total_cents)}", result.qr_code.present? ? "Pix copia e cola:\n#{result.qr_code}" : nil, result.ticket_url.present? ? "Link: #{result.ticket_url}" : nil].compact.join("\n\n")
  rescue StandardError => e
    Rails.logger.warn("Store AI Mercado Pago pix failed: #{e.class}")
    "Nao consegui gerar o Pix agora. A loja vai continuar o atendimento."
  end

  def handle_photo_request
    product = relevant_products.first
    return answer("Me diga de qual produto voce quer a foto.", "blocked", next_action: "ask_product_photo") unless product

    url = product.image_url.presence if product.respond_to?(:image_url)
    link = "https://#{@company.slug}.replymesh.cloud/menu?produto=#{product.slug}"
    text = if url.present?
      "Foto do #{product.name}: #{url}\n\nSe preferir, veja no cardapio: #{link}"
    else
      "Nao encontrei foto cadastrada para #{product.name}. Veja os detalhes no cardapio: #{link}"
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
      terms = normalized_question.split - ReplymeshKnowledgeService::STOP_WORDS
      scope = @company.products.active.includes(:category).ordered.limit(80)
      ranked = scope.map do |product|
        haystack = ReplymeshKnowledgeService.normalize([product.name, product.description, product.category&.name].join(" "))
        score = terms.sum { |term| haystack.include?(term) ? (haystack.start_with?(term) ? 8 : 3) : 0 }
        score += 2 if normalized_question.match?(/hamburg|burger|lanche/) && haystack.match?(/hamburg|burger|lanche/)
        [product, score]
      end
      ranked.select { |_product, score| score.positive? }.sort_by { |_product, score| -score }.map(&:first).first(5)
    end
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
    {
      order_type: "delivery",
      payment_method: cart.payment_method.presence || "money",
      customer: {
        full_name: customer_by_phone&.full_name.presence || "Cliente WhatsApp",
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
        link: "https://#{@company.slug}.replymesh.cloud/menu?produto=#{product.slug}"
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
      (cart.items.any? && cart.delivery_address.blank?)
  end

  def payment_selection?
    cart.stage == "payment_selection" && normalized_question.match?(/pix|dinheiro|cartao|credito|debito/)
  end

  def confirmation?
    cart.stage == "order_confirmation" && normalized_question.match?(/confirm|fechar|finalizar|pode fazer|sim/)
  end

  def yes?
    normalized_question.match?(/\A(sim|isso|pode|ok|confirmo|confirmar)\z/)
  end

  def greeting_answer
    "Oi! Sou o atendimento virtual da #{@company.store_setting&.company_name.presence || @company.name}. Me diga o que voce quer pedir hoje."
  end

  def estimate_tokens(text)
    (text.to_s.length / 4.0).ceil
  end
end
