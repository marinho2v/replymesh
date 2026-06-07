module Api
  module V1
    module Store
      class StoreAiController < BaseController
        def settings
          render_ok(settings: setting.as_json_safe)
        end

        def update_settings
          if setting.update(setting_params)
            render_ok(settings: setting.as_json_safe)
          else
            render_record_errors(setting)
          end
        end

        def simulate
          result = StoreAiService.call(
            company: current_company,
            user: current_user,
            question: params[:message] || params[:question],
            phone: params[:phone],
            simulate: true
          )
          render_ok(result)
        end

        private

        def setting
          @setting ||= StoreAiSetting.for_company(current_company)
        end

        def setting_params
          params.require(:settings).permit(
            :enabled, :auto_reply_whatsapp, :assistant_name, :initial_message, :tone, :model, :daily_limit,
            :allow_orders, :allow_products, :allow_hours, :allow_promotions, :allow_order_status
          )
        end

      end
    end
  end
end
