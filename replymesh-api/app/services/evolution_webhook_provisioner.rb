require "uri"

class EvolutionWebhookProvisioner
  REQUIRED_EVENTS = %w[MESSAGE].freeze

  def self.call(instance:, client: EvolutionGoClient.new, remote: nil)
    new(instance: instance, client: client, remote: remote).call
  end

  def initialize(instance:, client:, remote:)
    @instance = instance
    @client = client
    @remote = remote
  end

  def call
    return result("skipped", changed: false, reason: "missing_instance_token") if instance.instance_token.blank?

    webhook_token = EvolutionWebhookToken.generate(instance)
    desired_url = client.location_webhook_url(webhook_token)
    remote_state = remote || fetch_remote_state

    if configured?(remote_state, desired_url)
      return result("unchanged", changed: false)
    end

    client.connect_instance(
      instance.instance_token,
      webhook_url: desired_url,
      subscribe: REQUIRED_EVENTS
    )
    log_configuration!

    result("configured", changed: true)
  end

  private

  attr_reader :instance, :client, :remote

  def fetch_remote_state
    client.status(instance.instance_uuid.presence || instance.instance_name)
  rescue EvolutionGoClient::Error
    nil
  end

  def configured?(remote_state, desired_url)
    data = remote_data(remote_state)
    current_url = first_present(data["webhook"], data[:webhook], data["webhookUrl"], data[:webhookUrl])
    events = normalize_events(first_present(data["events"], data[:events], data["subscribe"], data[:subscribe]))

    signed_for_instance?(current_url, desired_url) && (REQUIRED_EVENTS - events).empty?
  end

  def remote_data(remote_state)
    return {} unless remote_state.is_a?(Hash)

    remote_state[:remote_data] || remote_state["remote_data"] || remote_state
  end

  def signed_for_instance?(current_url, desired_url)
    current = parse_uri(current_url)
    desired = parse_uri(desired_url)
    return false unless current && desired
    return false unless [current.scheme, current.host, current.port, current.path] ==
                        [desired.scheme, desired.host, desired.port, desired.path]

    token = URI.decode_www_form(current.query.to_s).to_h["token"]
    EvolutionWebhookToken.resolve(token)&.id == instance.id
  end

  def parse_uri(value)
    URI(value.to_s)
  rescue URI::InvalidURIError
    nil
  end

  def normalize_events(value)
    case value
    when Array
      value
    when String
      value.split(/[\s,]+/)
    else
      []
    end.map { |event| event.to_s.upcase }.reject(&:blank?).uniq
  end

  def first_present(*values)
    values.compact_blank.first
  end

  def result(action, changed:, reason: nil)
    {
      success: true,
      action: action,
      changed: changed,
      reason: reason,
      instance_id: instance.id,
      instance_name: instance.instance_name,
      events: REQUIRED_EVENTS
    }.compact
  end

  def log_configuration!
    WhatsappLog.create!(
      company: instance.company,
      whatsapp_instance: instance,
      level: "info",
      message: "Webhooks Evolution configurados automaticamente",
      metadata_json: {
        source: "evolution_webhook_provisioner",
        events: REQUIRED_EVENTS,
        location_enabled: true,
        from_me_supported: true
      }
    )
  rescue StandardError => e
    Rails.logger.warn("Evolution webhook provision log failed: #{e.class}")
  end
end
