module Api
  module V1
    module Public
      class PlatformController < ApplicationController
        skip_before_action :authenticate_user!, raise: false

        def show
          render json: { success: true, branding: MasterBrandSetting.current.as_json_safe }
        end
      end
    end
  end
end
