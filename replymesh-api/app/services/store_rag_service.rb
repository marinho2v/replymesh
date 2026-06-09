class StoreRagService
  DEFAULT_TOP_K = 4

  def self.search(company:, query:, permissions:, phone: nil, top_k: DEFAULT_TOP_K)
    new(company: company, query: query, permissions: permissions, phone: phone, top_k: top_k).search
  end

  def initialize(company:, query:, permissions:, phone: nil, top_k: DEFAULT_TOP_K)
    @company = company
    @query = normalize(query)
    @permissions = permissions
    @phone = extracted_query_phone.presence || phone.to_s.gsub(/\D/, "")
    @top_k = [[top_k.to_i, 1].max, 6].min
  end

  def search
    chunks = StoreKnowledgeService.new(@company).chunks
    chunks << order_chunk if order_query? && @permissions[:allow_order_status] && @phone.present?

    chunks
      .select { |chunk| allowed?(chunk.module_name) }
      .map { |chunk| sanitize_chunk(chunk) }
      .map { |chunk| chunk.merge(score: score_hash(chunk)) }
      .select { |chunk| chunk[:score].positive? }
      .sort_by { |chunk| -chunk[:score] }
      .first(@top_k)
  end

  private

  def allowed?(module_name)
    return @permissions[:allow_products] if %w[produtos categorias].include?(module_name)
    return @permissions[:allow_hours] if module_name == "horarios"
    return @permissions[:allow_delivery] if module_name == "entrega"
    return @permissions[:allow_payments] if module_name == "pagamentos"
    return @permissions[:allow_promotions] if module_name == "promocoes"
    return @permissions[:allow_orders] || @permissions[:allow_order_status] if module_name == "pedidos"

    true
  end

  def order_query?
    @query.match?(/pedido|status|andamento|telefone/)
  end

  def order_chunk
    local_phone = @phone.sub(/\A55/, "")
    order = @company.orders
      .where(
        <<~SQL.squish,
          regexp_replace(coalesce(customer_whatsapp, customer_phone, ''), '\\D', '', 'g') IN (?, ?)
          OR ? LIKE '%' || regexp_replace(coalesce(customer_whatsapp, customer_phone, ''), '\\D', '', 'g')
        SQL
        @phone,
        local_phone,
        @phone
      )
      .order(created_at: :desc)
      .first
    content = order ? {
      numero: order.order_number,
      status: order.status,
      delivery_status: order.delivery_status,
      location_received: order.delivery_location_received_at.present?,
      total_centavos: order.total_cents,
      criado_em: order.created_at
    }.to_json : "Nenhum pedido encontrado para o telefone informado."

    StoreKnowledgeService::Chunk.new(
      id: "latest-order",
      module_name: "pedidos",
      title: "Ultimo pedido do cliente",
      keywords: %w[pedido status andamento entrega ultimo telefone],
      content: content
    )
  end

  def score(chunk)
    haystack = normalize([chunk.module_name, chunk.title, Array(chunk.keywords).join(" "), chunk.content].join(" "))
    lexical = query_terms.sum { |term| haystack.include?(term) ? (normalize(chunk.title).include?(term) ? 6 : 2) : 0 }
    lexical + intent_boost(chunk.module_name, chunk.id)
  end

  def score_hash(chunk)
    haystack = normalize([chunk[:module], chunk[:title], chunk[:content]].join(" "))
    lexical = query_terms.sum { |term| haystack.include?(term) ? (normalize(chunk[:title]).include?(term) ? 6 : 2) : 0 }
    lexical + intent_boost(chunk[:module], chunk[:id])
  end

  def intent_boost(module_name, chunk_id)
    return 30 if @query.match?(/cupom|desconto|promocao|oferta/) && module_name == "promocoes"
    return 30 if @query.match?(/horario|abre|fecha|funcionamento/) && module_name == "horarios"
    return 35 if @query.match?(/pedido|status|andamento|telefone/) && chunk_id == "latest-order"
    return 25 if @query.match?(/produto|cardapio|lanche|hamburguer|hamburger|burger|barato|preco|tem|vende|bacon|cheddar|picanha|triplo|duplo|medio/) && module_name == "produtos"
    return 30 if @query.match?(/pix|pagamento|dinheiro|cartao|credito|debito|aceita/) && module_name == "pagamentos"
    return 30 if @query.match?(/entrega|taxa|frete|retir|demora|tempo/) && module_name == "entrega"
    return 35 if @query.match?(/quero pedir|quero fazer pedido|fazer pedido|fazer um pedido|como pedir|comprar/) && module_name == "pedido"

    0
  end

  def query_terms
    @query.split.select { |term| term.length > 2 }.uniq
  end

  def serialize(chunk)
    { id: chunk.id, module: chunk.module_name, title: chunk.title, content: chunk.content }
  end

  def sanitize_chunk(chunk)
    serialized = serialize(chunk)
    return serialized unless chunk.module_name == "produtos"

    products = JSON.parse(chunk.content)
    meaningful = query_terms - %w[qual quais mais barato barata menor preco tem vende produto produtos cardapio lanche hamburguer]
    matches = products.select do |product|
      name = normalize(product["nome"])
      meaningful.empty? || meaningful.any? { |term| name.include?(term) }
    end
    selected = meaningful.empty? ? similar_products(products) : (matches.presence || similar_products(products))
    if @query.match?(/mais barato|mais barata|menor preco/)
      selected = selected.sort_by { |product| product["promocional_centavos"].presence || product["preco_centavos"].to_i }
    end
    serialized.merge(content: selected.first(6).to_json)
  rescue JSON::ParserError
    serialized
  end

  def similar_products(products)
    products.reject do |product|
      normalize(product["nome"]).match?(/\baud\d|\bhomo\d|produto aud|produto homo|produto manual|checkout produto|produto editado/)
    end
  end

  def normalize(value)
    ReplymeshKnowledgeService.normalize(value)
  end

  def extracted_query_phone
    digits = @query.to_s.gsub(/\D/, "")
    return if digits.length < 8

    digits
  end
end
