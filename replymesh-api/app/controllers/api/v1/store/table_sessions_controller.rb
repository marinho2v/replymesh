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
          create_order_for_kitchen! if sending_to_kitchen_without_order?

          if @session.update(session_params)
            @session.dining_table.update!(status: table_status_for(@session.status)) if table_status_for(@session.status)
            finalize_order_payment! if closing_with_payment?
            render_ok(table_session: serialize(@session.reload))
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

        def closing_with_payment?
          @session.status.in?(%w[paid closed]) &&
            @session.payment_status == "paid" &&
            @session.order.present?
        end

        # No fechamento da mesa o pedido recebe a forma de pagamento real,
        # o total com desconto/taxa de servico, e entra no caixa uma unica vez.
        def finalize_order_payment!
          order = @session.order

          unless order.financial_recorded_at.present?
            order_updates = {}
            order_updates[:payment_method] = @session.payment_method if @session.payment_method.in?(Order::PAYMENT_METHODS)
            order_updates[:payment_status] = "paid"
            order_updates[:discount_cents] = @session.discount_cents.to_i if @session.discount_cents.present?
            order_updates[:total_cents] = @session.total_cents.to_i if @session.total_cents.to_i.positive?
            order.update!(order_updates)
          end

          advance_order_to_completed!(order)

          cash_result = CashService.record_payment(order: order.reload, user: current_user)
          Rails.logger.warn("Mesa #{@session.id}: caixa nao registrado para pedido #{order.id}: #{cash_result.error}") unless cash_result.success?
        rescue StandardError => e
          Rails.logger.warn("Mesa #{@session.id}: erro ao finalizar pagamento: #{e.class} #{e.message}")
        end

        # Avanca o pedido passo a passo ate completed (aceitar tambem baixa o estoque).
        def advance_order_to_completed!(order)
          %w[accepted ready completed].each do |step|
            break if order.status.in?(%w[completed cancelled])

            result = OrderStatusService.call(order: order, new_status: step, user: current_user)
            if result.success?
              order.reload
            elsif result.error.to_s.start_with?("Transicao invalida")
              next
            else
              Rails.logger.warn("Mesa #{@session.id}: pedido #{order.id} parou em #{order.status}: #{result.error}")
              break
            end
          end
        end

        def sending_to_kitchen_without_order?
          params.dig(:table_session, :status).to_s == "sent_to_kitchen" &&
            @session.order_id.blank? &&
            Array(params[:items]).any?
        end

        def create_order_for_kitchen!
          calculated_items = calculate_items
          subtotal_cents = calculated_items.sum { |item| item[:total_price_cents] }
          order = nil

          ActiveRecord::Base.transaction do
            order = current_company.orders.create!(
              dining_table: @session.dining_table,
              attendant: current_user,
              legacy_source: "table_waiter",
              order_type: "dine_in",
              status: "pending",
              payment_method: @session.payment_method.presence || "money",
              payment_status: "pending",
              delivery_status: "pending",
              customer_name: @session.notes.presence || @session.dining_table.name || "Mesa #{@session.dining_table.number}",
              customer_phone: "mesa-#{@session.dining_table_id}",
              customer_whatsapp: "mesa-#{@session.dining_table_id}",
              subtotal_cents: subtotal_cents,
              delivery_fee_cents: 0,
              discount_cents: 0,
              total_cents: subtotal_cents,
              notes: params.dig(:table_session, :notes)
            )

            calculated_items.each do |item|
              order.order_items.create!(
                company: current_company,
                product: item[:product],
                product_name: item[:product_name],
                unit_price_cents: item[:unit_price_cents],
                quantity: item[:quantity],
                total_price_cents: item[:total_price_cents],
                selected_options: [],
                notes: item[:notes]
              )
            end

            @session.update!(
              order: order,
              attendant: current_user,
              subtotal_cents: subtotal_cents,
              total_cents: subtotal_cents
            )
          end
        end

        def calculate_items
          Array(params[:items]).map do |item_params|
            product = current_company.products.active.find_by(id: item_params[:product_id])
            raise ActiveRecord::RecordInvalid.new(OrderItem.new.tap { |item| item.errors.add(:product, "invalido") }) unless product

            quantity = [item_params[:quantity].to_i, 1].max
            unit_price_cents = product.promotional_price_cents.presence || product.price_cents

            {
              product: product,
              product_name: product.name,
              unit_price_cents: unit_price_cents.to_i,
              quantity: quantity,
              total_price_cents: unit_price_cents.to_i * quantity,
              notes: item_params[:notes]
            }
          end
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
