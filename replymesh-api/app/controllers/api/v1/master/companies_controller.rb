module Api
  module V1
    module Master
      class CompaniesController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_company, only: %i[show update activate deactivate impersonate]

        def index
          companies = Company.includes(:domains, :company_members, subscriptions: :plan).order(created_at: :desc)
          render json: { success: true, companies: companies.map { |company| serialize_company(company) } }
        end

        def show
          render json: { success: true, company: serialize_company(@company) }
        end

        def create
          result = CompanyOnboardingService.call(company_params, options_params, actor: current_user)

          if result.success?
            created_company = Company.find_by(id: result.payload.dig(:company, :id))
            MasterAuditLogService.record!(
              actor: current_user,
              action: "company_created",
              company: created_company,
              resource: created_company,
              metadata: { slug: created_company&.slug },
              request: request
            )
            render json: result.payload, status: :created
          else
            render json: { success: false, errors: result.errors }, status: :unprocessable_entity
          end
        end

        def update
          previous = @company.attributes.slice("name", "slug", "status", "plan_status", "responsible_email")

          if @company.update(company_update_params)
            audit!(
              "company_updated",
              company: @company,
              resource: @company,
              metadata: {
                previous: previous,
                current: @company.attributes.slice("name", "slug", "status", "plan_status", "responsible_email")
              }
            )
            render json: { success: true, company: serialize_company(@company) }
          else
            render json: { success: false, errors: @company.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def activate
          update_status!("active")
        end

        def deactivate
          update_status!("inactive")
        end

        def impersonate
          session_token = SecureRandom.hex(32)
          expires_at = 30.minutes.from_now
          session = MasterImpersonationSession.create!(
            master_user: current_user,
            company: @company,
            token_hash: MasterImpersonationSession.digest(session_token),
            expires_at: expires_at,
            ip_address: request.remote_ip,
            user_agent: request.user_agent,
            reason: params[:reason].to_s.strip.presence,
            status: "active"
          )
          access_token = encode_jwt(
            {
              user_id: current_user.id,
              impersonated_company_id: @company.id,
              impersonation: true,
              impersonation_session_id: session.id
            },
            expires_in: 30.minutes
          )

          audit!(
            "company_impersonation_started",
            company: @company,
            resource: session,
            metadata: {
              actor_user_id: current_user.id,
              expires_at: expires_at,
              reason: session.reason
            }
          )

          render json: {
            success: true,
            token: access_token,
            session_token: session_token,
            company_id: @company.id,
            company_slug: @company.slug,
            expires_at: expires_at,
            expires_in_minutes: 30,
            login_url: store_impersonation_url(@company),
            company: serialize_company(@company),
            user: current_user.as_json
          }
        end

        private

        def set_company
          @company = Company.find(params[:id])
        end

        def store_impersonation_url(company)
          platform_domain = ENV.fetch("REPLYMESH_PLATFORM_DOMAIN", "replymesh.cloud")
                               .to_s
                               .strip
                               .sub(%r{\Ahttps?://}, "")
                               .sub(%r{/.*\z}, "")
          host = company.subdomain.presence || "#{company.slug}.#{platform_domain}"

          "https://#{host}/loja/#{company.slug}/admin/impersonate"
        end

        def company_params
          params.require(:company).permit(
            :name, :slug, :legal_name, :document_number, :responsible_name,
            :responsible_phone, :responsible_email, :plan_slug, :status,
            :plan_status, :admin_password, :timezone, :default_locale,
            :custom_domain
          )
        end

        def company_update_params
          params.require(:company).permit(
            :name, :slug, :legal_name, :document_number, :responsible_name,
            :responsible_phone, :responsible_email, :status, :plan_status,
            :timezone, :default_locale, :custom_domain, :custom_domain_status, :ssl_status
          )
        end

        def options_params
          params.fetch(:options, ActionController::Parameters.new).permit(
            :create_whatsapp_instance, :create_default_settings,
            :create_default_templates, :create_default_payment_methods,
            :enable_public_site, :enable_admin_panel, :enable_motoboy_area,
            :enable_customer_app, :enable_motoboy_app
          )
        end

        def serialize_company(company)
          subscription = company.subscriptions.order(created_at: :desc).first rescue nil
          plan         = subscription&.plan

          primary_domain = begin
            (company.domains.find { |d| d.respond_to?(:is_primary?) && d.is_primary? } ||
             company.domains.find { |d| d.respond_to?(:is_primary) && d.is_primary } ||
             company.domains.first)&.domain
          rescue StandardError
            nil
          end

          {
            id:                      company.id,
            name:                    company.name,
            slug:                    company.slug,
            legal_name:              company.legal_name,
            document_number:         company.document_number,
            responsible_name:        company.responsible_name,
            responsible_phone:       company.responsible_phone,
            responsible_email:       company.responsible_email,
            status:                  company.status,
            plan_status:             company.plan_status,
            trial_ends_at:           company.trial_ends_at,
            timezone:                company.timezone,
            default_locale:          company.default_locale,
            created_at:              company.created_at,
            updated_at:              company.updated_at,
            primary_domain:          primary_domain,
            subdomain:               company.subdomain,
            custom_domain:           company.custom_domain,
            domain_status:           company.domain_status,
            custom_domain_status:    company.custom_domain_status,
            ssl_status:              company.respond_to?(:ssl_status) ? company.ssl_status : "pending",
            dns_verified_at:         company.dns_verified_at,
            users_count:             company.company_members.size,
            plan:                    plan&.name,
            plan_slug:               plan&.slug,
            subscription_status:     subscription&.status,
            subscription_price_cents: subscription&.price_cents
          }
        rescue StandardError => e
          Rails.logger.error("[CompaniesController] serialize_company error for #{company.id}: #{e.message}")
          { id: company.id, name: company.name, slug: company.slug, status: company.status, error: true }
        end

        def update_status!(status)
          previous_status = @company.status
          previous_plan_status = @company.plan_status
          @company.update!(status: status, plan_status: status == "active" ? "active" : @company.plan_status)
          audit!(
            status == "active" ? "company_activated" : "company_deactivated",
            company: @company,
            resource: @company,
            metadata: {
              previous_status: previous_status,
              new_status: @company.status,
              previous_plan_status: previous_plan_status,
              new_plan_status: @company.plan_status
            }
          )
          render json: { success: true, company: serialize_company(@company) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end
      end
    end
  end
end
