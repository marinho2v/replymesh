class MasterAuditLogService
  SENSITIVE_KEYS = ApplicationController::SENSITIVE_KEYS

  class << self
    def record!(actor:, action:, company: nil, resource: nil, metadata: {}, status: "success", request: nil)
      MasterAuditLog.create!(
        actor: actor,
        actor_name: actor&.name,
        actor_email: actor&.email,
        action: action,
        module_name: module_for(action),
        resource_type: resource&.class&.name,
        resource_id: resource&.id,
        company: company,
        company_name: company&.name,
        ip_address: request&.remote_ip,
        user_agent: request&.user_agent.to_s.first(1_000),
        metadata: scrub(metadata.as_json),
        status: status
      )
    rescue StandardError => e
      Rails.logger.warn("Master audit log failed: #{e.class}")
      nil
    end

    private

    def module_for(action)
      value = action.to_s
      return "impersonation" if value.include?("impersonat")
      return "companies" if value.start_with?("company")
      return "users" if value.start_with?("master_user", "master_role", "master_invite", "master_profile")
      return "tickets" if value.include?("ticket")
      return "whatsapp" if %w[whatsapp evolution].any? { |term| value.include?(term) }
      return "domains" if value.include?("domain")
      return "plans" if %w[plan subscription].any? { |term| value.include?(term) }
      return "ai" if value.include?("ai_")
      return "updates" if value.include?("system_update")
      return "authentication" if %w[login logout].any? { |term| value.include?(term) }

      "system"
    end

    def scrub(value)
      case value
      when Array
        value.map { |item| scrub(item) }
      when Hash
        value.each_with_object({}) do |(key, item), result|
          result[key] = sensitive?(key) ? "[FILTERED]" : scrub(item)
        end
      else
        value
      end
    end

    def sensitive?(key)
      SENSITIVE_KEYS.any? { |item| key.to_s.downcase.include?(item) }
    end
  end
end
