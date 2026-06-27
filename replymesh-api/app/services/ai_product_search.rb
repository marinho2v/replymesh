class AiProductSearch
  Result = Struct.new(:products, :scores, :terms, keyword_init: true)

  RELATED_TERMS = {
    "bebida" => %w[bebida coca cola refrigerante refri suco agua],
    "coca" => %w[coca cola bebida refrigerante],
    "batata" => %w[batata frita acompanhamento porcao],
    "lanche" => %w[lanche hamburguer burger sanduiche x],
    "hamburguer" => %w[hamburguer burger lanche sanduiche],
    "pizza" => %w[pizza pizzaria mussarela calabresa],
    "acai" => %w[acai tigela copo],
    "costela" => %w[costela artesanal],
    "bacon" => %w[bacon],
    "cheddar" => %w[cheddar queijo],
    "frango" => %w[frango chicken],
    "doce" => %w[doce sobremesa chocolate],
    "combo" => %w[combo promocao]
  }.freeze

  QUERY_STOP_WORDS = (
    ReplymeshKnowledgeService::STOP_WORDS +
    %w[tem vende vender voces voce vc quais qual quero queria pedir comprar compra produto produtos cardapio menu opcao opcoes me mostra manda lista hoje ai ae mano por favor pfv]
  ).uniq.freeze

  def self.call(company:, query:, limit: 5, recommendation: false)
    new(company: company, query: query, limit: limit, recommendation: recommendation).call
  end

  def initialize(company:, query:, limit: 5, recommendation: false)
    @company = company
    @profile = AiMessageNormalizer.call(query)
    @query = @profile.normalized
    @limit = limit
    @recommendation = recommendation
  end

  def call
    products = @company.products.active.includes(:category).ordered.limit(150).to_a
    return Result.new(products: recommended(products), scores: {}, terms: terms) if @recommendation || broad_query?

    scored = products.map { |product| [product, score_for(product)] }.select { |_product, score| score.positive? }
    sorted = scored.sort_by { |product, score| [-score, product.sort_order.to_i, product.name.to_s] }

    Result.new(
      products: sorted.first(@limit).map(&:first),
      scores: sorted.to_h { |product, score| [product.id, score] },
      terms: terms
    )
  end

  private

  def terms
    @terms ||= begin
      raw = @profile.tokens - QUERY_STOP_WORDS
      expanded = raw + raw.flat_map { |term| RELATED_TERMS.fetch(term, []) }
      expanded.map(&:squish).reject(&:blank?).uniq
    end
  end

  def broad_query?
    @query.match?(/cardapio|menu|opcoes|produtos|lanches|bebidas|sobremesas|porcoes|tem o que|o que tem|quais.*tem|quais.*vende|mais vendido|recomendacao/)
  end

  def score_for(product)
    haystack = searchable_text(product)
    compact_haystack = haystack.delete(" ")
    product_name = AiMessageNormalizer.normalize(product.name)
    compact_name = product_name.delete(" ")

    score = terms.sum do |term|
      compact_term = term.delete(" ")
      if product_name == term || compact_name == compact_term
        25
      elsif product_name.include?(term)
        14
      elsif haystack.include?(term)
        8
      elsif compact_term.length >= 4 && compact_haystack.include?(compact_term)
        7
      elsif fuzzy_match?(term, haystack.split)
        4
      else
        0
      end
    end

    score += 3 if product.is_featured?
    score += 2 if product.respond_to?(:is_promotional?) && product.is_promotional?
    score
  end

  def searchable_text(product)
    AiMessageNormalizer.normalize(
      [
        product.name,
        product.description,
        product.category&.name,
        product.slug
      ].compact.join(" ")
    )
  end

  def fuzzy_match?(term, words)
    return false if term.length < 4

    words.any? do |word|
      next false if word.length < 4

      levenshtein(term, word) <= (term.length <= 5 ? 1 : 2)
    end
  end

  def levenshtein(left, right)
    rows = Array.new(left.length + 1) { |i| [i] + [0] * right.length }
    (0..right.length).each { |j| rows[0][j] = j }

    (1..left.length).each do |i|
      (1..right.length).each do |j|
        cost = left[i - 1] == right[j - 1] ? 0 : 1
        rows[i][j] = [
          rows[i - 1][j] + 1,
          rows[i][j - 1] + 1,
          rows[i - 1][j - 1] + cost
        ].min
      end
    end

    rows[left.length][right.length]
  end

  def recommended(products)
    sales = OrderItem
      .joins(:order)
      .where(orders: { company_id: @company.id })
      .where.not(orders: { status: "cancelled" })
      .where(product_id: products.map(&:id))
      .group(:product_id)
      .sum(:quantity)

    products.sort_by do |product|
      [
        -sales.fetch(product.id, 0),
        product.is_featured? ? 0 : 1,
        product.respond_to?(:is_promotional?) && product.is_promotional? ? 0 : 1,
        -product.created_at.to_i,
        product.sort_order.to_i
      ]
    end.first(@limit)
  end
end
