module Api
  module V1
    module Store
      class TableSessionsController < BaseController
        before_action -> { require_feature!("table_orders") }
        before_action :set_session, only: %i[show update]

        def index
          scope = company_scope(TableSession).includes(:dining_table, :opened_by, order: :order_items).recent
          scope = scope.open if params[:open] == "true"
          render_ok(table_sessions: scope.limit(page_limit).map { |s| serialize(s) })
        end

        def show
          render_ok(table_session: serialize(@session))
        end

        def create
          table = company_scope(DiningTable).find_by(id: params.dig(:table_session, :dining_table_id))
          return render_not_found("Mesa") unless table

          session = company_scope(TableSession).build(
            dining_table: table,
            opened_by:    current_user,
            status:       "open",
            opened_at:    Time.current,
            company:      current_company,
            notes:        params.dig(:table_session, :notes)
          )

          if session.save
            render_created(table_session: serialize(session))
          else
            render_record_errors(session)
          end
        end

        def update
          if @session.update(session_params)
            @session.dining_table.update!(status: table_status_for(@session.status)) if table_status_for(@session.status)
            render_ok(table_session: serialize(@session))
          else
            render_record_errors(@session)
          end
        end

        private

        def set_session
          @session = company_scope(TableSession).find_by(id: params[:id])
          render_not_found("Sessão de mesa") unless @session
        end

        def session_params
          params.require(:table_session).permit(
            :status, :payment_method, :payment_status, :notes,
            :subtotal_cents, :total_cents, :discount_cents, :service_fee_cents,
            :requested_close_at, :sent_to_kitchen_at, :paid_at, :closed_at
          )
        end

        def serialize(s)
          order = s.order
          {
            id: s.id,
            status: s.status,
            payment_method: s.payment_method,
            payment_status: s.payment_status,
            subtotal_cents: s.subtotal_cents,
            total_cents: s.total_cents,
            discount_cents: s.discount_cents,
            service_fee_cents: s.service_fee_cents,
            discount_amount: cents_to_brl(s.discount_cents),
            service_fee_amount: cents_to_brl(s.service_fee_cents),
            subtotal: cents_to_brl(s.subtotal_cents),
            total: cents_to_brl(s.total_cents),
            notes: s.notes,
            opened_at: s.opened_at,
            closed_at: s.closed_at,
            order_id: order&.id,
            table: s.dining_table&.slice("id", "name", "number"),
            dining_tables: s.dining_table&.slice("id", "name", "number"),
            profiles: s.opened_by&.as_json(only: %i[id name email global_role]).to_h.merge(
              full_name: s.opened_by&.name,
              role: s.opened_by&.global_role
            ),
            orders: order && {
              id: order.id,
              order_number: order.order_number,
              status: order.status,
              payment_method: order.payment_method,
              total: order.total_brl,
              total_cents: order.total_cents,
              notes: order.notes,
              order_items: order.order_items.map { |item|
                item.as_json(only: %i[id product_id product_name unit_price_cents quantity total_price_cents notes]).merge(
                  unit_price: item.unit_price_brl,
                  total_price: item.total_price_brl
                )
              }
            }
          }
        end

        def table_status_for(session_status)
          case session_status
          when "open" then "occupied"
          when "sent_to_kitchen" then "preparing"
          when "waiting_payment" then "waiting_payment"
          when "paid", "closed", "cancelled" then "available"
          end
        end

        def cents_to_brl(value)
          value.to_i / 100.0
        end
      end
    end
  end
end
