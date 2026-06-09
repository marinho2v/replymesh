class EvolutionMessagePayloadParser
  Result = Struct.new(
    :success, :phone, :text, :instance_name, :instance_uuid, :message_id,
    :error, :ignored_reason, :from_me, keyword_init: true
  ) do
    def success? = success
  end

  def self.call(payload:, headers: {})
    new(payload: payload, headers: headers).call
  end

  def initialize(payload:, headers: {})
    @payload = payload.is_a?(Hash) ? payload.with_indifferent_access : {}
    @headers = headers
  end

  def call
    phone = extracted_phone
    text = extract_text.to_s.strip.truncate(2_000)

    return ignored("Mensagem de grupo", phone: phone, text: text) if group?
    return ignored("Mensagem enviada pelo proprio sistema", phone: phone, text: text, from_me: true) if from_me?
    return ignored("Evento de localizacao", phone: phone, text: text) if location?

    return failure("Telefone nao identificado") if phone.blank?
    return ignored("Mensagem sem texto") if text.blank?

    Result.new(
      success: true,
      phone: phone,
      text: text,
      instance_name: instance_name,
      instance_uuid: instance_uuid,
      message_id: first_present(key[:id], info[:ID], data[:id], @payload[:id]),
      from_me: false
    )
  end

  private

  def data = @payload[:data].is_a?(Hash) ? @payload[:data].with_indifferent_access : {}
  def info = data[:Info].is_a?(Hash) ? data[:Info].with_indifferent_access : {}
  def key = data[:key].is_a?(Hash) ? data[:key].with_indifferent_access : {}
  def message = (data[:Message].presence || data[:message].presence || @payload[:message].presence || {}).with_indifferent_access

  def extract_text
    first_present(
      message[:conversation],
      message.dig(:extendedTextMessage, :text),
      message.dig(:textMessage, :text),
      data[:text],
      @payload[:text],
      @payload[:body]
    )
  end

  def instance_name
    first_present(@headers["x-instance-name"], @payload[:instanceName], @payload[:instance_name],
                  data[:instanceName], data[:instance_name], info[:InstanceName])
  end

  def instance_uuid
    first_present(@headers["x-instance-id"], @payload[:instance_uuid], @payload[:instanceUuid],
                  data[:instance_uuid], data[:instanceUuid], info[:InstanceID], info[:InstanceId])
  end

  def from_me?
    [info[:IsFromMe], info[:fromMe], key[:fromMe], @payload[:fromMe]].any? do |value|
      ActiveModel::Type::Boolean.new.cast(value)
    end
  end

  def group?
    [info[:Chat], key[:remoteJid], data[:sender], @payload[:remoteJid], @payload[:sender], @payload[:from]]
      .compact
      .any? { |value| value.to_s.include?("@g.us") }
  end

  def location?
    %i[locationMessage LocationMessage liveLocationMessage location].any? { |field| message[field].present? }
  end

  def extracted_phone
    source = if from_me?
               first_present(info[:Chat], key[:remoteJid], data[:sender], @payload[:sender], @payload[:from])
             else
               first_present(info[:Sender], info[:Chat], key[:remoteJid], data[:sender], @payload[:sender], @payload[:from])
             end

    normalize_phone(source)
  end

  def normalize_phone(value)
    value.to_s.split("@").first.gsub(/\D/, "")
  end

  def first_present(*values)
    values.compact_blank.first
  end

  def ignored(reason, phone: nil, text: nil, from_me: false)
    Result.new(
      success: false,
      phone: phone,
      text: text,
      instance_name: instance_name,
      instance_uuid: instance_uuid,
      ignored_reason: reason,
      from_me: from_me
    )
  end

  def failure(error)
    Result.new(success: false, instance_name: instance_name, instance_uuid: instance_uuid, error: error)
  end
end
