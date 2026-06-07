module Api
  module V1
    module Auth
      class MeController < ApplicationController
        before_action :authenticate_user!

        def show
          render json: { success: true, user: current_user.as_json }
        end
      end
    end
  end
end
