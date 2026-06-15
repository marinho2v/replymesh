module Api
  module V1
    module Public
      class BaseController < ApplicationController
        # Public routes do not require JWT authentication.
        attr_reader :current_company

        before_action :resolve_public_company!

        private

        def resolve_public_company!
          slug = params[:company_slug].presence || slug_from_request_host
          normalized_slug = CompanyDomainService.normalize_slug(slug)
          company = Company.find_by(slug: normalized_slug)

          unless company
            return render json: {
              success: false,
              error: "Loja nao encontrada",
              code: "store_not_found"
            }, status: :not_found
          end

          unless company.status == "active"
            return render json: {
              success: false,
              error: "Loja indisponivel",
              code: "store_unavailable"
            }, status: :locked
          end

          @current_company = company
        end

        def slug_from_request_host
          host = request.host.to_s.downcase
          return unless host.end_with?(".replymesh.cloud")

          candidate = host.delete_suffix(".replymesh.cloud")
          candidate unless CompanyDomainService::RESERVED_SLUGS.include?(candidate)
        end

        def render_ok(data = {}, status: :ok, **kwargs)
          payload = data.to_h.merge(kwargs)
          render json: { success: true }.merge(payload), status: status
        end

        def render_error(message, status: :unprocessable_entity)
          render json: { success: false, error: message }, status: status
        end

        def render_not_found(message = "Recurso nao encontrado")
          render json: { success: false, error: message }, status: :not_found
        end
      end
    end
  end
end
