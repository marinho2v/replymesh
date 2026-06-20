module Api
  module V1
    module Master
      class BrandingController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        def show
          render json: { success: true, branding: MasterBrandSetting.current.as_json_safe }
        end

        def update
          setting = MasterBrandSetting.current
          if setting.update(brand_attributes_for(setting))
            audit!("master_branding_updated", resource: setting, metadata: setting.as_json_safe)
            render json: { success: true, branding: setting.as_json_safe }
          else
            render json: { success: false, errors: setting.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def branding_params
          params.require(:branding).permit(
            :platform_name, :light_logo_url, :dark_logo_url, :favicon_url,
            :primary_color, :secondary_color, :support_email, :support_whatsapp,
            :support_location, :instagram_url, :facebook_url, :youtube_url,
            :landing_logo_url, :landing_hero_image_url,
            landing_clients: %i[name type logo_url site_url]
          )
        end

        def brand_attributes_for(setting)
          branding_params.to_h.slice(*setting.attribute_names)
        end
      end
    end
  end
end
