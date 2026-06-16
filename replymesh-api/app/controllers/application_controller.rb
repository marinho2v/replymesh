class ApplicationController < ActionController::API
  JWT_ALGORITHM = "HS256"
  SENSITIVE_KEYS = %w[
    password password_digest token instance_token api_key apikey authorization
    jwt_secret evolution_go_api_key secret key
  ].freeze

  attr_reader :current_user, :current_jwt_payload, :current_impersonation_session

  private

  def authenticate_user!
    token = request.headers["Authorization"].to_s.remove(/^Bearer\s+/)
    @current_jwt_payload = decode_jwt(token)
    @current_user = User.find_by(id: current_jwt_payload["user_id"], status: "active")

    return render json: { success: false, error: "Nao autorizado" }, status: :unauthorized unless @current_user

    validate_impersonation_session! if current_jwt_payload["impersonation"]
  end

  def require_super_admin!
    return if current_user&.super_admin?

    record_denied_master_access(master_permission_for_request)
    render json: {
      success: false,
      error: "master_forbidden",
      message: "Acesso restrito ao super admin"
    }, status: :forbidden
  end

  def require_master_permission!(permission)
    return if current_user&.super_admin?

    record_denied_master_access(permission)
    render json: {
      success: false,
      error: "master_forbidden",
      message: "Acesso restrito ao super admin"
    }, status: :forbidden
  end

  def require_master_user!
    return if current_user&.super_admin?

    record_denied_master_access(master_permission_for_request)
    render json: {
      success: false,
      error: "master_forbidden",
      message: "Acesso restrito ao super admin"
    }, status: :forbidden
  end

  def encode_jwt(payload = {}, expires_in: nil, **claims)
    payload = payload.merge(claims)
    exp = (expires_in || ENV.fetch("JWT_EXPIRATION_HOURS", "24").to_i.hours).from_now.to_i
    JWT.encode(payload.merge(exp: exp), jwt_secret, JWT_ALGORITHM)
  end

  def decode_jwt(token)
    return {} if token.blank?

    JWT.decode(token, jwt_secret, true, algorithm: JWT_ALGORITHM).first
  rescue JWT::DecodeError
    {}
  end

  def jwt_secret
    ENV.fetch("JWT_SECRET") { Rails.application.secret_key_base }
  end

  def audit!(action, company: nil, user: current_user, resource: nil, metadata: {})
    activity_log = ActivityLog.create!(
      company: company,
      user: user,
      action: action,
      resource_type: resource&.class&.name,
      resource_id: resource&.id,
      metadata_json: scrub_sensitive(metadata.as_json)
    )
    if user&.master_user?
      MasterAuditLogService.record!(
        actor: user,
        action: action,
        company: company,
        resource: resource,
        metadata: metadata,
        request: request
      )
    end
    activity_log
  rescue StandardError => e
    Rails.logger.warn("Audit log failed: #{e.class}")
    nil
  end

  def system_alert!(level:, title:, message:, company: nil, metadata: {})
    SystemAlert.create!(
      company: company,
      level: level,
      title: title,
      message: message,
      metadata_json: scrub_sensitive(metadata.as_json)
    )
  rescue StandardError => e
    Rails.logger.warn("System alert failed: #{e.class}")
    nil
  end

  def scrub_sensitive(value)
    case value
    when Array
      value.map { |item| scrub_sensitive(item) }
    when Hash
      value.each_with_object({}) do |(key, item), result|
        key_name = key.to_s
        result[key] = sensitive_key?(key_name) ? "[FILTERED]" : scrub_sensitive(item)
      end
    else
      value
    end
  end

  def sensitive_key?(key)
    SENSITIVE_KEYS.any? { |item| key.downcase.include?(item) }
  end

  def master_permission_for_request
    controller = controller_path.delete_prefix("api/v1/master/")
    action = action_name

    case controller
    when "companies"
      return "companies.view" if %w[index show].include?(action)
      return "companies.create" if action == "create"
      return "companies.suspend" if %w[activate deactivate].include?(action)
      return "impersonate_company" if action == "impersonate"
      "companies.edit"
    when "tickets"
      return "tickets.view" if %w[index show].include?(action)
      return "tickets.reply" if action == "create_message"
      "tickets.status"
    when "financeiro", "subscriptions", "plans"
      action.in?(%w[index show cobrancas inadimplencia]) ? "finance.subscriptions" : "finance.change_plan"
    when "ai"
      "settings.ai"
    when "system_updates"
      "settings.updates"
    when "users", "invites"
      action.in?(%w[index show]) ? "users.edit" : "users.create"
    when "roles"
      "users.permissions"
    when "branding"
      "settings.brand"
    when "activity_logs", "audit_logs", "system_alerts", "notifications"
      "view_audit_logs"
    when "domains", "whatsapp/instances", "whatsapp/templates", "whatsapp/logs", "whatsapp/settings"
      action == "index" ? "companies.view" : "companies.edit"
    end
  end

  def validate_impersonation_session!
    session = MasterImpersonationSession.find_by(id: current_jwt_payload["impersonation_session_id"])
    session&.expire_if_needed!

    valid = session&.active? &&
      session.master_user_id == current_user.id &&
      session.company_id.to_s == current_jwt_payload["impersonated_company_id"].to_s

    unless valid
      @current_user = nil
      return render json: { success: false, error: "Acesso de suporte expirado ou revogado" }, status: :unauthorized
    end

    @current_impersonation_session = session
  end

  def record_denied_master_access(permission)
    return unless current_user&.master_user?

    MasterAuditLogService.record!(
      actor: current_user,
      action: "master_access_denied",
      metadata: {
        permission: permission,
        controller: controller_path,
        action: action_name
      },
      status: "denied",
      request: request
    )
  end
end
