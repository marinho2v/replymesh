module Api
  module V1
    module Master
      class DashboardController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        def show
          render json: MasterDashboardService.new(period: params[:period]).call
        end
      end
    end
  end
end
