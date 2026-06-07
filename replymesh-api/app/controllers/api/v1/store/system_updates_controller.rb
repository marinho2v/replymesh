module Api
  module V1
    module Store
      class SystemUpdatesController < BaseController
        before_action :set_update, only: %i[show mark_read]

        def index
          updates = visible_updates
          reads = SystemUpdateRead.where(
            system_update_id: updates.map(&:id),
            company_id: current_company.id,
            user_id: current_user.id
          ).index_by(&:system_update_id)

          render_ok(
            system_updates: updates.map { |item| serialize(item, reads[item.id]) },
            unread_count: updates.count { |item| reads[item.id].nil? }
          )
        end

        def show
          read = SystemUpdateRead.find_by(
            system_update: @system_update,
            company: current_company,
            user: current_user
          )
          render_ok(system_update: serialize(@system_update, read))
        end

        def mark_read
          read = SystemUpdateRead.find_or_create_by!(
            system_update: @system_update,
            company: current_company,
            user: current_user
          ) { |record| record.read_at = Time.current }

          company_scope(Notification)
            .where(notification_type: "system_update")
            .where("metadata ->> 'system_update_id' = ?", @system_update.id.to_s)
            .unread
            .update_all(read_at: Time.current)

          render_ok(system_update: serialize(@system_update, read))
        end

        private

        def visible_updates
          SystemUpdate.published.includes(:company).recent_first.select { |item| item.visible_to?(current_company) }
        end

        def set_update
          @system_update = visible_updates.find { |item| item.id == params[:id].to_i }
          render_not_found("Atualizacao") unless @system_update
        end

        def serialize(item, read)
          item.as_json(
            only: %i[
              id title short_description content version update_type is_featured
              published_at icon color link_url image_url
            ]
          ).merge(read: read.present?, read_at: read&.read_at)
        end
      end
    end
  end
end
