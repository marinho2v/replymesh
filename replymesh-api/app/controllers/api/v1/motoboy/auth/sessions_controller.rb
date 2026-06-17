module Api
  module V1
    module Motoboy
      module Auth
        class SessionsController < ApplicationController
          def create
            company = resolve_company_for_login
            return render json: { success: false, error: "Empresa nao encontrada" }, status: :not_found unless company

            motoboy = company.motoboys.active.find do |record|
              PhoneNormalizer.equivalent?(record.phone, login_params[:phone])
            end
            return unauthorized unless motoboy&.user&.status == "active"
            return unauthorized unless CompanyMember.active.exists?(
              user_id: motoboy.user_id,
              company_id: company.id,
              role: "motoboy"
            )

            unless motoboy.user.authenticate(login_params[:password].to_s)
              return unauthorized
            end

            token = encode_jwt(user_id: motoboy.user_id, company_id: company.id, role: "motoboy")
            motoboy.user.update!(last_sign_in_at: Time.current)

            render json: {
              success: true,
              token: token,
              motoboy: serialize_motoboy(motoboy),
              company: {
                id: company.id,
                slug: company.slug,
                name: company.store_setting&.store_name.presence || company.name,
                logo_url: company.store_setting&.logo_url
              }
            }
          end

          private

          def login_params
            params.require(:auth).permit(:phone, :password, :company_slug)
          rescue ActionController::ParameterMissing
            params.permit(:phone, :password, :company_slug)
          end

          def resolve_company_for_login
            identifier = login_params[:company_slug].presence ||
                         request.headers["X-Company-Slug"].presence ||
                         request.host
            company_from_identifier(identifier) || company_from_identifier(request.host)
          end

          def company_from_identifier(identifier)
            value = identifier.to_s.downcase.strip.sub(%r{\Ahttps?://}, "").sub(%r{/.*\z}, "")
            return if value.blank?

            if value.include?(".")
              domain_company = find_company_by_domain(value)
              return domain_company if domain_company
            end

            Company.find_by(slug: CompanyDomainService.normalize_slug(value), status: "active")
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

          def unauthorized
            render json: { success: false, error: "Telefone ou senha invalidos" }, status: :unauthorized
          end

          def serialize_motoboy(motoboy)
            motoboy.as_json(only: %i[id name phone active is_available total_deliveries notes]).merge(
              user_id: motoboy.user_id
            )
          end
        end
      end
    end
  end
end
