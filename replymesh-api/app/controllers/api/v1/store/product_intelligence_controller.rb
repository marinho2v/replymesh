module Api
  module V1
    module Store
      class ProductIntelligenceController < BaseController
        before_action -> { require_feature!("products") }

        # GET /api/v1/store/product_intelligence
        def show
          render_ok(ProductIntelligenceService.call(company: current_company))
        end
      end
    end
  end
end
