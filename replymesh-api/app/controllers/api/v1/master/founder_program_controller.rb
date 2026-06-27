module Api
  module V1
    module Master
      class FounderProgramController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        def show
          render json: payload
        end

        def update
          setting = FounderProgramSetting.current
          attributes = params.require(:founder_program).permit(
            :enabled, :allow_signups, :signup_limit, :started_at, :ends_at, default_modules: []
          )
          if setting.update(attributes)
            audit!("founder_program_updated", resource: setting, metadata: attributes.to_h)
            render json: payload
          else
            render json: { success: false, errors: setting.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def payload
          setting = FounderProgramSetting.current
          {
            success: true,
            founder_program: setting.attributes.merge(
              registered: setting.founder_count,
              remaining: setting.remaining,
              accepting_signups: setting.open?
            ),
            module_catalog: CompanyModuleCatalog.serialize,
            companies: Company.where(origin: "founder_program").order(founder_registered_at: :desc).map do |company|
              {
                id: company.id,
                name: company.name,
                slug: company.slug,
                status: company.status,
                commercial_status: company.commercial_status,
                founder_registered_at: company.founder_registered_at
              }
            end
          }
        end
      end
    end
  end
end
