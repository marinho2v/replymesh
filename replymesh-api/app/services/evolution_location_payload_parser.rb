class EvolutionLocationPayloadParser
  Result = Struct.new(
    :success,
    :phone,
    :instance_name,
    :instance_uuid,
    :latitude,
    :longitude,
    :label,
    :error,
    :ignored_reason,
    keyword_init: true
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
    phone = normalize_phone(extract_phone)
    instance_name = extract_instance_name
    instance_uuid = extract_instance_uuid

    if from_me?
      return ignored("Mensagem enviada pelo proprio sistema", phone: phone, instance_name: instance_name, instance_uuid: instance_uuid)
    end
    if group_message?
      return ignored("Mensagem de grupo ignorada", phone: phone, instance_name: instance_name, instance_uuid: instance_uuid)
    end

    location = extract_location
    return ignored("Payload sem localizacao conhecida", phone: phone, instance_name: instance_name, instance_uuid: instance_uuid) unless location
    return ignored("Coordenadas invalidas", phone: phone, instance_name: instance_name, instance_uuid: instance_uuid) unless valid_coordinates?(location[:latitude], location[:longitude])

    return failure("Telefone nao identificado", phone: phone, instance_name: instance_name, instance_uuid: instance_uuid) if phone.blank?

    Result.new(
      success: true,
      phone: phone,
      instance_name: instance_name,
      instance_uuid: instance_uuid,
      latitude: location[:latitude],
      longitude: location[:longitude],
      label: location[:label]
    )
  end

  private

  def data = @payload[:data].is_a?(Hash) ? @payload[:data].with_indifferent_access : {}
  def info = data[:Info].is_a?(Hash) ? data[:Info].with_indifferent_access : {}
  def key = data[:key].is_a?(Hash) ? data[:key].with_indifferent_access : {}
  def message = data[:Message].presence || data[:message].presence || @payload[:message].presence || {}

  def extract_phone
    [
      info[:Sender],
      info[:Chat],
      key[:remoteJid],
      key[:participant],
      data[:sender],
      @payload[:sender],
      @payload[:from],
      @payload[:phone],
      @payload[:remoteJid]
    ].compact.find { |value| normalize_phone(value).length >= 10 }
  end

  def extract_instance_name
    [
      @headers["x-instance-name"],
      @payload[:instanceName],
      @payload[:instance_name],
      @payload[:instance],
      data[:instanceName],
      data[:instance_name],
      data[:instance],
      info[:InstanceName],
      info[:instanceName]
    ].compact_blank.first.to_s.presence
  end

  def extract_instance_uuid
    [
      @headers["x-instance-id"],
      @payload[:instance_uuid],
      @payload[:instanceUuid],
      data[:instance_uuid],
      data[:instanceUuid],
      info[:InstanceID],
      info[:InstanceId],
      info[:instanceId]
    ].compact_blank.first.to_s.presence
  end

  def extract_location
    location_hash = location_candidates.find { |candidate| candidate.is_a?(Hash) }
    return unless location_hash

    location = location_hash.with_indifferent_access
    latitude = numeric(location[:degreesLatitude] || location[:latitude] || location[:lat])
    longitude = numeric(location[:degreesLongitude] || location[:longitude] || location[:lng] || location[:lon])
    return if latitude.nil? || longitude.nil?

    {
      latitude: latitude,
      longitude: longitude,
      label: (location[:name] || location[:address] || location[:description] || location[:title]).to_s.strip.presence
    }
  end

  def location_candidates
    msg = message.is_a?(Hash) ? message.with_indifferent_access : {}

    [
      msg[:locationMessage],
      msg[:LocationMessage],
      msg[:liveLocationMessage],
      msg[:location],
      data[:locationMessage],
      data[:location],
      @payload[:locationMessage],
      @payload[:location]
    ]
  end

  def from_me?
    ActiveModel::Type::Boolean.new.cast(info[:IsFromMe]) ||
      ActiveModel::Type::Boolean.new.cast(info[:fromMe]) ||
      ActiveModel::Type::Boolean.new.cast(key[:fromMe]) ||
      ActiveModel::Type::Boolean.new.cast(@payload[:fromMe])
  end

  def group_message?
    [info[:Chat], key[:remoteJid], @payload[:remoteJid]].compact.any? { |value| value.to_s.include?("@g.us") }
  end

  def valid_coordinates?(latitude, longitude)
    latitude.between?(-90, 90) && longitude.between?(-180, 180)
  end

  def numeric(value)
    return value.to_f if value.is_a?(Numeric)
    return unless value.is_a?(String)

    normalized = value.strip.tr(",", ".")
    return unless normalized.match?(/\A-?\d+(\.\d+)?\z/)

    normalized.to_f
  end

  def normalize_phone(value)
    value.to_s.split("@").first.gsub(/\D/, "")
  end

  def ignored(reason, phone: nil, instance_name: nil, instance_uuid: nil)
    Result.new(success: false, phone: phone, instance_name: instance_name, instance_uuid: instance_uuid, ignored_reason: reason)
  end

  def failure(error, phone: nil, instance_name: nil, instance_uuid: nil)
    Result.new(success: false, phone: phone, instance_name: instance_name, instance_uuid: instance_uuid, error: error)
  end
end
