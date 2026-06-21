class WhatsappStatusDispatcher
  Result = Struct.new(:success, :sent, :error, :log, :manual_preview, keyword_init: true) do
    def success? = success
  end

  def self.call(order:, status:, user: nil, test_mode: false)
    new(order: order, status: status, user: user, test_mode: test_mode).call
  end

  def initialize(order:, status:, user: nil, test_mode: false)
    @order = order
    @status = status.to_s
    @user = user
    @test_mode = test_mode
  end

  def call
    template_key = WhatsappTemplate.template_key_for_status(@status)
    return log_skip("status sem template", template_key) unless template_key

    template = WhatsappTemplate.find_by(company_id: @order.company_id, template_key: template_key)
    return log_skip("template nao encontrado", template_key) unless template
    return log_skip("template desativado", template_key, template: template) unless template.enabled?
    return log_skip("WhatsApp desativado para a empresa", template_key, template: template) if whatsapp_disabled?
    return log_skip("pedido nao identificado como teste seguro", template_key, template: template) if @test_mode && !manual_mode? && !test_order?
    return prepare_manual_message(template_key, template) if manual_mode?
    return log_skip("notificacao ja enviada", template_key, template: template) if notification_already_sent?(template_key)

    instance = WhatsappInstance.primary_for_company(@order.company)
    return log_skip("empresa sem instancia WhatsApp", template_key, template: template) unless instance
    return log_skip("instancia sem token local", template_key, template: template, instance: instance) if instance.instance_token.blank?
    return log_skip("instancia nao conectada", template_key, template: template, instance: instance) unless instance.status == "connected"

    phone = normalize_phone(@order.customer_whatsapp.presence || @order.customer_phone)
    return log_skip("pedido sem telefone de destino", template_key, template: template, instance: instance) if phone.blank?

    message = WhatsappMessageRenderer.render(template: template.message, order: @order)
    response = EvolutionGoClient.new.send_text(instance.instance_token, phone: phone, message: message)
    log = WhatsappLog.create!(
      company_id: @order.company_id,
      whatsapp_instance: instance,
      level: "ok",
      message: "WhatsApp enviado para status #{@status}",
      metadata_json: base_metadata(template_key, template).merge(
        delivery_mode: @test_mode ? "real_test" : "real_auto",
        order_id: @order.id,
        order_number: @order.order_number,
        status: @status,
        destination_last4: phone.last(4),
        response: scrub_secret(response)
      )
    )
    Result.new(success: true, sent: true, log: log)
  rescue EvolutionGoClient::Error => e
    log = WhatsappLog.create!(
      company_id: @order.company_id,
      level: "err",
      message: "Falha ao enviar WhatsApp para status #{@status}",
      metadata_json: {
        order_id: @order.id,
        order_number: @order.order_number,
        status: @status,
        error: e.message,
        http_status: e.status
      }
    )
    Result.new(success: false, sent: false, error: e.message, log: log)
  end

  private

  def manual_mode?
    @order.company.store_setting&.manual_whatsapp?
  end

  def whatsapp_disabled?
    @order.company.store_setting&.whatsapp_disabled?
  end

  def prepare_manual_message(template_key, template)
    preview = WhatsappManualMessageBuilder.call(order: @order, status: @status, template: template)
    log = WhatsappLog.create!(
      company_id: @order.company_id,
      level: "info",
      message: "WhatsApp preparado para envio manual no status #{@status}",
      metadata_json: base_metadata(template_key, template).merge(
        delivery_mode: "manual",
        order_id: @order.id,
        order_number: @order.order_number,
        status: @status,
        skipped_reason: "skipped_manual_mode",
        destination_last4: preview.phone.to_s.last(4).presence,
        preview_available: preview.available?
      ).compact
    )
    Result.new(
      success: true,
      sent: false,
      error: preview.error,
      log: log,
      manual_preview: preview.as_json
    )
  end

  def test_order?
    return true if @order.notes.to_s.downcase.include?("teste")
    return true if @order.customer_name.to_s.downcase.include?("teste")

    store_phone = @order.company.responsible_phone.to_s.gsub(/\D/, "")
    customer_phone = (@order.customer_whatsapp.presence || @order.customer_phone).to_s.gsub(/\D/, "")
    store_phone.present? && customer_phone.ends_with?(store_phone.last(8))
  end

  def log_skip(reason, template_key, template: nil, instance: nil)
    log = WhatsappLog.create!(
      company_id: @order.company_id,
      whatsapp_instance: instance,
      level: "info",
      message: "WhatsApp ignorado para status #{@status}: #{reason}",
      metadata_json: base_metadata(template_key, template).merge(
        delivery_mode: @test_mode ? "real_test" : "prepared_only",
        order_id: @order.id,
        order_number: @order.order_number,
        status: @status,
        skipped_reason: reason
      )
    )
    Result.new(success: true, sent: false, error: reason, log: log)
  end

  def notification_already_sent?(template_key)
    WhatsappLog.where(company_id: @order.company_id, level: "ok")
               .where("metadata_json ->> 'order_id' = ?", @order.id.to_s)
               .where("metadata_json ->> 'template_key' = ?", template_key.to_s)
               .where("metadata_json ->> 'status' = ?", @status)
               .exists?
  end
  def base_metadata(template_key, template)
    {
      template_key: template_key,
      template_enabled: template&.enabled?
    }
  end

  def normalize_phone(value)
    digits = value.to_s.gsub(/\D/, "")
    # exige no minimo DDD + numero (10 digitos) para ser um destino valido
    return "" if digits.length < 10
    return digits if digits.start_with?("55") && digits.length >= 12

    "55#{digits}"
  end

  def scrub_secret(value)
    case value.as_json
    when Array
      value.as_json.map { |item| scrub_secret(item) }
    when Hash
      value.as_json.each_with_object({}) do |(key, item), result|
        next if %w[apikey api_key authorization token instance_token].include?(key.to_s.downcase)

        result[key] = scrub_secret(item)
      end
    else
      value
    end
  end
end
