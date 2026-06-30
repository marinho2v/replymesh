module Api
  module V1
    module Master
      class PerformanceController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        def show
          render json: PerformanceMonitorService.summary
        end
      end
    end
  end
end
