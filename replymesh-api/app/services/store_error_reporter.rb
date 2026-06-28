class StoreErrorReporter
  ALERT_WINDOW = 10.minutes

  class << self
    def report!(company:, user:, request:, status:, error: nil, message: nil, context: {})
      status_code = status.to_i
      error_message = (message.presence || error&.message.presence || "Erro operacional").to_s.slice(0, 500)
      error_class = error&.class&.name || context[:error_class] || "OperationalError"
      metadata = {
        status: status_code,
        request_id: request&.request_id,
        method: request&.request_method,
        path: request&.path,
        controller: context.delete(:controller),
        action: context.delete(:action),
        error_class: error_class,
        error_message: error_message
      }.merge(context.compact)

      ActivityLog.create!(
        company: company,
        user: user,
        action: "store_request_error",
        resource_type: metadata[:resource_type],
        resource_id: metadata[:resource_id],
        metadata_json: scrub(metadata)
      )

      create_system_alert!(company, status_code, error_class, error_message, metadata) if status_code >= 500
    rescue StandardError => reporter_error
      Rails.logger.error(
        "Store error reporting failed: #{reporter_error.class}: #{reporter_error.message}"
      )
      nil
    end

    private

    def create_system_alert!(company, status, error_class, error_message, metadata)
      title = "Erro interno na loja"
      duplicate = SystemAlert.unresolved
                             .where(company: company, title: title)
                             .where("created_at >= ?", ALERT_WINDOW.ago)
                             .where("metadata_json ->> 'path' = ?", metadata[:path].to_s)
                             .exists?
      return if duplicate

      SystemAlert.create!(
        company: company,
        level: status >= 500 ? "error" : "warning",
        title: title,
        message: "#{error_class}: #{error_message}".slice(0, 500),
        metadata_json: scrub(metadata)
      )
    end

    def scrub(value)
      case value
      when Array
        value.map { |item| scrub(item) }
      when Hash
        value.each_with_object({}) do |(key, item), result|
          result[key] = sensitive_key?(key) ? "[FILTERED]" : scrub(item)
        end
      else
        value
      end
    end

    def sensitive_key?(key)
      key.to_s.downcase.match?(/password|token|secret|authorization|api.?key|pix.?key/)
    end
  end
end
