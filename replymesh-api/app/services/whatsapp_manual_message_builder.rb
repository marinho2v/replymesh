require "cgi"

class WhatsappManualMessageBuilder
  Result = Struct.new(:available, :phone, :message, :url, :template_key, :error, keyword_init: true) do
    def available? = available

    def as_json(*)
      {
        available: available?,
        phone: phone,
        message: message,
        url: url,
        template_key: template_key,
        error: error
      }.compact
    end
  end

  def self.call(order:, status:, template: nil)
    new(order:, status:, template:).call
  end

  def initialize(order:, status:, template: nil)
    @order = order
    @status = status.to_s
    @template = template
  end

  def call
    template_key = WhatsappTemplate.template_key_for_status(@status)
    return unavailable("Status sem template configurado", template_key) unless template_key

    template = @template || WhatsappTemplate.find_by(company_id: @order.company_id, template_key:)
    return unavailable("Template nao encontrado", template_key) unless template
    return unavailable("Template desativado", template_key) unless template.enabled?

    phone = normalize_phone(@order.customer_whatsapp.presence || @order.customer_phone)
    return unavailable("Cliente sem telefone valido", template_key) if phone.blank?

    message = sanitize_message(WhatsappMessageRenderer.render(template: template.message, order: @order))
    return unavailable("Template gerou uma mensagem vazia", template_key) if message.blank?

    Result.new(
      available: true,
      phone: phone,
      message: message,
      url: "https://wa.me/#{phone}?text=#{CGI.escape(message).gsub('+', '%20')}",
      template_key: template_key
    )
  end

  private

  def unavailable(error, template_key)
    Result.new(available: false, template_key:, error:)
  end

  def normalize_phone(value)
    digits = value.to_s.gsub(/\D/, "")
    return "" if digits.length < 10
    return digits if digits.start_with?("55") && digits.length >= 12

    "55#{digits}"
  end

  def sanitize_message(value)
    message = value.to_s.encode("UTF-8", invalid: :replace, undef: :replace, replace: "")
    message = repair_legacy_mojibake(message)

    message.gsub("\uFFFD", "")
           .gsub(/[^\P{C}\n\t]/, "")
           .gsub(/\r\n?/, "\n")
           .gsub(/[ \t]+\n/, "\n")
           .gsub(/\n{3,}/, "\n\n")
           .strip
  end

  def repair_legacy_mojibake(message)
    return message unless legacy_mojibake?(message)

    bytes = message.each_char.flat_map do |char|
      codepoint = char.ord
      next [codepoint] if codepoint <= 255

      char.encode("Windows-1252").bytes
    rescue EncodingError
      char.bytes
    end

    repaired = bytes.pack("C*").force_encoding("UTF-8")
    return message unless repaired.valid_encoding?

    repaired.encode("UTF-8", invalid: :replace, undef: :replace, replace: "")
  rescue EncodingError
    message
  end

  def legacy_mojibake?(message)
    message.match?(/[ÃÂâð]/)
  end
end
