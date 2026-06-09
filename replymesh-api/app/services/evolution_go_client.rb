require "json"
require "net/http"
require "securerandom"
require "uri"

class EvolutionGoClient
  class Error < StandardError
    attr_reader :status, :payload

    def initialize(message, status: nil, payload: nil)
      super(message)
      @status = status
      @payload = payload
    end
  end

  def initialize(base_url: ENV["EVOLUTION_GO_BASE_URL"], api_key: ENV["EVOLUTION_GO_API_KEY"], mock_mode: ENV.fetch("EVOLUTION_GO_MOCK_MODE", "true"))
    @base_url = base_url.to_s.delete_suffix("/")
    @api_key = api_key.to_s
    @mock_mode = ActiveModel::Type::Boolean.new.cast(mock_mode)
  end

  def test_connection
    return mock_response("connection", "connected") if mock?

    response = global_request(:get, "/instance/all")
    instances = normalize_instances(response)
    { success: true, mode: "real", instances_count: instances.size, auth_header: last_auth_header_label }
  end

  def list_instances
    return [mock_response("mock-instance", "connected")] if mock?

    normalize_instances(global_request(:get, "/instance/all"))
  end

  def create_instance(name, token: SecureRandom.hex(32))
    return mock_response(name, "created") if mock?

    payload = {
      name: name,
      token: token
    }
    normalize_instance(global_request(:post, "/instance/create", payload), fallback_name: name, fallback_status: "created")
  end

  def get_qr_code(token, instance_name:)
    return mock_qr_code(instance_name) if mock?

    response = instance_request(:get, "/instance/qr", token: token)
    qrcode = normalize_qr_code(response)

    {
      success: true,
      instance_name: instance_name,
      qrcode: qrcode,
      pairing_code: response["pairingCode"] || response["pairing_code"],
      status: response["status"],
      mode: "real"
    }
  end

  def status(uuid_or_name)
    return mock_response(uuid_or_name, "connected") if mock?

    normalize_instance(global_request(:get, "/instance/info/#{escape(uuid_or_name)}"))
  end
  alias get_status status

  def connect_instance(token, webhook_url:, subscribe: ["MESSAGE"])
    return { success: true, mode: "mock" } if mock?

    payload = {
      webhookUrl: webhook_url,
      subscribe: subscribe,
      rabbitmqEnable: "",
      websocketEnable: "",
      natsEnable: ""
    }
    instance_request(:post, "/instance/connect", token: token, body: payload)
    { success: true, mode: "real" }
  end

  def configure_location_webhook(token)
    connect_instance(token, webhook_url: location_webhook_url, subscribe: ["MESSAGE"])
  end

  def send_text(token, phone:, message:)
    return { success: true, mode: "mock", message_id: SecureRandom.hex(8) } if mock?

    payload = {
      number: phone,
      text: message
    }
    response = instance_request(:post, "/send/text", token: token, body: payload)
    {
      success: true,
      mode: "real",
      message_id: response["id"] || response["messageId"] || response.dig("data", "id"),
      response: scrub_secret(response)
    }
  end

  def disconnect(name)
    return mock_response(name, "disconnected") if mock?

    raise Error.new("Endpoint real de desconexao ainda nao mapeado para Evolution Go", status: 501)
  end

  def restart(name)
    return mock_response(name, "created") if mock?

    raise Error.new("Endpoint real de reinicio ainda nao mapeado para Evolution Go", status: 501)
  end

  def delete_instance(name)
    return mock_response(name, "not_created") if mock?

    raise Error.new("Endpoint real de exclusao ainda nao mapeado para Evolution Go", status: 501)
  end

  private

  attr_reader :base_url, :api_key, :mock_mode, :last_auth_header_label

  def mock?
    mock_mode || base_url.blank? || api_key.blank?
  end

  def global_request(method, path, body = nil)
    request(method, path, token: api_key, body: body)
  end

  def instance_request(method, path, token:, body: nil)
    request(method, path, token: token, body: body)
  end

  def request(method, path, token:, body: nil)
    uri = URI("#{base_url}#{path}")
    klass = {
      get: Net::HTTP::Get,
      post: Net::HTTP::Post,
      put: Net::HTTP::Put,
      delete: Net::HTTP::Delete
    }.fetch(method)

    req = build_request(klass, uri, token, body)
    response = perform_request(uri, req)
    @last_auth_header_label = "apikey"

    payload = parse_json(response.body)

    return payload if response.is_a?(Net::HTTPSuccess)

    message = payload["message"] || payload["error"] || "Evolution Go retornou HTTP #{response.code}"
    raise Error.new(message, status: response.code.to_i, payload: payload)
  end

  def build_request(klass, uri, token, body)
    req = klass.new(uri)
    req["Content-Type"] = "application/json"
    req["Accept"] = "application/json"
    req["apikey"] = token
    req.body = JSON.generate(body) if body
    req
  end

  def perform_request(uri, req)
    Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https", read_timeout: 20, open_timeout: 8) do |http|
      http.request(req)
    end
  end

  def parse_json(body)
    return {} if body.blank?

    JSON.parse(body)
  rescue JSON::ParserError
    { "raw" => body.to_s }
  end

  def normalize_instances(payload)
    list = payload.is_a?(Array) ? payload : (payload["instances"] || payload["data"] || payload["response"] || [])
    Array(list).map { |item| normalize_instance(item).merge(source: "remote", auth_header: last_auth_header_label) }
  end

  def normalize_instance(payload, fallback_name: nil, fallback_status: nil)
    instance = payload["instance"].is_a?(Hash) ? payload["instance"] : payload["data"].is_a?(Hash) ? payload["data"] : payload
    name = instance["instanceName"] || instance["instance_name"] || instance["name"] || instance["id"] || payload["instanceName"] || fallback_name
    uuid = instance["uuid"] || instance["instance_uuid"] || instance["id"] || payload["uuid"] || payload["id"]
    state = instance["state"] || instance["status"] || instance["connectionStatus"] || payload["status"] || fallback_status
    state = instance["connected"] ? "connected" : "disconnected" if state.blank? && instance.key?("connected")
    owner = instance["owner"] || instance["ownerJid"] || instance["jid"] || instance["connected_number"] || instance["number"]
    profile_name = instance["profileName"] || instance["profile_name"] || instance["pushName"] || instance["name"]

    {
      success: true,
      instance_name: name,
      instance_uuid: uuid,
      status: map_status(state),
      connected_number: owner,
      profile_name: profile_name,
      base_url: base_url.presence,
      mode: mock? ? "mock" : "real",
      raw_status: state,
      remote_data: scrub_secret(instance)
    }
  end

  def map_status(value)
    normalized = value.to_s.downcase
    return "connected" if %w[open connected online].include?(normalized)
    return "connecting" if %w[connecting qrcode qr pending].include?(normalized)
    return "disconnected" if %w[close closed disconnected offline].include?(normalized)
    return "error" if %w[error failed].include?(normalized)
    return "created" if normalized.blank? || normalized == "created"

    "created"
  end

  def mock_response(name, status, mode: mock? ? "mock" : "real", raw: nil)
    {
      success: true,
      instance_name: name,
      status: status,
      base_url: base_url.presence,
      mode: mode,
      raw_status: raw
    }
  end

  def mock_qr_code(name)
    {
      success: true,
      instance_name: name,
      qr_code: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><rect width='220' height='220' fill='white'/><text x='18' y='110' font-size='16'>QR MOCK #{name}</text></svg>",
      status: "connecting",
      mode: "mock"
    }
  end

  def normalize_qr_code(payload)
    qr_code = payload["base64"] || payload["qrcode"] || payload["qr"] || payload["code"] ||
      payload.dig("data", "base64") || payload.dig("data", "qrcode") || payload.dig("data", "qr") ||
      payload.dig("data", "Qrcode") || payload.dig("data", "QRCode") ||
      payload.dig("code", "base64") || payload.dig("qr", "base64")
    qr_code = qr_code.to_s if qr_code.present?
    return { type: "empty", value: nil } if qr_code.blank?
    return { type: "base64", value: qr_code } if qr_code.start_with?("data:image")

    if qr_code.match?(/\A[A-Za-z0-9+\/=\r\n]+\z/)
      { type: "base64", value: "data:image/png;base64,#{qr_code}" }
    else
      { type: "text", value: qr_code }
    end
  end

  def scrub_secret(value)
    case value
    when Array
      value.map { |item| scrub_secret(item) }
    when Hash
      value.each_with_object({}) do |(key, item), result|
        next if %w[apikey api_key authorization token instance_token].include?(key.to_s.downcase)

        result[key] = scrub_secret(item)
      end
    else
      value
    end
  end

  def escape(value)
    URI.encode_www_form_component(value.to_s)
  end

  def location_webhook_url
    base_url = ENV["EVOLUTION_LOCATION_WEBHOOK_URL"].presence
    secret = ENV["EVOLUTION_LOCATION_WEBHOOK_SECRET"].presence
    raise Error, "Webhook de localizacao nao configurado" if base_url.blank? || secret.blank?

    uri = URI(base_url)
    uri.query = URI.encode_www_form(URI.decode_www_form(uri.query.to_s).to_h.merge("token" => secret))
    uri.to_s
  end
end
