module Api
  module V1
    module Store
      class FeaturesController < BaseController
        def show
          render_ok(feature_access: FeatureGate.access_map(current_company), catalog: FeatureCatalog.serialize)
        end
      end
    end
  end
end
