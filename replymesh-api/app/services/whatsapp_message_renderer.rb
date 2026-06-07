class WhatsappMessageRenderer
  STATUS_LABELS = {
    "pending" => "Pedido recebido",
    "accepted" => "Aceito",
    "preparing" => "Em preparo",
    "ready" => "Pronto",
    "out_for_delivery" => "Saiu para entrega",
    "completed" => "Finalizado",
    "cancelled" => "Cancelado"
  }.freeze

  PAYMENT_LABELS = {
    "money" => "Dinheiro",
    "pix" => "Pix",
    "card_on_delivery" => "Cartao na entrega"
  }.freeze

  def self.render(template:, order:)
    new(template: template, order: order).render
  end

  def initialize(template:, order:)
    @template = template.to_s
    @order = order
  end

  def render
    @template.gsub(/\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/) do |match|
      context.fetch(Regexp.last_match(1), match).to_s
    end.strip
  end

  private

  def context
    @context ||= {
      "nome_cliente" => @order.customer_name.presence || "Cliente",
      "cliente" => @order.customer_name.presence || "Cliente",
      "telefone_cliente" => @order.customer_whatsapp.presence || @order.customer_phone,
      "status_pedido" => STATUS_LABELS[@order.status] || @order.status,
      "status" => STATUS_LABELS[@order.status] || @order.status,
      "valor_total" => money(@order.total_cents),
      "total" => money(@order.total_cents),
      "subtotal" => money(@order.subtotal_cents),
      "taxa_entrega" => money(@order.delivery_fee_cents),
      "desconto" => money(@order.discount_cents),
      "forma_pagamento" => PAYMENT_LABELS[@order.payment_method] || @order.payment_method,
      "pagamento" => PAYMENT_LABELS[@order.payment_method] || @order.payment_method,
      "endereco" => address,
      "referencia" => @order.reference,
      "observacoes" => @order.notes,
      "nome_loja" => store_name,
      "telefone_loja" => @order.company.store_setting&.whatsapp.presence || @order.company.store_setting&.whatsapp_number
    }
  end

  def store_name
    setting = @order.company.store_setting
    setting&.store_name.presence || setting&.company_name.presence || @order.company.name
  end

  def address
    return "Retirada no local" unless @order.delivery?

    [
      [@order.street, @order.number].compact_blank.join(", "),
      @order.complement,
      @order.neighborhood,
      [@order.city, @order.state].compact_blank.join(" - "),
      @order.zip_code
    ].compact_blank.join(", ")
  end

  def money(cents)
    format("%.2f", cents.to_i / 100.0).tr(".", ",")
  end
end
