class StoreAiIntentClassifier
  INTENTS = {
    human_request: /humano|atendente|pessoa|falar com alguem|falar com atendente|me atende|chamar atendente/,
    order_status: /meu pedido|cade meu pedido|status do pedido|pedido saiu|andamento do pedido|meu telefone|telefone e|telefone é/,
    promotions: /promocao|oferta|cupom|desconto/,
    ordering: /quero pedir|quero fazer pedido|fazer pedido|fazer um pedido|como pedir|link.*pedido|comprar|montar pedido/,
    delivery: /entrega|entregam|taxa|frete|bairro|regiao|centro|marica|maricá|demora|prazo/,
    pickup: /retir|buscar no local|pegar no local/,
    payments: /pagamento|pix|dinheiro|cartao|credito|debito|troco|aceita/,
    hours: /horario|funcionamento|abre|aberto|fecha|fechado|que horas/,
    products: /tem |vende|produto|cardapio|menu|ingrediente|adicional|preco|quanto custa|lanche|hamburguer|hamburger|burger|pizza|bebida|bacon|cheddar|picanha|triplo|duplo|medio|médio/
  }.freeze

  TRIVIAL = /\A(?:ok+|blz|beleza|obg|obrigad[oa]|valeu|show|👍|🙏|❤️|❤|😊|🙂)[!.\s]*\z/i

  def self.call(message)
    normalized = ReplymeshKnowledgeService.normalize(message)
    return :trivial if message.to_s.strip.match?(TRIVIAL) || normalized.blank?

    INTENTS.each { |intent, pattern| return intent if normalized.match?(pattern) }
    nil
  end
end
