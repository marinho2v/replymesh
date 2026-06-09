module Api
  module V1
    module Store
      class BaseController < ApplicationController
        before_action :authenticate_user!
        before_action :resolve_current_company!

        attr_reader :current_company

        private

        def resolve_current_company!
          @current_company = if current_user.super_admin?
                               find_company_for_super_admin
                             else
                               find_company_for_member
                             end
        end

        def find_company_for_super_admin
          impersonated_company_id = current_jwt_payload&.dig("impersonated_company_id")
          requested_company_id = params[:company_id] || request.headers["X-Company-Id"]
          requested_company_slug = params[:company_slug] || request.headers["X-Company-Slug"]
          cid = impersonated_company_id || requested_company_id

          if impersonated_company_id.present? && requested_company_id.present? &&
             requested_company_id.to_s != impersonated_company_id.to_s
            render json: { success: false, error: "Sessao master vinculada a outra empresa" }, status: :forbidden
            return nil
          end

          unless cid || requested_company_slug.present?
            render json: { success: false, error: "Parametro company_id ou company_slug obrigatorio para super_admin" },
                   status: :bad_request
            return nil
          end

          company = cid ? Company.find_by(id: cid) : Company.find_by(slug: requested_company_slug.to_s)
          unless company
            render json: { success: false, error: "Empresa nao encontrada" }, status: :not_found
            return nil
          end

          if requested_company_slug.present? && company.slug.to_s != requested_company_slug.to_s
            render json: { success: false, error: "Empresa da sessao nao corresponde ao slug acessado" },
                   status: :forbidden
            return nil
          end

          company
        end

        def find_company_for_member
          membership = current_user.company_members.includes(:company).find_by(status: "active")
          unless membership
            render json: { success: false, error: "Sem acesso a nenhuma empresa" }, status: :forbidden
            return nil
          end

          requested_company_slug = params[:company_slug] || request.headers["X-Company-Slug"]
          if requested_company_slug.present? && membership.company.slug.to_s != requested_company_slug.to_s
            render json: { success: false, error: "Usuario nao pertence a empresa acessada" }, status: :forbidden
            return nil
          end

          membership.company
        end

        def render_ok(data = {}, status: :ok, **kwargs)
          payload = data.to_h.merge(kwargs)
          render json: { success: true }.merge(payload), status: status
        end

        def render_created(data = {}, **kwargs)
          render_ok(data, status: :created, **kwargs)
        end

        def render_error(message, status: :unprocessable_entity, errors: nil)
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
            error: "feature_not_available",
            feature: gate.feature,
            required_plan: gate.required_plan,
            message: "Recurso disponivel no Plano #{FeatureCatalog.required_plan_label(gate.required_plan)}."
          }, status: :forbidden
          false
        end

        def render_record_errors(record)
          render_error(
            record.errors.full_messages.first,
            errors: record.errors.full_messages,
            status: :unprocessable_entity
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
