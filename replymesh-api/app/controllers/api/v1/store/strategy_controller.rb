module Api
  module V1
    module Store
      class StrategyController < BaseController
        before_action -> { require_feature!("dashboard") }

        # GET /api/v1/store/strategy
        def show
          render_ok(ReplymeshStrategyService.call(company: current_company))
        end
      end
    end
  end
end
