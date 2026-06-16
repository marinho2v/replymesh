module Api
  module V1
    class CompanySettingsController < Store::BaseController
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
        current_company.store_setting || current_company.create_store_setting!(
          company_name: current_company.name,
          trade_name: current_company.name,
          store_name: current_company.name,
          email: current_company.responsible_email,
          whatsapp: current_company.responsible_phone,
          whatsapp_number: current_company.responsible_phone
        )
      end

      def store_admin?
        current_company_member&.role == "store_admin"
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
