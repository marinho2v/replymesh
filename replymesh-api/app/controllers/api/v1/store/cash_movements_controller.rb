module Api
  module V1
    module Store
      class CashMovementsController < BaseController
        before_action -> { require_feature!("cashier") }
        def index
          scope = company_scope(CashMovement)
                    .includes(order: [:dining_table, :customer])
                    .recent

          scope = scope.where(cash_session_id: params[:cash_session_id]) if params[:cash_session_id].present?
          scope = scope.where(movement_type: params[:type])               if params[:type].present?

          render_ok(
            cash_movements: scope.limit(page_limit).offset(page_offset).map { |m| serialize(m) },
            total: scope.count
          )
        end

        # POST /store/cash_movements — Movimentação manual (sangria, reforço, etc.)
        def create
          session = CashSession.current_for(current_company.id)
          return render_error("Nenhum caixa aberto") unless session

          result = CashService.add_movement(
            session:       session,
            movement_type: params.require(:movement_type),
            amount_cents:  params.require(:amount_cents).to_i,
            user:          current_user,
            notes:         params[:notes]
          )

          if result.success?
            render_created(cash_movement: serialize(result.data))
          else
            render_error(result.error)
          end
        end

        private

        def serialize(m)
          m.as_json(only: %i[id movement_type amount_cents affects_physical_cash notes created_at
                             origin origin_table_name origin_waiter_name])
           .merge(
             amount_brl: m.amount_brl,
             orders: m.order ? {
               order_number:  m.order.order_number,
               order_type:    m.order.order_type,
               customer_name: m.order.customer_name
             } : nil
           )
        end
      end
    end
  end
end
