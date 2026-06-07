module Api
  module V1
    module Master
      class AndroidAppsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_request, only: %i[show update update_status]

        def index
          records = AndroidAppRequest.includes(:company, :responsible).recent
          render json: { success: true, android_apps: records.map { |item| serialize(item) } }
        end

        def show
          render json: { success: true, android_app: serialize(@request_record) }
        end

        def update
          @request_record.update!(update_params)
          audit_change!
          render json: { success: true, android_app: serialize(@request_record) }
        end

        def update_status
          @request_record.status = params.require(:status)
          @request_record.responsible = current_user
          @request_record.approved_at ||= Time.current if %w[in_development publishing published].include?(@request_record.status)
          @request_record.published_at ||= Time.current if @request_record.status == "published"
          @request_record.save!
          audit_change!
          render json: { success: true, android_app: serialize(@request_record) }
        rescue ActiveRecord::RecordInvalid => e
          render json: { success: false, error: e.record.errors.full_messages.first }, status: :unprocessable_entity
        end

        private

        def set_request
          @request_record = AndroidAppRequest.find(params[:id])
        end

        def update_params
          params.require(:android_app).permit(:notes, :responsible_id, :status)
        end

        def serialize(item)
          item.as_json_safe.merge(company: { id: item.company.id, name: item.company.name, slug: item.company.slug, plan_status: item.company.plan_status })
        end

        def audit_change!
          MasterAuditLogService.record!(actor: current_user, action: "android_app_updated", company: @request_record.company, resource: @request_record, metadata: { status: @request_record.status }, request: request)
        end
      end
    end
  end
end
