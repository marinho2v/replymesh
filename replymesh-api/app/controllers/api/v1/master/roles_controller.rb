module Api
  module V1
    module Master
      class RolesController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_role, only: :update

        def index
          render json: {
            success: true,
            roles: MasterRole.order(:name).map(&:as_json_safe),
            permission_keys: MasterRole::PERMISSION_KEYS
          }
        end

        def create
          role = MasterRole.new(role_params)
          if role.save
            audit!("master_role_created", resource: role, metadata: role.as_json_safe)
            render json: { success: true, role: role.as_json_safe }, status: :created
          else
            render json: { success: false, errors: role.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @role.update(role_params)
            audit!("master_role_updated", resource: @role, metadata: @role.as_json_safe)
            render json: { success: true, role: @role.as_json_safe }
          else
            render json: { success: false, errors: @role.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def set_role
          @role = MasterRole.find(params[:id])
        end

        def role_params
          permitted = params.require(:role).permit(:name, :key, :description, :status, permissions: {})
          permitted[:permissions] = permitted[:permissions].to_h.transform_values { |value| ActiveModel::Type::Boolean.new.cast(value) } if permitted[:permissions]
          permitted
        end
      end
    end
  end
end
