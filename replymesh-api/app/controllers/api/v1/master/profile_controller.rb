module Api
  module V1
    module Master
      class ProfileController < ApplicationController
        before_action :authenticate_user!
        before_action :require_master_user!

        def show
          render json: { success: true, profile: current_user.as_json }
        end

        def update
          if current_user.update(profile_params)
            audit!("master_profile_updated", resource: current_user, metadata: { email: current_user.email })
            render json: { success: true, profile: current_user.as_json }
          else
            render json: { success: false, errors: current_user.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update_password
          unless current_user.authenticate(params[:current_password].to_s)
            return render json: { success: false, error: "Senha atual incorreta" }, status: :unprocessable_entity
          end

          new_password = params[:new_password].to_s
          confirmation = params[:password_confirmation].to_s
          return render json: { success: false, error: "A nova senha deve ter pelo menos 8 caracteres" }, status: :unprocessable_entity if new_password.length < 8
          return render json: { success: false, error: "A confirmacao da senha nao confere" }, status: :unprocessable_entity unless new_password == confirmation

          current_user.update!(password: new_password)
          audit!("master_profile_password_updated", resource: current_user)
          render json: { success: true, message: "Senha alterada com sucesso" }
        end

        private

        def profile_params
          params.require(:profile).permit(:name, :email, :phone, :avatar_url)
        end
      end
    end
  end
end
