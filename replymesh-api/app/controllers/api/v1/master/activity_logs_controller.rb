module Api
  module V1
    module Master
      class ActivityLogsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        def index
          logs = filtered_scope.includes(:company, :user).order(created_at: :desc).limit(limit)

          render json: {
            success: true,
            metrics: metrics,
            activity_logs: logs.map { |log| serialize_log(log) }
          }
        end

        private

        def filtered_scope
          scope = ActivityLog.all
          scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?
          scope = scope.where(action: params[:log_action]) if params[:log_action].present?
          scope = scope.where(resource_type: params[:resource_type]) if params[:resource_type].present?
          scope = scope.where("created_at >= ?", Time.zone.parse(params[:date_from]).beginning_of_day) if params[:date_from].present?
          scope = scope.where("created_at <= ?", Time.zone.parse(params[:date_to]).end_of_day) if params[:date_to].present?
          scope = scope.where(action: actions_for_type(params[:type])) if params[:type].present? && actions_for_type(params[:type]).any?
          scope
        rescue ArgumentError
          scope
        end

        def actions_for_type(type)
          {
            "erros" => %w[
              error store_request_error system_alert_created onboarding_failed
              evolution_error whatsapp_error webhook_failed automation_failed
            ],
            "webhooks" => %w[webhook_received webhook_failed webhook_processed],
            "evolution" => %w[
              whatsapp_instance_created whatsapp_instance_status_checked whatsapp_instance_qrcode_requested
              whatsapp_instance_disconnected whatsapp_instance_restarted whatsapp_instance_deleted
              whatsapp_template_created whatsapp_template_updated evolution_connection_tested
            ],
            "automacoes" => %w[automation_started automation_completed automation_failed],
            "atividades" => []
          }.fetch(type.to_s, [])
        end

        def metrics
          {
            total_count: ActivityLog.count,
            today_count: ActivityLog.where(created_at: Time.current.beginning_of_day..Time.current.end_of_day).count,
            company_count: ActivityLog.where.not(company_id: nil).count,
            evolution_count: ActivityLog.where(action: actions_for_type("evolution")).count,
            error_count: ActivityLog.where(action: actions_for_type("erros")).count
          }
        end

        def serialize_log(log)
          metadata = scrub_sensitive(log.metadata_json || {})
          {
            id: log.id,
            action: log.action,
            action_label: label_for(log.action),
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            http_status: metadata["status"] || metadata[:status],
            error_message: metadata["error_message"] || metadata[:error_message],
            request_path: metadata["path"] || metadata[:path],
            metadata_json: metadata,
            created_at: log.created_at,
            user: log.user && {
              id: log.user.id,
              name: log.user.name,
              email: log.user.email,
              global_role: log.user.global_role
            },
            company: log.company && {
              id: log.company.id,
              name: log.company.name,
              slug: log.company.slug,
              status: log.company.status
            }
          }
        end

        def label_for(action)
          return "Erro operacional da loja" if action == "store_request_error"

          action.to_s.tr("_", " ").capitalize
        end

        def limit
          [[params.fetch(:limit, 100).to_i, 1].max, 300].min
        end
      end
    end
  end
end
