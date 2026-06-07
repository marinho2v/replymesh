module Api
  module V1
    module Motoboy
      module Auth
        class SessionsController < ApplicationController
          def create
            company = Company.find_by(slug: login_params[:company_slug].to_s)
            return render json: { success: false, error: "Empresa nao encontrada" }, status: :not_found unless company

                motoboy = company.motoboys.active.find do |record|
                  record.phone.to_s.gsub(/\D/, "") == normalized_phone
                end
                return unauthorized unless motoboy&.user&.status == "active"

            unless motoboy.user.authenticate(login_params[:password].to_s)
              return unauthorized
            end

            token = encode_jwt(user_id: motoboy.user_id, company_id: company.id, role: "motoboy")
            motoboy.user.update!(last_sign_in_at: Time.current)

            render json: {
              success: true,
              token: token,
              motoboy: serialize_motoboy(motoboy),
                  company: {
                    id: company.id,
                    slug: company.slug,
                    name: company.store_setting&.store_name.presence || company.name,
                    logo_url: company.store_setting&.logo_url
                  }
                }
          end

          private

          def login_params
            params.require(:auth).permit(:phone, :password, :company_slug)
          rescue ActionController::ParameterMissing
            params.permit(:phone, :password, :company_slug)
          end

          def normalized_phone
            login_params[:phone].to_s.gsub(/\D/, "")
          end

          def unauthorized
            render json: { success: false, error: "Telefone ou senha invalidos" }, status: :unauthorized
          end

          def serialize_motoboy(motoboy)
                motoboy.as_json(only: %i[id name phone active is_available total_deliveries notes]).merge(
                  user_id: motoboy.user_id
                )
          end
        end
      end
    end
  end
end
