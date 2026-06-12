module Api
  module V1
    module Store
      class PosController < BaseController
        before_action -> { require_feature!("pos_counter") }
        before_action :authorize_pos_role!

        # POST /store/pos/sale
        # Cria, aceita, completa e registra no caixa em uma unica transacao.
        def sale
          session = CashSession.current_for(current_company.id)
          return render_error("Abra o caixa antes de iniciar vendas no PDV") unless session

          items_params = Array(params[:items])
          return render_error("Adicione ao menos um produto") if items_params.empty?

          order = nil

          ActiveRecord::Base.transaction do
            order = build_order(session)
            create_order_items(order, items_params)
            order.reload
            advance_to_completed!(order)
            CashService.record_payment(order: order.reload, user: current_user)
            order.reload.update_column(:payment_status, "paid")
          end

          render_created(order: serialize_pos(order.reload))
        rescue ActiveRecord::RecordInvalid => e
          render_error(e.record.errors.full_messages.join(", "))
        rescue StandardError => e
          Rails.logger.error("PosController#sale error: #{e.class} #{e.message}")
          render_error("Erro ao registrar venda: #{e.message}")
        end

        private

        def authorize_pos_role!
          member = current_company_member
          return if member&.role.in?(%w[store_admin cashier])

          render json: { success: false, error: "Sem permissao para acessar o PDV" }, status: :forbidden
          false
        end

        def build_order(session)
          payment = params[:payment_method].to_s.presence_in(Order::PAYMENT_METHODS) || "money"
          needs_change = payment == "money" && params[:change_for_cents].to_i > 0

          subtotal  = items_subtotal
          discount  = [params[:discount_cents].to_i, 0].max
          discount  = [(subtotal * params[:discount_percent].to_f / 100).round, subtotal].min if params[:discount_percent].present? && discount.zero?
          total     = [subtotal - discount, 0].max

          current_company.orders.create!(
            order_type:          "pos",
            status:              "pending",
            payment_method:      payment,
            payment_status:      "pending",
            delivery_status:     "pending",
            subtotal_cents:      subtotal,
            delivery_fee_cents:  0,
            discount_cents:      discount,
            total_cents:         total,
            needs_change:        needs_change,
            change_for_cents:    needs_change ? params[:change_for_cents].to_i : 0,
            customer_name:       params[:customer_name].presence || "Balcao",
            customer_phone:      params[:customer_phone].presence || "pos-#{Time.current.to_i}",
            customer_whatsapp:   "",
            notes:               params[:notes].presence,
            attendant:           current_user,
            legacy_source:       "pos"
          )
        end

        def items_subtotal
          Array(params[:items]).sum do |item|
            item[:quantity].to_i * item[:unit_price_cents].to_i
          end
        end

        def create_order_items(order, items_params)
          items_params.each do |item|
            product = current_company.products.find_by(id: item[:product_id])
            next unless product

            qty   = [item[:quantity].to_i, 1].max
            price = item[:unit_price_cents].to_i

            order.order_items.create!(
              company:          current_company,
              product:          product,
              product_name:     product.name,
              unit_price_cents: price,
              quantity:         qty,
              total_price_cents: price * qty,
              unit_cost_cents:  product.cost_price_cents.to_i,
              total_cost_cents: product.cost_price_cents.to_i * qty,
              selected_options: [],
              notes:            item[:notes].presence
            )
          end
        end

        def advance_to_completed!(order)
          %w[accepted completed].each do |step|
            break if order.status.in?(%w[completed cancelled])

            result = OrderStatusService.call(order: order, new_status: step, user: current_user)
            if result.success?
              order.reload
            elsif result.error.to_s.start_with?("Transicao invalida")
              next
            else
              raise StandardError, result.error
            end
          end
        end

        def serialize_pos(order)
          order.as_json(
            only: %i[id order_number status order_type payment_method total_cents discount_cents
                     subtotal_cents change_for_cents needs_change customer_name notes
                     financial_recorded_at created_at]
          ).merge(
            total_brl:     order.total_brl,
            subtotal_brl:  order.subtotal_brl,
            discount_brl:  order.discount_cents.to_f / 100,
            change_brl:    [order.change_for_cents.to_i - order.total_cents.to_i, 0].max.to_f / 100,
            store_name:    current_company.store_setting&.store_name.presence || current_company.name,
            attendant:     current_user&.name,
            items:         order.order_items.map do |item|
              {
                product_name:     item.product_name,
                quantity:         item.quantity,
                unit_price_cents: item.unit_price_cents,
                unit_price_brl:   item.unit_price_brl,
                total_price_brl:  item.total_price_brl
              }
            end
          )
        end
      end
    end
  end
end
