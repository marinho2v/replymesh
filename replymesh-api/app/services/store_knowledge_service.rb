class StoreKnowledgeService
  Chunk = Struct.new(:id, :module_name, :title, :content, :keywords, keyword_init: true)

  def initialize(company)
    @company = company
  end

  def chunks
    [
      store_chunk,
      hours_chunk,
      products_chunk,
      categories_chunk,
      promotions_chunk,
      payments_chunk,
      delivery_chunk,
      orders_chunk
    ].flatten.compact
  end

  private

  def store_chunk
    store = @company.store_setting
    Chunk.new(
      id: "store-info",
      module_name: "loja",
      title: "Informacoes da loja",
      keywords: %w[loja nome aberto fechada endereco telefone pagamento entrega],
      content: {
        nome: store&.company_name.presence || @company.name,
        status: store&.store_status,
        endereco: [store&.address, store&.city, store&.state].compact_blank.join(", "),
        whatsapp: store&.whatsapp,
        pagamentos: store&.accepted_payment_methods,
        taxa_entrega_centavos: store&.delivery_fee_cents
      }.to_json
    )
  end

  def hours_chunk
    rows = @company.business_hours.order(:day_of_week).map do |hour|
      {
        dia: hour.day_of_week,
        aberto: hour.is_open,
        abre: hour.open_time,
        fecha: hour.close_time,
        pausa_inicio: hour.break_start,
        pausa_fim: hour.break_end
      }
    end
    Chunk.new(id: "hours", module_name: "horarios", title: "Horarios da loja",
              keywords: %w[horario horarios abre aberto fecha fechada funcionamento], content: rows.to_json)
  end

  def products_chunk
    rows = @company.products.active.includes(:category).ordered.limit(120).map do |product|
      {
        nome: product.name,
        categoria: product.category&.name,
        descricao: product.description,
        preco_centavos: product.price_cents,
        promocional_centavos: product.respond_to?(:promotional_price_cents) ? product.promotional_price_cents : nil,
        disponivel: product.is_active
      }
    end
    Chunk.new(id: "products", module_name: "produtos", title: "Produtos ativos",
              keywords: %w[produto produtos cardapio lanche comida preco disponibilidade tem vende], content: rows.to_json)
  end

  def categories_chunk
    rows = @company.categories.where(is_active: true).order(:sort_order, :name).pluck(:id, :name)
    Chunk.new(id: "categories", module_name: "categorias", title: "Categorias ativas",
              keywords: %w[categoria categorias cardapio secao secoes], content: rows.to_json)
  end

  def promotions_chunk
    rows = @company.coupons.valid_now.limit(50).map do |coupon|
      {
        codigo: coupon.code,
        titulo: coupon.title,
        tipo: coupon.discount_type,
        valor: coupon.discount_value,
        minimo_centavos: coupon.minimum_order_cents,
        expira_em: coupon.expires_at
      }
    end
    Chunk.new(id: "promotions", module_name: "promocoes", title: "Cupons e promocoes ativos",
              keywords: %w[cupom cupons promocao promocoes desconto oferta], content: rows.to_json)
  end

  def orders_chunk
    Chunk.new(id: "orders-policy", module_name: "pedidos", title: "Consulta de pedidos",
              keywords: %w[pedido pedidos status andamento telefone ultimo entrega],
              content: "Pedidos somente podem ser consultados pelo telefone do cliente. Nunca exponha pedido de outro telefone.")
  end

  def payments_chunk
    store = @company.store_setting
    Chunk.new(
      id: "payments",
      module_name: "pagamentos",
      title: "Formas de pagamento",
      keywords: %w[pagamento pagamentos pix dinheiro cartao credito debito aceita],
      content: {
        formas: Array(store&.accepted_payment_methods),
        pix_ativo: store&.pix_enabled,
        mercado_pago_ativo: store&.respond_to?(:mercadopago_enabled) && store.mercadopago_enabled
      }.to_json
    )
  end

  def delivery_chunk
    store = @company.store_setting
    Chunk.new(
      id: "delivery",
      module_name: "entrega",
      title: "Informacoes de entrega",
      keywords: %w[entrega taxa frete bairro regiao retirada tempo demora],
      content: {
        entrega_ativa: store&.delivery_enabled,
        retirada_ativa: store&.pickup_enabled,
        taxa_padrao_centavos: store&.delivery_fee_cents,
        tempo_estimado_minutos: store&.estimated_delivery_minutes
      }.to_json
    )
  end
end
