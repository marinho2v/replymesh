module Api
  module V1
    module Store
      class BusinessIntelligenceController < BaseController
        before_action -> { require_feature!("dashboard") }

        # GET /api/v1/store/business_intelligence
        def show
          render_ok(BusinessIntelligenceService.call(company: current_company))
        end
      end
    end
  end
end
