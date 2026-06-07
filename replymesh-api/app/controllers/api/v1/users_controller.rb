module Api
  module V1
    class UsersController < ApplicationController
      before_action :authenticate_user!

      def me
        render json: { success: true, user: current_user.as_json }
      end
    end
  end
end
