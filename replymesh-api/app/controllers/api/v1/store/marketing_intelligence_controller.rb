module Api
  module V1
    module Store
      class MarketingIntelligenceController < BaseController
        before_action -> { require_feature!("marketing_whatsapp") }

        # GET /api/v1/store/marketing_intelligence
        def show
          render_ok(MarketingIntelligenceService.call(company: current_company))
        end
      end
    end
  end
end
