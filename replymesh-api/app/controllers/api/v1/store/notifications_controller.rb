module Api
  module V1
    module Store
      class NotificationsController < Store::BaseController
        # GET /api/v1/store/notifications
        def index
          scope = company_scope(Notification)
            .order(created_at: :desc)
            .limit(50)

          unread_count = company_scope(Notification).unread.count

          render_ok(
            notifications: scope.map(&:as_notification_json),
            unread_count: unread_count
          )
        end

        # PATCH /api/v1/store/notifications/:id/read
        def mark_read
          notification = company_scope(Notification).find(params[:id])
          notification.mark_read!
          render_ok(notification: notification.as_notification_json)
        rescue ActiveRecord::RecordNotFound
          render_not_found("Notificacao nao encontrada")
        end

        # PATCH /api/v1/store/notifications/read_all
        def read_all
          company_scope(Notification).unread.update_all(read_at: Time.current)
          render_ok(message: "Todas as notificacoes marcadas como lidas")
        end

        # DELETE /api/v1/store/notifications/clear_all
        def clear_all
          removed_count = company_scope(Notification).delete_all
          render_ok(message: "Notificacoes removidas", removed_count: removed_count)
        end
      end
    end
  end
end
