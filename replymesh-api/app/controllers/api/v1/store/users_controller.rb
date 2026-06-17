module Api
  module V1
    module Store
      class UsersController < BaseController
        before_action :set_member, only: %i[update destroy]

        ROLE_MAP = {
          "owner" => "store_admin",
          "admin" => "store_admin",
          "cashier" => "cashier",
          "caixa" => "cashier",
          "attendant" => "employee",
          "employee" => "employee",
          "waiter" => "waiter",
          "garcom" => "waiter",
          "kitchen" => "kitchen",
          "motoboy" => "motoboy"
        }.freeze

        def index
          members = current_company.company_members.includes(:user).order(created_at: :desc)
          render_ok(users: members.map { |member| serialize(member) })
        end

        def create
          user = User.find_or_initialize_by(email: user_params[:email].to_s.downcase)
          user.name = user_params[:full_name].presence || user_params[:name].presence || user.email
          user.phone = user_params[:phone] if user_params.key?(:phone)
          user.global_role = normalized_role == "motoboy" ? "motoboy" : "user"
          user.status = active_param? ? "active" : "inactive"
          user.password = user_params[:password] if user.new_record? || user_params[:password].present?

          ActiveRecord::Base.transaction do
            user.save!
            member = current_company.company_members.find_or_initialize_by(user: user)
            member.role = normalized_role
            member.status = active_param? ? "active" : "inactive"
            member.save!
            render_created(user: serialize(member))
          end
        rescue ActiveRecord::RecordInvalid => e
          render_record_errors(e.record)
        end

        def update
          ActiveRecord::Base.transaction do
            @member.user.update!(user_update_params)
            @member.update!(role: normalized_role, status: active_param? ? "active" : "inactive")
            render_ok(user: serialize(@member.reload))
          end
        rescue ActiveRecord::RecordInvalid => e
          render_record_errors(e.record)
        end

        def destroy
          @member.update!(status: "inactive")
          release_or_disable_user!(@member.user)
          render_ok(user: serialize(@member.reload), message: "Usuario desativado")
        end

        private

        def set_member
          @member = current_company.company_members.includes(:user).find_by(user_id: params[:id])
          @member ||= current_company.company_members.includes(:user).find_by(id: params[:id])
          render_not_found("Usuario") unless @member
        end

        def user_params
          params.fetch(:user, params).permit(:full_name, :name, :email, :phone, :password, :role, :is_active, :status)
        end

        def user_update_params
          permitted = {}
          permitted[:name] = user_params[:full_name].presence || user_params[:name] if user_params[:full_name].present? || user_params[:name].present?
          permitted[:phone] = user_params[:phone] if user_params.key?(:phone)
          permitted[:password] = user_params[:password] if user_params[:password].present?
          permitted[:status] = active_param? ? "active" : "inactive"
          permitted
        end

        def normalized_role
          ROLE_MAP.fetch(user_params[:role].to_s, "employee")
        end

        def public_role(member)
          case member.role
          when "store_admin" then "admin"
          when "cashier" then "cashier"
          when "waiter" then "waiter"
          when "kitchen" then "kitchen"
          when "motoboy" then "motoboy"
          else "attendant"
          end
        end

        def active_param?
          return user_params[:status] == "active" if user_params.key?(:status)
          return ActiveModel::Type::Boolean.new.cast(user_params[:is_active]) if user_params.key?(:is_active)

          true
        end

        def release_or_disable_user!(user)
          return if user.master_user?
          return if user.company_members.active.exists?

          user.release_email_for_reuse!
        end

        def serialize(member)
          user = member.user
          {
            id: user.id,
            member_id: member.id,
            full_name: user.name,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: public_role(member),
            company_member_role: member.role,
            is_active: member.status == "active" && user.status == "active",
            status: member.status,
            created_at: user.created_at,
            updated_at: user.updated_at
          }
        end
      end
    end
  end
end
