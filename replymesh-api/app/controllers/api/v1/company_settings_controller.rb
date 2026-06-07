module Api
  module V1
    class CompanySettingsController < ApplicationController
      before_action :authenticate_user!

      def show
        setting = find_or_create_settings!
        return if performed?

        render json: { success: true, settings: setting.as_company_settings_json }
      end

      def update
        setting = find_or_create_settings!
        return if performed?

        previous = setting.as_company_settings_json
        setting.apply_company_settings!(settings_params)
        audit!(
          "store_settings_updated",
          company: setting.company,
          resource: setting,
          metadata: {
            previous: previous.slice(:company_name, :trade_name, :primary_color, :secondary_color, :pix_enabled),
            current: setting.as_company_settings_json.slice(:company_name, :trade_name, :primary_color, :secondary_color, :pix_enabled)
          }
        )

        render json: { success: true, settings: setting.as_company_settings_json }
      rescue ActiveRecord::RecordInvalid => e
        system_alert!(
          level: "error",
          title: "Falha ao atualizar configuracoes da empresa",
          message: e.record.errors.full_messages.join(", "),
          company: e.record.respond_to?(:company) ? e.record.company : nil
        )
        render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      private

      def find_or_create_settings!
        company = current_company_for_settings!
        return if company.blank?

        company.store_setting || company.create_store_setting!(
          company_name: company.name,
          trade_name: company.name,
          store_name: company.name,
          email: company.responsible_email,
          whatsapp: company.responsible_phone,
          whatsapp_number: company.responsible_phone
        )
      end

      def current_company_for_settings!
        if current_user.super_admin?
          company_id = params[:company_id].presence || params.dig(:settings, :company_id).presence || request.headers["X-Company-Id"].presence
          return ::Company.find(company_id) if company_id.present?

          return ::Company.order(:id).first if ::Company.exists?
        end

        membership = current_user.company_members.includes(:company).find_by(status: "active")
        return membership.company if membership

        render json: { success: false, error: "Empresa nao encontrada para o usuario atual" }, status: :not_found
        nil
      end

      def settings_params
        params.fetch(:settings, params).permit(
          :company_id,
          :store_name,
          :company_name,
          :trade_name,
          :logo_url,
          :banner_url,
          :primary_color,
          :secondary_color,
          :phone,
          :whatsapp,
          :whatsapp_number,
          :instagram,
          :facebook,
          :email,
          :address,
          :city,
          :state,
          :zip_code,
          :delivery_fee,
          :delivery_fee_default,
          :free_delivery_above,
          :minimum_order_amount,
          :store_status,
          :closed_message,
          :allow_pickup,
          :block_outside_delivery_area,
          :block_orders_when_closed,
          :average_delivery_time,
          :estimated_delivery_minutes,
          :pix_enabled,
          :pix_key,
          :pix_key_type,
          :pix_receiver_name,
          :pix_receiver_city,
          :pix_payload,
          :pix_qr_code_url,
          :print_footer,
          :default_support_message,
          :default_order_message,
          :recurring_customer_min_orders,
          :order_message_template,
          :visual_template_id,
          :hero_title,
          :hero_highlight,
          :hero_subtitle,
          :hero_image_url,
          :hero_image_position,
          :hero_image_zoom,
          :hero_overlay_opacity,
          :hero_height,
          :theme_primary_color,
          :pix_provider,
          :mercadopago_public_key,
          :mercadopago_access_token,
          :mercadopago_webhook_secret,
          :mercadopago_enabled,
          opening_hours: {},
          accepted_payment_methods: []
        )
      end
    end
  end
end
