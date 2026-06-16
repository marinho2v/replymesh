module Api
  module V1
    module Public
      class BaseController < ApplicationController
        # Public routes do not require JWT authentication.
        attr_reader :current_company

        before_action :resolve_public_company!

        private

        def resolve_public_company!
          identifier = params[:company_slug].presence || slug_from_request_host
          company = company_from_identifier(identifier)

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
          return find_company_by_domain(host)&.slug unless host.end_with?(".replymesh.cloud")

          candidate = host.delete_suffix(".replymesh.cloud")
          candidate unless CompanyDomainService::RESERVED_SLUGS.include?(candidate)
        end

        def company_from_identifier(identifier)
          value = identifier.to_s.downcase.strip
          return if value.blank?

          if value.include?(".")
            domain_company = find_company_by_domain(value)
            return domain_company if domain_company
          end

          Company.find_by(slug: CompanyDomainService.normalize_slug(value))
        end

        def find_company_by_domain(host)
          normalized_host = host.to_s.downcase.strip.sub(%r{\Ahttps?://}, "").sub(%r{/.*\z}, "")
          candidates = [normalized_host]
          candidates << normalized_host.delete_prefix("www.") if normalized_host.start_with?("www.")

          domain = Domain.includes(:company)
                         .where(domain: candidates, status: "active")
                         .detect { |item| item.company&.status == "active" }
          return domain.company if domain

          Company.where(status: "active")
                 .where(
                   "LOWER(subdomain) IN (:domains) OR LOWER(primary_domain) IN (:domains) OR LOWER(custom_domain) IN (:domains)",
                   domains: candidates
                 )
                 .first
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
