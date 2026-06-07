module Api
  module V1
    module Master
      class NotificationsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        # GET /api/v1/master/notifications
        def index
          scope = Notification.where(company_id: nil)
            .order(created_at: :desc)
            .limit(50)

          unread_count = Notification.where(company_id: nil).unread.count

          render json: {
            success: true,
            notifications: scope.map(&:as_notification_json),
            unread_count: unread_count
          }
        end

        # PATCH /api/v1/master/notifications/:id/read
        def mark_read
          notification = Notification.where(company_id: nil).find(params[:id])
          notification.mark_read!
          render json: { success: true, notification: notification.as_notification_json }
        rescue ActiveRecord::RecordNotFound
          render json: { success: false, error: "Notificacao nao encontrada" }, status: :not_found
        end

        # PATCH /api/v1/master/notifications/read_all
        def read_all
          Notification.where(company_id: nil).unread.update_all(read_at: Time.current)
          render json: { success: true, message: "Todas as notificacoes marcadas como lidas" }
        end
      end
    end
  end
end
