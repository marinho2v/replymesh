module Api
  module V1
    module Store
      class DiningTablesController < BaseController
        before_action -> { require_feature!("tables") }
        before_action -> { require_feature!("table_qr") }, only: %i[set_qr_enabled regenerate_qr]
        before_action :set_table, only: %i[show update destroy set_qr_enabled regenerate_qr]

        def index
          scope = company_scope(DiningTable).includes(table_sessions: [:opened_by, { order: :order_items }]).active.ordered
          scope = scope.available if params[:available] == "true"
          render_ok(dining_tables: scope.map { |t| serialize(t) })
        end

        def show
          render_ok(dining_table: serialize(@table))
        end

        def create
          table = company_scope(DiningTable).build(table_params)
          if table.save
            render_created(dining_table: serialize(table))
          else
            render_record_errors(table)
          end
        end

        def update
          if @table.update(table_params)
            render_ok(dining_table: serialize(@table))
          else
            render_record_errors(@table)
          end
        end

        def destroy
          @table.update!(is_active: false)
          render_ok(message: "Mesa desativada")
        end

        def set_qr_enabled
          enabled = ActiveModel::Type::Boolean.new.cast(params.require(:enabled))
          @table.update!(qr_enabled: enabled, qr_updated_at: Time.current)
          render_ok(dining_table: serialize(@table.reload))
        end

        def regenerate_qr
          @table.regenerate_qr_token!
          render_ok(dining_table: serialize(@table.reload))
        end

        private

        def set_table
          @table = company_scope(DiningTable).find_by(id: params[:id])
          render_not_found("Mesa") unless @table
        end

        def table_params
          params.require(:dining_table).permit(:number, :name, :slug, :seats, :status, :is_active, :sort_order, :notes, :qr_enabled)
                .merge(company_id: current_company.id)
        end

        def serialize(t)
          session = t.table_sessions.select(&:open?).max_by(&:opened_at)
          t.as_json(only: %i[id number name slug seats status is_active sort_order notes qr_token qr_enabled qr_generated_at qr_updated_at]).merge(
            active_session: session && {
              id: session.id,
              status: session.status,
              profiles: session.opened_by&.as_json(only: %i[id name email global_role]).to_h.merge(
                full_name: session.opened_by&.name,
                role: session.opened_by&.global_role
              ),
              orders: session.order && {
                id: session.order.id,
                order_number: session.order.order_number,
                status: session.order.status,
                total: session.order.total_brl,
                total_cents: session.order.total_cents
              }
            }
          )
        end
      end
    end
  end
end
