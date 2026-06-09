class StoreAiIntentClassifier
  INTENTS = {
    order_status: /meu pedido|cade meu pedido|status do pedido|pedido saiu|andamento do pedido/,
    products: /tem |vende|produto|cardapio|menu|ingrediente|adicional|preco|quanto custa|lanche|hamburguer|pizza|bebida/,
    delivery: /entrega|entregam|taxa|frete|bairro|regiao|centro|demora|prazo/,
    pickup: /retir|buscar no local|pegar no local/,
    payments: /pagamento|pix|dinheiro|cartao|credito|debito|troco|aceita/,
    hours: /horario|funcionamento|abre|aberto|fecha|fechado/,
    promotions: /promocao|oferta|cupom|desconto/,
    ordering: /quero pedir|fazer um pedido|como pedir|link.*pedido|comprar/
  }.freeze

  TRIVIAL = /\A(?:ok+|blz|beleza|obg|obrigad[oa]|valeu|show|👍|🙏|❤️|❤|😊|🙂)[!.\s]*\z/i

  def self.call(message)
    normalized = ReplymeshKnowledgeService.normalize(message)
    return :trivial if message.to_s.strip.match?(TRIVIAL) || normalized.blank?

    INTENTS.each { |intent, pattern| return intent if normalized.match?(pattern) }
    nil
  end
end
