module Api
  module V1
    module Master
      class DomainsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_domain, only: %i[show update destroy verify set_primary]

        def index
          domains = Domain.includes(:company).order(is_primary: :desc, created_at: :desc)
          render json: { success: true, metrics: metrics, domains: domains.map { |domain| serialize_domain(domain) } }
        end

        def show
          render json: { success: true, domain: serialize_domain(@domain) }
        end

        def create
          domain = Domain.new(domain_params)

          Domain.transaction do
            clear_primary!(domain.company_id) if ActiveModel::Type::Boolean.new.cast(domain.is_primary)
            domain.save!
            log!("domain_created", domain)
          end

          render json: { success: true, domain: serialize_domain(domain) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def update
          Domain.transaction do
            @domain.assign_attributes(domain_params)
            clear_primary!(@domain.company_id, except_id: @domain.id) if @domain.is_primary?
            @domain.save!
            log!("domain_updated", @domain)
          end

          render json: { success: true, domain: serialize_domain(@domain.reload) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def destroy
          @domain.update!(status: "inactive", is_primary: false)
          log!("domain_deactivated", @domain)
          render json: { success: true, domain: serialize_domain(@domain) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def set_primary
          Domain.transaction do
            clear_primary!(@domain.company_id, except_id: @domain.id)
            @domain.update!(is_primary: true, status: @domain.status == "inactive" ? "pending" : @domain.status)
            log!("domain_set_primary", @domain)
          end

          render json: { success: true, domain: serialize_domain(@domain.reload) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def verify
          dns_status = mock_dns_status(@domain.domain)
          ssl_status = dns_status == "active" ? mock_ssl_status(@domain.domain) : "pending"

          @domain.update!(
            status: dns_status,
            ssl_status: ssl_status,
            last_checked_at: Time.current
          )
          log!("domain_dns_verified", @domain)

          render json: { success: true, domain: serialize_domain(@domain), result: { dns_status: dns_status, ssl_status: ssl_status, mode: "mock" } }
        end

        private

        def set_domain
          @domain = Domain.includes(:company).find(params[:id])
        end

        def domain_params
          params.require(:domain).permit(:company_id, :domain, :domain_type, :status, :ssl_status, :is_primary)
        end

        def metrics
          {
            total_count: Domain.count,
            active_count: Domain.where(status: "active").count,
            pending_count: Domain.where(status: "pending").count,
            error_count: Domain.where(status: "dns_error").or(Domain.where(ssl_status: "error")).count,
            inactive_count: Domain.where(status: "inactive").count
          }
        end

        def serialize_domain(domain)
          {
            id: domain.id,
            domain: domain.domain,
            domain_type: domain.domain_type,
            status: domain.status,
            ssl_status: domain.ssl_status,
            is_primary: domain.is_primary,
            last_checked_at: domain.last_checked_at,
            created_at: domain.created_at,
            updated_at: domain.updated_at,
            company: {
              id: domain.company.id,
              name: domain.company.name,
              slug: domain.company.slug,
              status: domain.company.status
            }
          }
        end

        def clear_primary!(company_id, except_id: nil)
          scope = Domain.where(company_id: company_id, is_primary: true)
          scope = scope.where.not(id: except_id) if except_id
          scope.update_all(is_primary: false, updated_at: Time.current)
        end

        def mock_dns_status(domain)
          return "dns_error" if domain.include?("erro") || domain.include?("invalid") || domain.include?("falha")
          return "inactive" if domain.include?("inativo")

          "active"
        end

        def mock_ssl_status(domain)
          return "error" if domain.include?("ssl-error")

          "active"
        end

        def log!(action, domain)
          audit!(
            action,
            company: domain.company,
            resource: domain,
            metadata: { domain: domain.domain, status: domain.status, ssl_status: domain.ssl_status }
          )
        end
      end
    end
  end
end
