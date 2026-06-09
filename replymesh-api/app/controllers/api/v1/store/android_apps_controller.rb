module Api
  module V1
    module Store
      class AndroidAppsController < BaseController
        before_action -> { require_feature!("motoboy_app") }

        def show
          render_ok(android_app: current_company.android_app_request&.as_json_safe)
        end

        def create
          request_record = current_company.android_app_request || current_company.build_android_app_request
          request_record.assign_attributes(android_app_params)
          request_record.status ||= "requested"
          request_record.requested_at ||= Time.current
          request_record.save!
          render_created(android_app: request_record.as_json_safe)
        rescue ActiveRecord::RecordInvalid => e
          render_error(e.record.errors.full_messages.first)
        end

        private

        def android_app_params
          params.require(:android_app).permit(:app_name, :display_name, :logo_url, :icon_url, :splash_url, :primary_color, :secondary_color, :support_whatsapp, :notes)
        end
      end
    end
  end
end
