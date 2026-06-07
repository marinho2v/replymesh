module Api
  module V1
    module Master
      class AuditLogsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        def index
          scope = filtered_scope.includes(:actor, :company).recent
          logs = scope.limit(limit)

          render json: {
            success: true,
            metrics: {
              total_count: MasterAuditLog.count,
              today_count: MasterAuditLog.where(created_at: Time.current.all_day).count,
              denied_count: MasterAuditLog.where(status: "denied").count,
              impersonation_count: MasterAuditLog.where(module_name: "impersonation").count
            },
            filters: {
              actions: MasterAuditLog.distinct.order(:action).pluck(:action),
              modules: MasterAuditLog.distinct.order(:module_name).pluck(:module_name),
              users: User.where(id: MasterAuditLog.where.not(actor_id: nil).select(:actor_id))
                         .order(:name).pluck(:id, :name, :email)
            },
            audit_logs: logs.map { |log| serialize(log) }
          }
        end

        private

        def filtered_scope
          scope = MasterAuditLog.all
          scope = scope.where(actor_id: params[:user_id]) if params[:user_id].present?
          scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?
          scope = scope.where(action: params[:log_action]) if params[:log_action].present?
          scope = scope.where(module_name: params[:module_name]) if params[:module_name].present?
          scope = scope.where(status: params[:status]) if params[:status].present?
          scope = scope.where("created_at >= ?", Time.zone.parse(params[:date_from]).beginning_of_day) if params[:date_from].present?
          scope = scope.where("created_at <= ?", Time.zone.parse(params[:date_to]).end_of_day) if params[:date_to].present?
          scope
        rescue ArgumentError
          scope
        end

        def serialize(log)
          {
            id: log.id,
            action: log.action,
            module_name: log.module_name,
            status: log.status,
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            metadata: scrub_sensitive(log.metadata || {}),
            created_at: log.created_at,
            actor: {
              id: log.actor_id,
              name: log.actor_name,
              email: log.actor_email
            },
            company: log.company_id && {
              id: log.company_id,
              name: log.company_name
            }
          }
        end

        def limit
          [[params.fetch(:limit, 200).to_i, 1].max, 500].min
        end
      end
    end
  end
end
