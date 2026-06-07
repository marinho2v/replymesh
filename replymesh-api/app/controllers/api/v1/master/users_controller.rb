module Api
  module V1
    module Master
      class UsersController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_user, only: %i[update update_status reset_password destroy]

        def index
          users = User.includes(:master_role)
            .where("global_role = ? OR master_role_id IS NOT NULL", "super_admin")
            .order(created_at: :desc)
          render json: { success: true, users: users.map { |user| serialize(user) } }
        end

        def create
          user = User.new(user_params)
          user.global_role = "user"
          user.password = params.dig(:user, :password).presence || SecureRandom.base58(14)
          user.status ||= "active"
          return render json: { success: false, error: "Funcao master obrigatoria" }, status: :unprocessable_entity if user.master_role_id.blank?

          if user.save
            audit!("master_user_created", resource: user, metadata: safe_user_metadata(user))
            render json: { success: true, user: serialize(user) }, status: :created
          else
            render json: { success: false, errors: user.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @user.update(user_params)
            audit!("master_user_updated", resource: @user, metadata: safe_user_metadata(@user))
            render json: { success: true, user: serialize(@user) }
          else
            render json: { success: false, errors: @user.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update_status
          status = params[:status].to_s
          return render json: { success: false, error: "Status invalido" }, status: :unprocessable_entity unless User::STATUSES.include?(status)
          return render json: { success: false, error: "Voce nao pode desativar a propria conta" }, status: :unprocessable_entity if @user == current_user && status != "active"

          @user.update!(status: status)
          audit!("master_user_status_updated", resource: @user, metadata: safe_user_metadata(@user))
          render json: { success: true, user: serialize(@user) }
        end

        def reset_password
          password = params[:password].to_s
          return render json: { success: false, error: "A senha deve ter pelo menos 8 caracteres" }, status: :unprocessable_entity if password.length < 8

          @user.update!(password: password)
          audit!("master_user_password_reset", resource: @user, metadata: { target_user_id: @user.id })
          render json: { success: true, message: "Senha redefinida com sucesso" }
        end

        def destroy
          return render json: { success: false, error: "Voce nao pode excluir a propria conta" }, status: :unprocessable_entity if @user == current_user
          return render json: { success: false, error: "Super admin deve ser apenas desativado com validacao manual" }, status: :unprocessable_entity if @user.super_admin?

          @user.update!(status: "inactive", master_role: nil)
          audit!("master_user_safely_removed", resource: @user, metadata: { target_user_id: @user.id })
          render json: { success: true, user: serialize(@user), message: "Usuario removido do acesso master" }
        end

        private

        def set_user
          @user = User.find(params[:id])
          return if @user.master_user?

          render json: { success: false, error: "Usuario nao pertence a equipe master" }, status: :not_found
        end

        def user_params
          params.require(:user).permit(:name, :email, :phone, :avatar_url, :master_role_id, :status)
        end

        def serialize(user)
          user.as_json.merge(
            role_name: user.super_admin? ? "Super Admin" : user.master_role&.name,
            super_admin: user.super_admin?
          )
        end

        def safe_user_metadata(user)
          { target_user_id: user.id, email: user.email, status: user.status, master_role_id: user.master_role_id }
        end
      end
    end
  end
end
