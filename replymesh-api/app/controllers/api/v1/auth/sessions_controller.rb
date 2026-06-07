module Api
  module V1
    module Auth
      class SessionsController < ApplicationController
        before_action :authenticate_user!, only: :destroy

        def create
          user = User.find_by(email: login_params[:email].to_s.downcase)

          unless user&.status == "active" && user.authenticate(login_params[:password])
            return render json: { success: false, error: "E-mail ou senha invalidos" }, status: :unauthorized
          end

          user.update!(last_sign_in_at: Time.current)
          audit!(
            user.master_user? ? "master_login" : "login",
            user: user,
            metadata: { email: user.email, global_role: user.global_role }
          )

          render json: {
            success: true,
            token: encode_jwt(user_id: user.id),
            user: user.as_json.merge(
              company_members: user.company_members.includes(:company).map { |member|
                {
                  company_id: member.company_id,
                  company_slug: member.company.slug,
                  company_name: member.company.name,
                  role: member.role,
                  status: member.status
                }
              }
            )
          }
        end

        def destroy
          audit!(
            current_user.master_user? ? "master_logout" : "logout",
            metadata: { email: current_user.email, global_role: current_user.global_role }
          )
          render json: { success: true }
        end

        private

        def login_params
          params.require(:auth).permit(:email, :password)
        rescue ActionController::ParameterMissing
          params.permit(:email, :password)
        end
      end
    end
  end
end
