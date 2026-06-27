class AiIntentRouter
  Intent = Struct.new(:intent, :confidence, :scores, :normalized, keyword_init: true)

  INTENT_PATTERNS = {
    greeting: [
      /\A(oi|ola|bom dia|boa tarde|boa noite|eai|opa|fala|salve)\b/
    ],
    menu_request: [
      /cardapio|menu|opcoes|opcao|produtos|lanches|bebidas|sobremesa|sobremesas|porcao|porcoes|entradas/,
      /tem o que|o que tem|quais.*tem|quais.*vende|me mostra|lista.*produto/
    ],
    recommendation_request: [
      /recomendacao|recomenda|mais vendido|mais pedido|melhor|destaque|sugere|sugestao/
    ],
    product_search: [
      /\btem\b/, /\bquero\b/, /\bqueria\b/, /\bpedir\b/, /\bcomprar\b/,
      /preco|quanto custa|bacon|costela|cheddar|frango|batata|bebida|coca|pizza|acai|lanche|hamburguer/
    ],
    product_selection: [
      /\A\d+\z/, /\bquero o \d+\b/, /\bvou querer o \d+\b/, /\bpode ser esse\b/, /\besse mesmo\b/
    ],
    photo_request: [
      /foto|imagem|ver produto|manda foto|tem foto/
    ],
    payment_question: [
      /aceita.*pix|aceita.*cartao|pagamento|forma de pagamento|passa credito|passa debito|dinheiro|troco/
    ],
    payment_selection: [
      /\A(pix|dinheiro|cartao|credito|debito)\z/, /vou pagar.*pix|vou pagar.*dinheiro|vou pagar.*cartao/
    ],
    opening_hours_question: [
      /horario|funcionamento|aberto|abre|fecha|fechado|fechou|que horas|horario aberto/
    ],
    delivery_area_question: [
      /entrega.*bairro|entrega.*regiao|entrega.*para|entrega.*no|entrega.*em|delivery.*bairro|atende.*bairro/
    ],
    delivery_fee_question: [
      /taxa|frete|entrega|retirada|tempo de entrega|demora quanto|quanto demora|quanto custa.*entrega|quanto custa.*frete/
    ],
    address_message: [
      /\brua\b|\bavenida\b|\bav\b|\bestrada\b|\bbairro\b|\bnumero\b|\bnº\b|\bcasa\b|\bapto\b/
    ],
    address_confirmation: [
      /\A(sim|isso|isso mesmo|pode|pode sim|correto|ta certo)\z/
    ],
    order_summary_request: [
      /resumo|meu carrinho|carrinho|quanto deu|total/
    ],
    order_confirmation: [
      /\A(confirmar|confirma|confirmo|fechar|finalizar|fechado|pode confirmar)\z/
    ],
    order_status_request: [
      /status do pedido|meu pedido|cade meu pedido|andamento|pedido saiu|ta onde|ta demorando|demorou|chega que horas|pedido numero|#\s*\d+/
    ],
    coupon_question: [
      /cupom|desconto|codigo promocional/
    ],
    promotion_question: [
      /promocao|oferta|combo|preco especial/
    ],
    complaint: [
      /demorou|veio errado|faltou|reclamar|problema|ruim|cancelar|cancelamento/
    ],
    human_handoff: [
      /humano|atendente|pessoa|falar com alguem|falar com atendente|me atende|chamar atendente/
    ]
  }.freeze

  PRIORITY = %i[
    complaint human_handoff order_confirmation product_selection address_confirmation
    opening_hours_question coupon_question promotion_question payment_selection payment_question
    order_status_request delivery_area_question delivery_fee_question
    menu_request recommendation_request photo_request order_summary_request address_message
    product_search greeting
  ].freeze

  def self.call(message)
    new(message).call
  end

  def initialize(message)
    @original = message.to_s
    @profile = AiMessageNormalizer.call(message)
    @text = @profile.normalized
  end

  def call
    scores = INTENT_PATTERNS.transform_values do |patterns|
      patterns.sum { |pattern| @text.match?(pattern) ? 1 : 0 }
    end
    intent = if @original.include?("?") && scores[:payment_question].to_i.positive?
      :payment_question
    else
      PRIORITY.find { |key| scores[key].to_i.positive? } || :unknown
    end
    confidence = confidence_for(intent, scores[intent].to_i)

    Intent.new(intent: intent, confidence: confidence, scores: scores, normalized: @text)
  end

  private

  def confidence_for(intent, score)
    return 0.0 if intent == :unknown || score.zero?
    return 0.95 if %i[complaint human_handoff order_confirmation payment_selection opening_hours_question].include?(intent)
    return 0.9 if score >= 2

    0.75
  end
end
