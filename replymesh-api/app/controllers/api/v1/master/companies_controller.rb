module Api
  module V1
    module Master
      class CompaniesController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_company, only: %i[
          show update activate deactivate impersonate features update_features update_plan
          admin_password store_settings update_store_settings store_ai_settings update_store_ai_settings
        ]

        def index
          companies = Company.includes(:domains, :company_members, :store_setting, subscriptions: :plan).order(created_at: :desc)
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

        def features
          render json: {
            success: true,
            company: serialize_company(@company),
            feature_access: FeatureGate.access_map(@company),
            module_access: CompanyModuleCatalog.access_map(@company),
            module_catalog: CompanyModuleCatalog.serialize,
            module_presets: CompanyModuleCatalog::PRESETS,
            catalog: FeatureCatalog.serialize,
            plan_copy: FeatureCatalog::PLAN_COPY
          }
        end

        def update_features
          if params[:module_keys].present? || params[:module_preset].present?
            selected_modules = params[:module_keys].presence || CompanyModuleCatalog.preset(params[:module_preset])
            applied = CompanyModuleAssignment.apply!(
              company: @company,
              module_keys: selected_modules,
              actor: current_user,
              internal_note: params[:internal_note]
            )
            audit!(
              "company_modules_updated",
              company: @company,
              resource: @company,
              metadata: { module_keys: applied, preset: params[:module_preset] }
            )
            return render json: {
              success: true,
              feature_access: FeatureGate.access_map(@company),
              module_access: CompanyModuleCatalog.access_map(@company),
              module_keys: applied
            }
          end

          overrides = Array(params[:overrides])
          changed = []

          CompanyFeatureOverride.transaction do
            overrides.each do |item|
              attrs = item.respond_to?(:permit) ? item.permit(:feature_key, :mode, :internal_note, :expires_at) : item
              feature_key = FeatureCatalog.canonical_key(attrs[:feature_key] || attrs["feature_key"])
              mode = attrs[:mode] || attrs["mode"]
              note = attrs[:internal_note] || attrs["internal_note"]
              expires_at = attrs[:expires_at] || attrs["expires_at"]
              next unless FeatureCatalog.find(feature_key)

              if mode == "block" && CompanyModuleCatalog.core_feature?(feature_key)
                raise ActiveRecord::RecordInvalid.new(
                  @company.company_feature_overrides.build(feature_key:, mode: "block").tap do |record|
                    record.errors.add(:base, "Este recurso e obrigatorio para funcionamento da loja.")
                  end
                )
              end

              if mode.blank? || mode == "default"
                @company.company_feature_overrides.where(feature_key: feature_key).destroy_all
                changed << { feature_key: feature_key, mode: "default" }
              else
                override = @company.company_feature_overrides.find_or_initialize_by(feature_key: feature_key)
                override.mode = mode
                override.internal_note = note
                override.expires_at = expires_at.presence
                override.created_by = current_user if override.new_record?
                override.save!
                changed << override.as_json_safe
              end
            end
          end

          audit!(
            "company_features_updated",
            company: @company,
            resource: @company,
            metadata: { changed: changed }
          )

          render json: { success: true, feature_access: FeatureGate.access_map(@company), changed: changed }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def update_plan
          plan = Plan.find_by!(id: params[:plan_id] || params.dig(:company, :plan_id)) if (params[:plan_id] || params.dig(:company, :plan_id)).present?
          plan ||= Plan.find_by!(slug: params[:plan_slug] || params.dig(:company, :plan_slug))
          status = params[:status] || params.dig(:company, :plan_status) || "active"
          subscription = @company.subscriptions.order(created_at: :desc).first
          previous = {
            plan_id: subscription&.plan_id,
            status: subscription&.status,
            plan_status: @company.plan_status
          }

          Subscription.transaction do
            subscription ||= @company.subscriptions.build(started_at: Time.current)
            subscription.plan = plan
            subscription.status = status
            subscription.price_cents = plan.price_cents
            subscription.current_period_start ||= Time.current
            subscription.current_period_end ||= 1.month.from_now
            subscription.save!
            @company.update!(plan_status: status, status: company_status_for_subscription(status))
          end

          audit!(
            "company_plan_updated",
            company: @company,
            resource: subscription,
            metadata: { previous: previous, current: { plan_id: plan.id, plan_slug: plan.slug, status: status } }
          )

          render json: { success: true, company: serialize_company(@company.reload), feature_access: FeatureGate.access_map(@company) }
        rescue ActiveRecord::RecordNotFound => e
          render json: { success: false, errors: [e.message] }, status: :not_found
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def admin_password
          password = params[:password].to_s
          email = params[:email].to_s.strip.downcase

          return render json: { success: false, error: "A senha deve ter pelo menos 8 caracteres" }, status: :unprocessable_entity if password.length < 8

          members = @company.company_members.includes(:user)
          member = if email.present?
            members.find { |item| item.user&.email.to_s.downcase == email }
          else
            members.find { |item| item.role == "store_admin" && item.status == "active" } ||
              members.find { |item| item.role == "store_admin" }
          end

          return render json: { success: false, error: "Admin da empresa nao encontrado" }, status: :not_found unless member&.user

          member.user.update!(password: password)
          audit!(
            "company_admin_password_reset",
            company: @company,
            resource: member.user,
            metadata: {
              target_user_id: member.user_id,
              target_email: member.user.email,
              company_member_role: member.role
            }
          )

          render json: {
            success: true,
            user: {
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              role: member.role
            }
          }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def store_settings
          setting = find_or_create_store_settings!
          render json: { success: true, settings: setting.as_company_settings_json }
        end

        def update_store_settings
          setting = find_or_create_store_settings!
          previous = setting.as_company_settings_json
          setting.apply_company_settings!(master_store_settings_params)

          audit!(
            "master_store_settings_updated",
            company: @company,
            resource: setting,
            metadata: {
              previous: previous.slice(:store_name, :primary_color, :secondary_color, :store_status, :whatsapp_mode),
              current: setting.as_company_settings_json.slice(:store_name, :primary_color, :secondary_color, :store_status, :whatsapp_mode)
            }
          )

          render json: { success: true, settings: setting.as_company_settings_json }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        def store_ai_settings
          setting = StoreAiSetting.for_company(@company)
          render json: { success: true, settings: master_store_ai_settings_json(setting) }
        end

        def update_store_ai_settings
          setting = StoreAiSetting.for_company(@company)
          previous = master_store_ai_settings_json(setting)
          setting.update!(master_store_ai_settings_params)

          audit!(
            "master_store_ai_settings_updated",
            company: @company,
            resource: setting,
            metadata: {
              previous: previous.slice(:enabled, :ai_provider, :ai_model, :ai_mode, :ai_daily_message_limit, :ai_monthly_message_limit),
              current: master_store_ai_settings_json(setting).slice(:enabled, :ai_provider, :ai_model, :ai_mode, :ai_daily_message_limit, :ai_monthly_message_limit)
            }
          )

          render json: { success: true, settings: master_store_ai_settings_json(setting) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        private

        def set_company
          @company = Company.find(params[:id])
        end

        def find_or_create_store_settings!
          @company.store_setting || @company.create_store_setting!(
            company_name: @company.name,
            trade_name: @company.name,
            store_name: @company.name,
            email: @company.responsible_email,
            whatsapp: @company.responsible_phone,
            whatsapp_number: @company.responsible_phone
          )
        end

        def store_impersonation_url(company)
          platform_domain = ENV.fetch("REPLYMESH_PLATFORM_DOMAIN", "replymesh.cloud")
                               .to_s
                               .strip
                               .sub(%r{\Ahttps?://}, "")
                               .sub(%r{/.*\z}, "")
          host = company.subdomain.presence || "#{company.slug}.#{platform_domain}"

          "https://#{host}/admin/impersonate"
        end

        def company_params
          params.require(:company).permit(
            :name, :slug, :legal_name, :document_number, :responsible_name,
            :responsible_phone, :responsible_email, :plan_slug, :status,
            :plan_status, :admin_password, :timezone, :default_locale,
            :custom_domain, :whatsapp_mode, :monthly_price_cents,
            :free_period_days, :internal_note, :contract_type
          )
        end

        def company_update_params
          params.require(:company).permit(
            :name, :slug, :legal_name, :document_number, :responsible_name,
            :responsible_phone, :responsible_email, :status, :plan_status,
            :timezone, :default_locale, :custom_domain, :custom_domain_status, :ssl_status,
            :monthly_price_cents, :free_period_days, :internal_note, :contract_type
          )
        end

        def master_store_settings_params
          params.fetch(:settings, params).permit(
            :store_name,
            :company_name,
            :trade_name,
            :description,
            :email,
            :address,
            :city,
            :state,
            :zip_code,
            :instagram,
            :facebook,
            :phone,
            :whatsapp,
            :whatsapp_number,
            :whatsapp_mode,
            :logo_url,
            :banner_url,
            :cover_url,
            :primary_color,
            :secondary_color,
            :pix_key,
            :pix_key_type,
            :pix_receiver_name,
            :minimum_order_amount,
            :estimated_delivery_minutes,
            :store_status,
            :closed_message,
            :allow_pickup,
            :block_orders_when_closed,
            :block_outside_delivery_area,
            :pix_enabled,
            :theme_primary_color,
            :hero_title,
            :hero_highlight,
            :hero_subtitle,
            :hero_image_url,
            :visual_template_id,
            accepted_payment_methods: [],
            opening_hours: {}
          )
        end

        def master_store_ai_settings_params
          attrs = params.fetch(:settings, params).permit(
            :enabled,
            :auto_reply_whatsapp,
            :ai_auto_reply_enabled,
            :ai_provider,
            :ai_model,
            :ai_mode,
            :ai_sales_mode_enabled,
            :ai_daily_message_limit,
            :ai_monthly_message_limit,
            :ai_monthly_token_limit
          ).to_h

          attrs["ai_provider"] = nil if attrs.key?("ai_provider") && attrs["ai_provider"].blank?
          attrs["ai_model"] = nil if attrs.key?("ai_model") && attrs["ai_model"].blank?
          if attrs["ai_mode"].present?
            attrs["ai_sales_mode_enabled"] = attrs["ai_mode"].in?(%w[sales_assistant auto_seller])
          end
          if attrs.key?("ai_auto_reply_enabled")
            attrs["auto_reply_whatsapp"] = ActiveModel::Type::Boolean.new.cast(attrs["ai_auto_reply_enabled"])
          end
          attrs
        end

        def master_store_ai_settings_json(setting)
          json = setting.as_json_safe
          json.merge(
            inherits_global_provider: setting.ai_provider.blank?,
            inherits_global_model: setting.ai_model.blank?,
            global: AiGlobalSetting.current.store_ai_as_json_safe
          )
        end

        def options_params
          params.fetch(:options, ActionController::Parameters.new).permit(
            :create_whatsapp_instance, :create_default_settings,
            :create_default_templates, :create_default_payment_methods,
            :enable_public_site, :enable_admin_panel, :enable_motoboy_area,
            :enable_customer_app, :enable_motoboy_app, :module_preset,
            module_keys: []
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

          logo_url = company_asset_url(company, company.store_setting&.logo_url, primary_domain:)
          banner_url = company_asset_url(company, company.store_setting&.banner_url, primary_domain:)
          cover_url = company_asset_url(company, company.store_setting&.cover_url, primary_domain:)

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
            monthly_price_cents:     company.monthly_price_cents,
            free_period_days:        company.free_period_days,
            internal_note:           company.internal_note,
            contract_type:           company.contract_type,
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
            subscription_price_cents: subscription&.price_cents,
            logo_url:                 logo_url,
            store_settings:           {
              logo_url: logo_url,
              banner_url: banner_url,
              cover_url: cover_url
            },
            feature_summary:         FeatureGate.access_map(company).slice(:allowed, :blocked),
            module_summary:          CompanyModuleCatalog.access_map(company).slice(:enabled, :disabled)
          }.merge(admin_users: serialize_admin_users(company))
        rescue StandardError => e
          Rails.logger.error("[CompaniesController] serialize_company error for #{company.id}: #{e.message}")
          { id: company.id, name: company.name, slug: company.slug, status: company.status, error: true }
        end

        def company_asset_url(company, value, primary_domain: nil)
          return if value.blank?
          return value if value.match?(/\A(?:https?:|data:|blob:)/i)

          platform_domain = ENV.fetch("REPLYMESH_PLATFORM_DOMAIN", "replymesh.cloud")
                               .to_s
                               .strip
                               .sub(%r{\Ahttps?://}, "")
                               .sub(%r{/.*\z}, "")
          host = primary_domain.presence || company.primary_domain.presence ||
                 company.subdomain.presence || "#{company.slug}.#{platform_domain}"
          path = value.start_with?("/") ? value : "/#{value}"

          "https://#{host}#{path}"
        end

        def serialize_admin_users(company)
          company.company_members.includes(:user).select { |member| member.role == "store_admin" }.map do |member|
            {
              id: member.user_id,
              name: member.user&.name,
              email: member.user&.email,
              status: member.status,
              role: member.role
            }
          end
        rescue StandardError => e
          Rails.logger.warn("[CompaniesController] serialize_admin_users error for #{company.id}: #{e.message}")
          []
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

        def company_status_for_subscription(status)
          case status
          when "active" then "active"
          when "trial" then "trial"
          when "overdue", "suspended" then "suspended"
          when "canceled" then "canceled"
          else "inactive"
          end
        end
      end
    end
  end
end
