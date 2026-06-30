module Api
  module V1
    module Master
      class PerformanceController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        def show
          render json: {
            cache: {
              hit: nil,
              miss: nil,
              provider: Rails.cache.class.name,
              debug_enabled: Rails.env.development? || ENV["REPLYMESH_CACHE_DEBUG"].to_s == "1"
            },
            queries: {
              average_ms: nil,
              slowest_endpoint: nil,
              total_count: nil
            },
            responses: {
              average_ms: nil,
              slowest_endpoint: nil
            },
            companies: {
              most_accessed: nil
            },
            status: "prepared"
          }
        end
      end
    end
  end
end
