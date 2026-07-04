module Api
  module V1
    module Store
      class CustomerIntelligenceController < BaseController
        before_action -> { require_feature!("customers") }

        def show
          render_ok(CustomerIntelligenceService.call(company: current_company))
        end
      end
    end
  end
end
