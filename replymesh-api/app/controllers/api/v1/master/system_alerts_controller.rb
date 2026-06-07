module Api
  module V1
    module Master
      class SystemAlertsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_alert, only: %i[show resolve]

        def index
          alerts = filtered_scope.includes(:company, :resolved_by).order(resolved_at: :asc, created_at: :desc).limit(limit)

          render json: {
            success: true,
            metrics: metrics,
            system_alerts: alerts.map { |alert| serialize_alert(alert) }
          }
        end

        def show
          render json: { success: true, system_alert: serialize_alert(@alert) }
        end

        def resolve
          @alert.update!(resolved_at: Time.current, resolved_by: current_user)
          audit!(
            "system_alert_resolved",
            company: @alert.company,
            resource: @alert,
            metadata: { level: @alert.level, title: @alert.title }
          )

          render json: { success: true, system_alert: serialize_alert(@alert) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
        end

        private

        def set_alert
          @alert = SystemAlert.includes(:company, :resolved_by).find(params[:id])
        end

        def filtered_scope
          scope = SystemAlert.all
          scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?
          scope = scope.where(level: params[:level]) if params[:level].present?
          scope = scope.where("created_at >= ?", Time.zone.parse(params[:date_from]).beginning_of_day) if params[:date_from].present?
          scope = scope.where("created_at <= ?", Time.zone.parse(params[:date_to]).end_of_day) if params[:date_to].present?

          case params[:status]
          when "resolved"
            scope.resolved
          when "pending", "unresolved"
            scope.unresolved
          else
            scope
          end
        rescue ArgumentError
          scope
        end

        def metrics
          {
            total_count: SystemAlert.count,
            critical_count: SystemAlert.where(level: "critical", resolved_at: nil).count,
            error_count: SystemAlert.where(level: "error", resolved_at: nil).count,
            pending_count: SystemAlert.unresolved.count,
            resolved_count: SystemAlert.resolved.count
          }
        end

        def serialize_alert(alert)
          {
            id: alert.id,
            level: alert.level,
            title: alert.title,
            message: alert.message,
            status: alert.resolved? ? "resolved" : "pending",
            metadata_json: scrub_sensitive(alert.metadata_json || {}),
            resolved_at: alert.resolved_at,
            created_at: alert.created_at,
            updated_at: alert.updated_at,
            resolved_by: alert.resolved_by && {
              id: alert.resolved_by.id,
              name: alert.resolved_by.name,
              email: alert.resolved_by.email
            },
            company: alert.company && {
              id: alert.company.id,
              name: alert.company.name,
              slug: alert.company.slug,
              status: alert.company.status
            }
          }
        end

        def limit
          [[params.fetch(:limit, 100).to_i, 1].max, 300].min
        end
      end
    end
  end
end
