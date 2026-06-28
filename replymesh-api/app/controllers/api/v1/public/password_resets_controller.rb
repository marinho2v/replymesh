module Api
  module V1
    module Public
      class PasswordResetsController < ApplicationController
        def create
          render_result PasswordResetService.start(
            email: params[:email],
            company_slug: params[:company_slug],
            request:
          )
        end

        def verify
          render_result PasswordResetService.verify(reset_id: params[:reset_id], code: params[:code])
        end

        def reset
          render_result PasswordResetService.reset_password(
            reset_id: params[:reset_id],
            code: params[:code],
            password: params[:password],
            password_confirmation: params[:password_confirmation]
          )
        end

        private

        def render_result(result)
          if result.success?
            render json: { success: true }.merge(result.payload)
          else
            render json: { success: false, errors: result.errors }.merge(result.payload), status: :unprocessable_entity
          end
        end
      end
    end
  end
end
