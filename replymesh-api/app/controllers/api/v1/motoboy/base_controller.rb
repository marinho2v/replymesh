module Api
  module V1
    module Motoboy
      class BaseController < ApplicationController
        before_action :authenticate_motoboy!

        attr_reader :current_motoboy, :current_company

        private

        # Decodifica JWT, valida role motoboy e resolve empresa + motoboy.
        # O JWT do motoboy inclui user_id e company_id no payload.
        def authenticate_motoboy!
          token   = request.headers["Authorization"].to_s.remove(/^Bearer\s+/)
          payload = decode_jwt(token)

          user_id    = payload["user_id"]
          company_id = payload["company_id"]

          return unauthorized! unless user_id && company_id

          user = User.find_by(id: user_id, global_role: "motoboy", status: "active")
          return unauthorized! unless user

          company = Company.find_by(id: company_id, status: "active")
          return unauthorized! unless company

          membership = CompanyMember.active.find_by(user_id: user.id, company_id: company.id, role: "motoboy")
          return unauthorized! unless membership

          motoboy = ::Motoboy.find_by(user_id: user.id, company_id: company.id, active: true)
          return unauthorized! unless motoboy

          @current_user    = user
          @current_company = company
          @current_motoboy = motoboy
        end

        def unauthorized!
          render json: { success: false, error: "Nao autorizado" }, status: :unauthorized
        end

        def render_ok(data = {}, status: :ok, **kwargs)
          render json: { success: true }.merge(data.to_h).merge(kwargs), status: status
        end

        def render_error(message, status: :unprocessable_entity)
          render json: { success: false, error: message }, status: status
        end

        def render_not_found(resource = "Recurso")
          render json: { success: false, error: "#{resource} nao encontrado" }, status: :not_found
        end
      end
    end
  end
end
