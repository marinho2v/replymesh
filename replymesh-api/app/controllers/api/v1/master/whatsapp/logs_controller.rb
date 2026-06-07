module Api
  module V1
    module Master
      module Whatsapp
        class LogsController < ApplicationController
          before_action :authenticate_user!
          before_action :require_super_admin!

          def index
            logs = WhatsappLog.includes(:company, :whatsapp_instance).order(created_at: :desc).limit(300)
            logs = logs.where(level: params[:level]) if params[:level].present? && WhatsappLog::LEVELS.include?(params[:level])
            logs = logs.where(company_id: params[:company_id]) if params[:company_id].present?

            render json: { success: true, logs: logs.map { |log| serialize_log(log) } }
          end

          private

          def serialize_log(log)
            {
              id: log.id,
              level: log.level,
              message: log.message,
              metadata_json: log.metadata_json || {},
              created_at: log.created_at,
              company: {
                id: log.company.id,
                name: log.company.name,
                slug: log.company.slug
              },
              instance: log.whatsapp_instance && {
                id: log.whatsapp_instance.id,
                instance_name: log.whatsapp_instance.instance_name,
                status: log.whatsapp_instance.status
              }
            }
          end
        end
      end
    end
  end
end
