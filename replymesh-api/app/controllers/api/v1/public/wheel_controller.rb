module Api
  module V1
    module Public
      class WheelController < BaseController
        def profile
          render_ok(WheelService.new(company: current_company).profile(phone: params[:phone]))
        end

        def prizes
          render_ok(prizes: WheelService.new(company: current_company).public_prizes)
        end

        def spin
          result = WheelService.spin(company: current_company, phone: params[:phone])
          render_ok(result.payload.merge(success: result.success?, message: result.message))
        end
      end
    end
  end
end
