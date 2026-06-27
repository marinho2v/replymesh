module Api
  module V1
    module Public
      class FounderSignupsController < ApplicationController
        def status
          render json: { success: true, program: FounderProgramSetting.current.as_public_json }
        end

        def create
          render_result FounderSignupService.start(signup_params, request:)
        end

        def verify
          render_result FounderSignupService.verify(id: params[:signup_id], code: params[:code])
        end

        def resend
          render_result FounderSignupService.resend(params[:signup_id])
        end

        private

        def signup_params
          params.require(:signup).permit(
            :responsible_name, :email, :phone, :password, :password_confirmation,
            :company_name, :business_type, :city, :state, :slug, :accepted_terms, :website
          )
        end

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
