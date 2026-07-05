require "json"
require "net/http"
require "securerandom"
require "uri"

class EvolutionGoClient
  CACHE_GROUP = :evolution
  CACHE_TTL = 30.seconds
  DEFAULT_RETRIES = 2

  class Error < StandardError
    attr_reader :status, :payload

    def initialize(message, status: nil, payload: nil)
      super(message)
      @status = status
      @payload = payload
    end
  end

  def initialize(base_url: ENV["EVOLUTION_GO_BASE_URL"], api_key: ENV["EVOLUTION_GO_API_KEY"], mock_mode: ENV.fetch("EVOLUTION_GO_MOCK_MODE", "true"), company: nil)
    @base_url = base_url.to_s.delete_suffix("/")
    @api_key = api_key.to_s
    @mock_mode = ActiveModel::Type::Boolean.new.cast(mock_mode)
    @company = company
  end

  def test_connection
    return mock_response("connection", "connected") if mock?

    response = global_request(:get, "/instance/all")
    instances = normalize_instances(response)
    { success: true, mode: "real", instances_count: instances.size, auth_header: last_auth_header_label }
  end

  def list_instances
    return [mock_response("mock-instance", "connected")] if mock?

    cache_fetch(endpoint: "list_instances") do
      normalize_instances(global_request(:get, "/instance/all"))
    end
  end

  def create_instance(name, token: SecureRandom.hex(32))
    return mock_response(name, "created") if mock?

    payload = {
      name: name,
      token: token
    }
    response = normalize_instance(global_request(:post, "/instance/create", payload), fallback_name: name, fallback_status: "created")
    invalidate_instance_cache(name)
    response
  end

  def get_qr_code(token, instance_name:, force: false)
    return mock_qr_code(instance_name) if mock?

    cache_fetch(endpoint: "qrcode", extra: instance_name, force: force) do
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
  end

  def status(uuid_or_name, force: false)
    return mock_response(uuid_or_name, "connected") if mock?

    cache_fetch(endpoint: "status", extra: uuid_or_name, force: force) do
      normalize_instance(global_request(:get, "/instance/info/#{escape(uuid_or_name)}"))
    end
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
    invalidate_token_cache(token)
    { success: true, mode: "real" }
  end

  def configure_location_webhook(token, webhook_token: nil)
    connect_instance(token, webhook_url: location_webhook_url(webhook_token), subscribe: ["MESSAGE"])
  end

  def ensure_webhooks(instance, remote: nil)
    EvolutionWebhookProvisioner.call(instance: instance, client: self, remote: remote)
  end

  def location_webhook_url(webhook_token = nil)
    configured_url = ENV["EVOLUTION_LOCATION_WEBHOOK_URL"].presence
    secret = webhook_token.presence || ENV["EVOLUTION_LOCATION_WEBHOOK_SECRET"].presence
    raise Error, "Webhook de localizacao nao configurado" if configured_url.blank? || secret.blank?

    uri = URI(configured_url)
    uri.query = URI.encode_www_form(URI.decode_www_form(uri.query.to_s).to_h.merge("token" => secret))
    uri.to_s
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

  attr_reader :base_url, :api_key, :mock_mode, :last_auth_header_label, :company

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
    response = perform_request_with_retries(uri, req)
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
    PerformanceMonitorService.instrument_external("evolution", company_id: company_id_for_monitoring) do
      Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https", read_timeout: read_timeout, open_timeout: open_timeout) do |http|
        http.keep_alive_timeout = keep_alive_timeout if http.respond_to?(:keep_alive_timeout=)
        http.request(req)
      end
    end
  end

  def perform_request_with_retries(uri, req)
    attempts = retry_attempts
    current_attempt = 0

    loop do
      current_attempt += 1

      begin
        response = perform_request(uri, req)
      rescue Net::OpenTimeout, Net::ReadTimeout, EOFError, Errno::ECONNRESET, Errno::ECONNREFUSED, SocketError => e
        raise e if current_attempt > attempts

        sleep(backoff_seconds(current_attempt))
        next
      end

      return response unless retryable_response?(response) && current_attempt <= attempts

      sleep(backoff_seconds(current_attempt))
    end
  end

  def retryable_response?(response)
    response.code.to_i >= 500
  rescue StandardError
    false
  end

  def retry_attempts
    ENV.fetch("EVOLUTION_GO_RETRY_ATTEMPTS", DEFAULT_RETRIES.to_s).to_i.clamp(0, 4)
  rescue StandardError
    DEFAULT_RETRIES
  end

  def backoff_seconds(attempt)
    base = ENV.fetch("EVOLUTION_GO_RETRY_BACKOFF_MS", "250").to_i.clamp(50, 2_000) / 1000.0
    base * (2**(attempt - 1))
  rescue StandardError
    0.25
  end

  def read_timeout
    ENV.fetch("EVOLUTION_GO_READ_TIMEOUT", "5").to_i.clamp(2, 20)
  rescue StandardError
    5
  end

  def open_timeout
    ENV.fetch("EVOLUTION_GO_OPEN_TIMEOUT", "2").to_i.clamp(1, 10)
  rescue StandardError
    2
  end

  def keep_alive_timeout
    ENV.fetch("EVOLUTION_GO_KEEP_ALIVE_TIMEOUT", "30").to_i.clamp(5, 120)
  rescue StandardError
    30
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

  def cache_fetch(endpoint:, extra: nil, force: false)
    return yield unless defined?(ReplymeshCacheService) && defined?(Rails.cache)

    key = ReplymeshCacheService.key(company: cache_company, group: CACHE_GROUP, endpoint: endpoint, extra: extra)
    Rails.cache.delete(key) if force
    ReplymeshCacheService.fetch(company: cache_company, group: CACHE_GROUP, endpoint: endpoint, extra: extra, expires_in: CACHE_TTL) do
      yield
    end
  rescue StandardError => e
    Rails.logger.warn("[EvolutionGoClient] cache bypass endpoint=#{endpoint}: #{e.class}")
    yield
  end

  def invalidate_instance_cache(instance_name)
    return unless defined?(ReplymeshCacheService) && defined?(Rails.cache)

    Rails.cache.delete(ReplymeshCacheService.key(company: cache_company, group: CACHE_GROUP, endpoint: "list_instances"))
    Rails.cache.delete(ReplymeshCacheService.key(company: cache_company, group: CACHE_GROUP, endpoint: "status", extra: instance_name))
    Rails.cache.delete(ReplymeshCacheService.key(company: cache_company, group: CACHE_GROUP, endpoint: "qrcode", extra: instance_name))
  rescue StandardError => e
    Rails.logger.warn("[EvolutionGoClient] cache invalidate failed instance=#{instance_name}: #{e.class}")
  end

  def invalidate_token_cache(_token)
    Rails.cache.delete(ReplymeshCacheService.key(company: cache_company, group: CACHE_GROUP, endpoint: "list_instances")) if defined?(ReplymeshCacheService) && defined?(Rails.cache)
  rescue StandardError
    nil
  end

  def cache_company
    company || "global"
  end

  def company_id_for_monitoring
    company.respond_to?(:id) ? company.id : company
  end

end
