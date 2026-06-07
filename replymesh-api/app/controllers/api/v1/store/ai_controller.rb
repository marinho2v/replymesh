module Api
  module V1
    module Store
      class AiController < BaseController
        def settings
          render_ok(settings: AiGlobalSetting.current.as_json_public)
        end

        def chat
          result = CarinaAssistantService.call(
            company: current_company,
            user: current_user,
            question: params[:message] || params[:question],
            page: params[:page]
          )

          render_ok(result)
        end
      end
    end
  end
end
