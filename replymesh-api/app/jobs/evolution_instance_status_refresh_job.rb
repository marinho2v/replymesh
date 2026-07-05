class EvolutionInstanceStatusRefreshJob < ApplicationJob
  queue_as :default

  def perform(whatsapp_instance_id)
    instance = WhatsappInstance.includes(company: :store_setting).find_by(id: whatsapp_instance_id)
    return unless instance
    return unless automatic_whatsapp?(instance.company)

    response = EvolutionGoClient.new(company: instance.company).status(
      instance.instance_uuid.presence || instance.instance_name,
      force: true
    )
    apply_remote_status!(instance, response)
  rescue EvolutionGoClient::Error => e
    mark_remote_error(instance, e) if defined?(instance) && instance
    Rails.logger.warn("[EvolutionInstanceStatusRefreshJob] instance_id=#{whatsapp_instance_id} status=#{e.status} error=#{e.class}")
  rescue StandardError => e
    Rails.logger.warn("[EvolutionInstanceStatusRefreshJob] instance_id=#{whatsapp_instance_id} error=#{e.class}")
  end

  private

  def automatic_whatsapp?(company)
    setting = company.store_setting
    setting.nil? || setting.automatic_whatsapp?
  end

  def apply_remote_status!(instance, response)
    status = response[:status].presence || instance.status
    attrs = {
      status: status,
      remote_status: response[:raw_status].presence || status,
      remote_data: scrub_secret(response[:remote_data] || response),
      last_remote_sync_at: Time.current
    }
    attrs[:instance_uuid] = response[:instance_uuid] if response[:instance_uuid].present?
    attrs[:connected_number] = response[:connected_number] if response[:connected_number].present?
    attrs[:last_connected_at] = Time.current if status == "connected"
    attrs[:last_disconnected_at] = Time.current if status == "disconnected"
    instance.update!(attrs.compact)
  end

  def mark_remote_error(instance, error)
    return unless recoverable_evolution_instance_error?(error)

    instance.update!(
      status: "disconnected",
      remote_status: "remote_missing",
      remote_data: scrub_secret({
        status: error.status,
        error: error.message,
        source: "evolution_status_refresh_job"
      }),
      qr_code: nil,
      last_disconnected_at: Time.current,
      last_remote_sync_at: Time.current
    )
  rescue StandardError => e
    Rails.logger.warn("[EvolutionInstanceStatusRefreshJob] remote error update failed instance_id=#{instance.id}: #{e.class}")
  end

  def recoverable_evolution_instance_error?(error)
    status = error.status.to_i
    message = error.message.to_s.downcase
    payload = error.payload.to_s.downcase

    return true if [401, 403, 404, 410].include?(status)

    [
      "not authorized",
      "unauthorized",
      "forbidden",
      "not found",
      "nao encontrado",
      "não encontrado",
      "instance not found",
      "instancia nao encontrada",
      "instância não encontrada",
      "does not exist"
    ].any? { |term| message.include?(term) || payload.include?(term) }
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
