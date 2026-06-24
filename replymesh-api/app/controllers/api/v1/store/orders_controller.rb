module Api
  module V1
    module Store
      class OrdersController < BaseController
        before_action -> { require_feature!("orders") }
        before_action :set_order, only: %i[show status assign_motoboy delivery_status complete_delivery record_payment]

        # GET /api/v1/store/orders
        def index
          scope = company_scope(Order).includes(:customer, :motoboy, :order_items, :delivery_zone)
                                      .recent

          scope = scope.by_status(params[:status])     if params[:status].present?
          scope = scope.where(order_type: params[:type]) if params[:type].present?
          scope = scope.today                            if params[:today] == "true"

          if params[:date_from].present?
            scope = scope.where("orders.created_at >= ?", Time.zone.parse(params[:date_from]).beginning_of_day)
          end
          if params[:date_to].present?
            scope = scope.where("orders.created_at <= ?", Time.zone.parse(params[:date_to]).end_of_day)
          end
          if params[:q].present?
            scope = scope.where("customer_name ILIKE ? OR customer_phone ILIKE ?",
                                "%#{params[:q]}%", "%#{params[:q]}%")
          end

          total = scope.count
          orders = scope.limit(page_limit).offset(page_offset).map { |o| serialize_list(o) }

          render_ok(orders: orders, total: total)
        rescue ArgumentError
          render_error("Parâmetro de data inválido")
        end

        # GET /api/v1/store/kitchen/orders
        def kitchen
          scope = company_scope(Order).includes(:customer, :order_items, :delivery_zone, :dining_table)
                                      .where(status: %w[pending accepted preparing ready completed])
                                      .where("orders.status <> ? OR orders.completed_at >= ?", "completed", Time.current.beginning_of_day)
                                      .where.not(payment_status: "pending_payment")
                                      .recent

          render_ok(orders: scope.limit(page_limit).offset(page_offset).map { |o| serialize_kitchen(o) })
        end

        # GET /api/v1/store/orders/:id
        def show
          render_ok(order: serialize_full(@order))
        end

        # POST /api/v1/store/orders (criação pelo admin/atendente)
        def create
          result = CheckoutService.call(
            company: current_company,
            params:  checkout_params,
            ip:      request.remote_ip
          )

          if result.success?
            render_created(order: serialize_full(result.order))
          else
            render_error(result.errors.first, errors: result.errors)
          end
        end

        # PATCH /api/v1/store/orders/:id/status
        def status
          new_status = params.require(:status)
          return render_error("Perfil sem permissao para este status", status: :forbidden) unless status_allowed_for_role?(new_status)

          result = OrderStatusService.call(
            order:      @order,
            new_status: new_status,
            user:       current_user,
            skip_side_effects: ActiveModel::Type::Boolean.new.cast(params[:skip_side_effects])
          )

          if result.success?
            render_ok(
              order: serialize_full(result.order),
              manual_whatsapp: result.whatsapp&.manual_preview
            )
          else
            render_error(result.error)
          end
        end

        # POST /api/v1/store/orders/:id/assign_motoboy
        def assign_motoboy
          motoboy = company_scope(::Motoboy).find_by(id: params.require(:motoboy_id))
          return render_not_found("Motoboy") unless motoboy

          result = DeliveryService.assign(order: @order, motoboy: motoboy, user: current_user)

          if result.success?
            render_ok(order: serialize_full(result.data))
          else
            render_error(result.error)
          end
        end

        # PATCH /api/v1/store/orders/:id/delivery_status
        def delivery_status
          result = DeliveryService.update_status(
            order:              @order,
            new_delivery_status: params.require(:delivery_status)
          )

          if result.success?
            render_ok(order: serialize_full(result.data))
          else
            render_error(result.error)
          end
        end

        # POST /api/v1/store/orders/:id/complete_delivery
        def complete_delivery
          motoboy = @order.motoboy
          return render_error("Pedido sem motoboy atribuído") unless motoboy

          result = DeliveryService.complete(order: @order, motoboy: motoboy, notes: params[:notes], user: current_user)

          if result.success?
            render_ok(order: serialize_full(result.data))
          else
            render_error(result.error)
          end
        end

        # POST /api/v1/store/orders/:id/record_payment
        def record_payment
          result = CashService.record_payment(order: @order, user: current_user)

          if result.success?
            render_ok(order: serialize_full(@order.reload), cash_session_id: result.data&.id)
          else
            render_error(result.error)
          end
        end

        private

        def set_order
          @order = company_scope(Order).includes(
            :customer, :motoboy, :delivery_zone, :coupon, :dining_table,
            order_items: :product, delivery_history: nil, order_status_logs: nil
          ).find_by(id: params[:id])
          render_not_found("Pedido") unless @order
        end

        def checkout_params
          {
            order_type:        params.dig(:order, :order_type),
            payment_method:    params.dig(:order, :payment_method),
            subtotal_cents:    params.dig(:order, :subtotal_cents),
            delivery_fee_cents: params.dig(:order, :delivery_fee_cents),
            discount_cents:    params.dig(:order, :discount_cents),
            total_cents:       params.dig(:order, :total_cents),
            change_for_cents:  params.dig(:order, :change_for_cents),
            needs_change:      params.dig(:order, :needs_change),
            coupon_code:       params.dig(:order, :coupon_code),
            notes:             params.dig(:order, :notes),
            customer:          params[:customer]&.permit(:full_name, :phone, :whatsapp, :email)&.to_h&.symbolize_keys,
            address:           params[:address]&.permit(:zip_code, :street, :number, :complement, :neighborhood, :city, :state, :reference)&.to_h&.symbolize_keys,
            items:             (params[:items] || []).map do |i|
              { product_id: i[:product_id], quantity: i[:quantity],
                unit_price_cents: i[:unit_price_cents], selected_options: i[:selected_options],
                notes: i[:notes] }
            end
          }
        end

        def status_allowed_for_role?(new_status)
          return true if current_user.super_admin? || current_company_member&.role.in?(%w[store_admin employee])

          case current_company_member&.role
          when "kitchen"
            new_status.in?(%w[accepted preparing ready])
          when "waiter"
            @order.dine_in? && @order.status == "ready" && new_status == "completed"
          else
            false
          end
        end

        def serialize_list(o)
          {
            id:             o.id,
            order_number:   o.order_number,
            status:         o.status,
            order_type:     o.order_type,
            payment_method: o.payment_method,
            payment_status: o.payment_status,
            payment_mode: payment_mode_for(o),
            delivery_status: o.delivery_status,
            subtotal_cents: o.subtotal_cents,
            subtotal:       o.subtotal_brl,
            delivery_fee_cents: o.delivery_fee_cents,
            delivery_fee:   cents_to_brl(o.delivery_fee_cents),
            discount_cents: o.discount_cents,
            discount_amount: cents_to_brl(o.discount_cents),
            total_cents:    o.total_cents,
            total:          o.total_brl,
            total_brl:      o.total_brl,
            payment_mode:   payment_mode_for(o),
            needs_change:   o.needs_change,
            change_for_cents: o.change_for_cents,
            change_for:     cents_to_brl(o.change_for_cents),
            customer_name:  o.customer_name,
            customer_phone: o.customer_phone,
            customer_whatsapp: o.customer_whatsapp,
            address:        order_address(o),
            items_count:    o.order_items.size,
            order_items:    serialize_items(o),
            created_at:     o.created_at,
            delivery_zone:  o.delivery_zone&.slice("id", "name", "delivery_fee_cents"),
            dining_table:   o.dining_table&.slice("id", "name", "number"),
            dining_tables:  o.dining_table&.slice("id", "name", "number"),
            motoboy:        o.motoboy&.slice("id", "name")
          }
        end

        def serialize_full(o)
          o.as_json(
            only: %i[id order_number status order_type payment_method payment_status
                     delivery_status subtotal_cents delivery_fee_cents discount_cents
                     total_cents change_for_cents needs_change customer_name customer_phone
                     customer_whatsapp zip_code street number complement neighborhood city state
                     reference notes inventory_deducted financial_recorded_at
                     delivery_latitude delivery_longitude google_maps_url waze_url
                     delivery_location_source delivery_location_received_at
                     accepted_at preparing_at ready_at out_for_delivery_at completed_at cancelled_at
                     created_at updated_at]
          ).merge(
            total_brl:      o.total_brl,
            customer:       o.customer&.slice("id", "full_name", "phone"),
            delivery_zone:  o.delivery_zone&.slice("id", "name", "delivery_fee_cents"),
            motoboy:        o.motoboy&.slice("id", "name", "phone"),
            coupon:         o.coupon&.slice("id", "code", "discount_type", "discount_value"),
            dining_table:   o.dining_table&.slice("id", "name", "number"),
            items:          o.order_items.map { |item|
              item.as_json(only: %i[id product_name unit_price_cents quantity total_price_cents
                                   selected_options status notes])
            },
            order_items:    serialize_items(o),
            address:        order_address(o),
            status_history: o.order_status_logs.includes(:changed_by).order(:created_at).map { |log|
              log.as_json(only: %i[previous_status new_status created_at]).merge(
                changed_by: log.changed_by&.slice("id", "name", "email", "global_role")
              )
            }
          )
        end

        def serialize_kitchen(order)
          serialize_list(order).merge(
            notes: order.notes,
            source: order.legacy_source,
            table_id: order.dining_table_id,
            table_session_id: TableSession.find_by(order_id: order.id)&.id,
            attendant_id: order.attendant_id,
            dining_tables: order.dining_table&.slice("id", "name", "number"),
            profiles: order.attendant&.slice("id", "name", "global_role"),
            change_for: cents_to_brl(order.change_for_cents)
          )
        end

        def serialize_items(order)
          order.order_items.map do |item|
            item.as_json(
              only: %i[id product_id product_name unit_price_cents quantity total_price_cents
                       selected_options status notes]
            ).merge(
              unit_price: item.unit_price_brl,
              total_price: item.total_price_brl
            )
          end
        end

        def order_address(order)
          return nil if order.pickup?

          {
            zip_code: order.zip_code,
            street: order.street,
            number: order.number,
            complement: order.complement,
            neighborhood: order.neighborhood,
            city: order.city,
            state: order.state,
            reference: order.reference
          }
        end

        def payment_mode_for(order)
          return nil unless order.payment_method == "pix"
          return "mercadopago" if order.external_payment_id.present? || order.payment_status == "pending_payment"

          "manual"
        end

        def cents_to_brl(value)
          value.to_f / 100
        end
      end
    end
  end
end
