module Api
  module V1
    module Store
      class BaseController < ApplicationController
        rescue_from StandardError, with: :render_store_internal_error
        rescue_from ActionController::ParameterMissing, with: :render_missing_parameter

        before_action :authenticate_user!
        before_action :resolve_current_company!
        before_action :authorize_store_role!

        attr_reader :current_company

        private

        def resolve_current_company!
          requested_company = find_requested_company
          return if performed?

          @current_company = current_user.super_admin? ?
            find_company_for_impersonation(requested_company) :
            find_company_for_member(requested_company)
        end

        def find_requested_company
          requested_company_id = params[:company_id].presence || request.headers["X-Company-Id"].presence
          requested_company_slug = params[:company_slug].presence || request.headers["X-Company-Slug"].presence

          if requested_company_id.present? && requested_company_slug.present?
            company = Company.find_by(id: requested_company_id)
            return tenant_forbidden!("Empresa solicitada nao corresponde ao slug acessado") if
              company && company.slug.to_s != requested_company_slug.to_s
          end

          company = if requested_company_id.present?
                      Company.find_by(id: requested_company_id)
                    elsif requested_company_slug.present?
                      Company.find_by(slug: requested_company_slug.to_s)
                    end

          return company if company
          return render json: { success: false, error: "tenant_required" }, status: :bad_request if
            requested_company_id.blank? && requested_company_slug.blank?

          render json: { success: false, error: "Empresa nao encontrada" }, status: :not_found
          nil
        end

        def find_company_for_impersonation(requested_company)
          impersonated_company_id = current_jwt_payload&.dig("impersonated_company_id")
          return tenant_forbidden!("Super admin precisa usar acesso de suporte auditado") unless
            current_jwt_payload&.dig("impersonation") && current_impersonation_session && impersonated_company_id.present?
          return tenant_forbidden!("Sessao master vinculada a outra empresa") unless
            requested_company&.id.to_s == impersonated_company_id.to_s

          requested_company
        end

        def find_company_for_member(requested_company)
          membership = current_user.company_members.active.find_by(company_id: requested_company&.id)
          return tenant_forbidden!("Usuario nao pertence a empresa acessada") unless membership

          @current_company_member = membership
          requested_company
        end

        def authorize_store_role!
          return true if performed?
          return true if current_user.super_admin? && current_impersonation_session
          return true if store_admin?
          return true if cashier? && cashier_allowed?

          role = current_company_member&.role
          return forbidden_role unless role

          return true if role == "employee" && employee_allowed?
          return true if role == "waiter" && waiter_allowed?
          return true if role == "kitchen" && kitchen_allowed?

          forbidden_role
        end

        def current_company_member
          @current_company_member ||= current_user.company_members.active.find_by(company_id: current_company&.id)
        end

        def store_admin?
          current_company_member&.role == "store_admin"
        end

        def cashier?
          current_company_member&.role == "cashier"
        end

        def cashier_allowed?
          controller_path.in?(%w[
            api/v1/store/dashboard
            api/v1/store/orders
            api/v1/store/pos
            api/v1/store/cash_sessions
            api/v1/store/cash_movements
            api/v1/store/categories
            api/v1/store/products
            api/v1/store/dining_tables
            api/v1/store/table_sessions
            api/v1/store/features
            api/v1/store/notifications
            api/v1/store/reports
          ])
        end

        def employee_allowed?
          controller_path.in?(
            %w[
              api/v1/store/dashboard
              api/v1/store/orders
              api/v1/store/dining_tables
              api/v1/store/table_sessions
              api/v1/store/categories
              api/v1/store/products
              api/v1/store/motoboys
              api/v1/store/deliveries
              api/v1/store/features
              api/v1/store/notifications
            ]
          )
        end

        def waiter_allowed?
          return true if controller_path.in?(%w[api/v1/store/features api/v1/store/notifications])
          return %w[index show].include?(action_name) if controller_path.in?(%w[api/v1/store/categories api/v1/store/products])
          return %w[index show].include?(action_name) if controller_path == "api/v1/store/dining_tables"
          return %w[index show create update].include?(action_name) if controller_path == "api/v1/store/table_sessions"
          return %w[index show status].include?(action_name) if controller_path == "api/v1/store/orders"

          false
        end

        def kitchen_allowed?
          controller_path == "api/v1/store/orders" && action_name.in?(%w[kitchen status])
        end

        def forbidden_role
          render json: { success: false, error: "Perfil sem permissao para este recurso" }, status: :forbidden
          false
        end

        def tenant_forbidden!(message)
          render json: {
            success: false,
            error: "tenant_forbidden",
            message: message
          }, status: :forbidden
          nil
        end

        def render_ok(data = {}, status: :ok, **kwargs)
          payload = data.to_h.merge(kwargs)
          render json: { success: true }.merge(payload), status: status
        end

        def render_created(data = {}, **kwargs)
          render_ok(data, status: :created, **kwargs)
        end

        def render_error(message, status: :unprocessable_entity, errors: nil)
          report_store_error(
            status: Rack::Utils.status_code(status),
            message: message,
            context: { errors: Array(errors).first(10) }
          )
          body = { success: false, error: message }
          body[:errors] = errors if errors
          render json: body, status: status
        end

        def render_not_found(resource = "Recurso")
          render_error("#{resource} nao encontrado", status: :not_found)
        end

        def require_feature!(feature_key)
          gate = FeatureGate.check(current_company, feature_key)
          return true if gate.enabled?

          render json: {
            success: false,
            error: "feature_disabled",
            legacy_error: "feature_not_available",
            feature: gate.feature,
            required_plan: gate.required_plan,
            message: "Recurso disponivel no Plano #{FeatureCatalog.required_plan_label(gate.required_plan)}."
          }, status: :forbidden
          false
        end

        def render_record_errors(record)
          messages = record.errors.full_messages
          report_store_error(
            status: :unprocessable_entity,
            message: messages.first,
            context: {
              resource_type: record.class.name,
              resource_id: record.id,
              validation_errors: record.errors.to_hash(true)
            }
          )
          render json: {
            success: false,
            error: messages.first,
            errors: messages
          }, status: :unprocessable_entity
        end

        def render_missing_parameter(error)
          report_store_error(status: :bad_request, error: error)
          render json: {
            success: false,
            error: "Dados incompletos para concluir a operacao",
            message: "O campo obrigatorio '#{error.param}' nao foi enviado.",
            request_id: request.request_id
          }, status: :bad_request
        end

        def render_store_internal_error(error)
          report_store_error(status: :internal_server_error, error: error)
          Rails.logger.error(
            "[#{request.request_id}] Store request failed: #{error.class}: #{error.message}"
          )
          Rails.logger.error(error.backtrace.first(15).join("\n")) if error.backtrace

          render json: {
            success: false,
            error: "internal_server_error",
            message: "Nao foi possivel concluir a operacao. O erro foi registrado para o suporte.",
            request_id: request.request_id
          }, status: :internal_server_error
        end

        def report_store_error(status:, error: nil, message: nil, context: {})
          StoreErrorReporter.report!(
            company: current_company,
            user: current_user,
            request: request,
            status: Rack::Utils.status_code(status),
            error: error,
            message: message,
            context: {
              controller: controller_path,
              action: action_name
            }.merge(context)
          )
        end

        def company_scope(model_class)
          model_class.for_company(current_company.id)
        end

        def page_limit
          [[params.fetch(:limit, 50).to_i, 1].max, 200].min
        end

        def page_offset
          [params.fetch(:offset, 0).to_i, 0].max
        end
      end
    end
  end
end
