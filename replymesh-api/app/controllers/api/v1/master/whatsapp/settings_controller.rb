module Api
  module V1
    module Master
      module Whatsapp
        class SettingsController < ApplicationController
          before_action :authenticate_user!
          before_action :require_super_admin!

          def test_connection
            result = EvolutionGoClient.new.test_connection
            audit!("evolution_connection_tested", metadata: { success: true, instances_count: result[:instances_count] })
            render json: { success: true, result: result.except(:raw_status, "raw_status") }
          rescue EvolutionGoClient::Error => e
            audit!("evolution_error", metadata: { success: false, error: e.message })
            system_alert!(level: "error", title: "Falha ao testar Evolution Go", message: e.message)
            render json: { success: false, errors: [e.message] }, status: :bad_gateway
          end
        end
      end
    end
  end
end
