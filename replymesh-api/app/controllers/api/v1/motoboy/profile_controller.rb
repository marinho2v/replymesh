module Api
  module V1
    module Motoboy
      class ProfileController < BaseController
        def show
          render_ok(
            motoboy: serialize_motoboy(current_motoboy),
            company: {
              id: current_company.id,
              slug: current_company.slug,
              name: current_company.store_setting&.store_name.presence || current_company.name,
              logo_url: current_company.store_setting&.logo_url
            }
          )
        end

        private

        def serialize_motoboy(motoboy)
          motoboy.as_json(only: %i[id name phone active is_available total_deliveries notes created_at updated_at])
        end
      end
    end
  end
end
