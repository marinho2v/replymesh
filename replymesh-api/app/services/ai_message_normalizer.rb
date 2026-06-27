class AiMessageNormalizer
  REPLACEMENTS = {
    "vc" => "voce",
    "vcs" => "voces",
    "ce" => "voce",
    "cê" => "voce",
    "tbm" => "tambem",
    "tb" => "tambem",
    "qro" => "quero",
    "qr" => "quero",
    "qria" => "queria",
    "queriaa" => "queria",
    "q" => "que",
    "pq" => "porque",
    "p" => "para",
    "pra" => "para",
    "pro" => "para o",
    "hj" => "hoje",
    "agr" => "agora",
    "blz" => "beleza",
    "vlw" => "valeu",
    "obg" => "obrigado",
    "pfv" => "por favor",
    "pff" => "por favor",
    "pixx" => "pix",
    "pics" => "pix",
    "px" => "pix",
    "cartao" => "cartao",
    "credito" => "credito",
    "debito" => "debito",
    "refri" => "bebida",
    "refrigerante" => "bebida",
    "coca" => "bebida coca",
    "coca-cola" => "bebida coca cola",
    "hamburguer" => "lanche hamburguer",
    "hambúrguer" => "lanche hamburguer",
    "hamburger" => "lanche hamburguer",
    "burguer" => "lanche hamburguer",
    "burger" => "lanche hamburguer",
    "xburger" => "x burger",
    "xbacon" => "x bacon",
    "x-tudo" => "x tudo",
    "xtudo" => "x tudo",
    "zap" => "whatsapp",
    "wpp" => "whatsapp",
    "promo" => "promocao"
  }.freeze

  PHRASE_REPLACEMENTS = {
    /\bta aberto\b/ => "horario aberto",
    /\besta aberto\b/ => "horario aberto",
    /\baberto hoje\b/ => "horario aberto hoje",
    /\baberto hj\b/ => "horario aberto hoje",
    /\bta funcionando\b/ => "horario aberto",
    /\bquanto fica\b/ => "quanto custa",
    /\bquanto e\b/ => "quanto custa",
    /\bme ve\b/ => "quero",
    /\bme vê\b/ => "quero",
    /\bmanda cardapio\b/ => "cardapio",
    /\bmanda o cardapio\b/ => "cardapio",
    /\bqual mais sai\b/ => "recomendacao mais vendido",
    /\bmais pedido\b/ => "recomendacao mais vendido",
    /\bmais vendido\b/ => "recomendacao mais vendido",
    /\bqual voce recomenda\b/ => "recomendacao",
    /\bqual vc recomenda\b/ => "recomendacao"
  }.freeze

  Result = Struct.new(:original, :normalized, :tokens, keyword_init: true)

  def self.call(message)
    new(message).call
  end

  def self.normalize(message)
    call(message).normalized
  end

  def initialize(message)
    @original = message.to_s
  end

  def call
    text = @original.dup
    text = ActiveSupport::Inflector.transliterate(text)
    text = text.downcase
    text = text.gsub(/[^\p{Alnum}\s#.,-]/, " ")
    text = text.gsub(/[,.!?;:]+/, " ")
    text = text.squish

    PHRASE_REPLACEMENTS.each { |pattern, replacement| text = text.gsub(pattern, replacement) }

    tokens = text.split.map { |token| REPLACEMENTS.fetch(token, token) }
    normalized = tokens.join(" ").squish

    Result.new(original: @original, normalized: normalized, tokens: normalized.split)
  end
end
