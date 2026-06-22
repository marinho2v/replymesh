module Api
  module V1
    module Public
      class OrdersController < BaseController
        before_action -> { require_public_feature!("orders") }, only: %i[create]
        # GET /api/v1/public/:company_slug/orders/:id
        def show
          order = find_public_order(params[:id])
          return render_not_found("Pedido nao encontrado") unless order

          render json: { success: true, order: serialize_order(order) }
        end

        # POST /api/v1/public/:company_slug/orders
        #
        # Cria um pedido público via CheckoutService.
        # Inclui anti-abuso: rate limit por telefone/IP + janela de duplicata.
        #
        # Body esperado:
        # {
        #   "order_type": "delivery",
        #   "payment_method": "pix",
        #   "subtotal_cents": 3500,
        #   "delivery_fee_cents": 500,
        #   "discount_cents": 0,
        #   "total_cents": 4000,
        #   "customer": { "full_name": "João", "phone": "21999999999" },
        #   "address": { "street": "Rua X", "number": "10", "neighborhood": "Centro", "city": "RJ" },
        #   "items": [{ "product_id": 1, "quantity": 2, "unit_price_cents": 1750, "selected_options": [] }]
        # }
        def create
          result = CheckoutService.call(
            company: current_company,
            params:  checkout_params,
            ip:      request.remote_ip
          )

          if result.success?
            order    = result.order
            pix_data = maybe_create_mp_pix(order, current_company)
            if pix_data[:pix_error].present?
              return render json: { success: false, errors: [pix_data[:pix_error]] }, status: :unprocessable_entity
            end

            NotificationService.order_received(order) rescue nil
            render json: { success: true, order: serialize_order(order).merge(pix_data) }, status: :created
          else
            render json: { success: false, errors: result.errors }, status: :unprocessable_entity
          end
        end

        # POST /api/v1/public/:company_slug/orders/:id/cancel_payment
        def cancel_payment
          order = find_public_order(params[:id])
          return render_not_found("Pedido nao encontrado") unless order

          result = MercadoPagoPaymentProcessor.cancel_pending!(order, reason: "cancelled_by_customer")
          status_code = result[:cancelled] ? :ok : :unprocessable_entity

          render json: {
            success: result[:cancelled],
            order: serialize_order(order.reload),
            payment: result,
            error: result[:cancelled] ? nil : "Pedido nao pode ser cancelado neste estado."
          }, status: status_code
        end

        private

        def find_public_order(reference)
          return nil if reference.blank?

          current_company.orders.includes(:order_items).find_by(public_token: reference.to_s)
        end

        def maybe_create_mp_pix(order, company)
          return {} unless FeatureGate.enabled?(company, "pix")
          return {} unless FeatureGate.enabled?(company, "mercado_pago")

          settings = company&.store_setting
          return {} unless settings&.mercadopago_enabled? &&
                           settings.pix_provider == 'mercadopago' &&
                           settings.mercadopago_access_token.present? &&
                           order.payment_method == 'pix'

          svc    = MercadoPagoPixService.new(settings.mercadopago_access_token)
          result = svc.create_pix_payment(order: order, payer_email: order.customer&.email)

          return { pix_error: result.error } unless result.success?

          pix_attrs = {
            payment_status:      'pending_payment',
            external_payment_id: result.payment_id,
            pix_qr_code:        result.qr_code,
            pix_qr_code_base64: result.qr_code_base64,
            pix_ticket_url:     result.ticket_url,
          }
          pix_attrs[:pix_copy_paste] = result.qr_code if order.respond_to?(:pix_copy_paste=)

          order.update!(pix_attrs)

            {
              pix_payment_id:     result.payment_id,
              pix_qr_code:        result.qr_code,
              pix_copy_paste:      result.qr_code,
              pix_qr_code_base64: result.qr_code_base64,
              pix_ticket_url:     result.ticket_url,
              pix_mode:           'mercadopago',
              pix_test_mode:      mercadopago_test_mode?(settings),
            }
          rescue => e
          Rails.logger.error("[MP Pix] Failed to create payment for order #{order.id}: #{e.class} #{e.message}")
          { pix_error: 'Nao foi possivel gerar o Pix Mercado Pago. Verifique a configuracao e tente novamente.' }
        end

        def checkout_params
          {
            order_type:          params[:order_type],
            payment_method:      params[:payment_method],
            delivery_zone_id:    params[:delivery_zone_id],
            subtotal_cents:      params[:subtotal_cents],
            delivery_fee_cents:  params[:delivery_fee_cents],
            discount_cents:      params[:discount_cents],
            total_cents:         params[:total_cents],
            change_for_cents:    params[:change_for_cents],
            needs_change:        params[:needs_change],
            coupon_code:         params[:coupon_code],
            notes:               params[:notes],
            customer:            params[:customer]&.permit(:full_name, :phone, :whatsapp, :email)&.to_h&.symbolize_keys,
            address:             params[:address]&.permit(:zip_code, :street, :number, :complement, :neighborhood, :city, :state, :reference)&.to_h&.symbolize_keys,
            items:               (params[:items] || []).map { |i|
              {
                product_id:        i[:product_id],
                quantity:          i[:quantity],
                unit_price_cents:  i[:unit_price_cents],
                selected_options:  i[:selected_options] || [],
                notes:             i[:notes]
              }
            }
          }
        end

        def serialize_order(order)
          {
            id:                  order.public_token,
            public_token:        order.public_token,
            public_reference:    order.public_token,
            order_number:        order.order_number,
            status:              order.status,
            order_type:          order.order_type,
            payment_method:      order.payment_method,
            payment_status:      order.payment_status,
            external_payment_id: order.external_payment_id,
            pix_qr_code:         order.pix_qr_code,
              pix_copy_paste:      order.respond_to?(:pix_copy_paste) ? order.pix_copy_paste : order.pix_qr_code,
              pix_qr_code_base64:  order.pix_qr_code_base64,
              pix_ticket_url:      order.pix_ticket_url,
              pix_test_mode:       mercadopago_test_mode?(order.company&.store_setting),
              customer_name:       order.customer_name,
            customer_phone:      order.customer_phone,
            subtotal_cents:      order.subtotal_cents,
            subtotal:            order.subtotal_brl,
            delivery_fee_cents:  order.delivery_fee_cents,
            delivery_fee:        order.delivery_fee_cents.to_f / 100,
            discount_cents:      order.discount_cents,
            discount_amount:     order.discount_cents.to_f / 100,
            total_cents:         order.total_cents,
            total:               order.total_brl,
            total_brl:           order.total_brl,
            change_for_cents:    order.change_for_cents,
            change_for:          order.change_for_cents.to_i.positive? ? order.change_for_cents.to_f / 100 : nil,
            needs_change:        order.needs_change,
            coupon_code:         order.coupon&.code,
            notes:               order.notes,
            created_at:          order.created_at,
            accepted_at:         order.accepted_at,
            preparing_at:        order.preparing_at,
            ready_at:            order.ready_at,
            out_for_delivery_at:  order.out_for_delivery_at,
            completed_at:        order.completed_at,
            cancelled_at:        order.cancelled_at,
            canceled_at:         order.cancelled_at,
            address:             serialize_address(order),
            order_items:         order.order_items.map { |item|
              {
                id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price_cents: item.unit_price_cents,
                unit_price: item.unit_price_brl,
                total_price_cents: item.total_price_cents,
                total_price: item.total_price_brl,
                selected_options: item.selected_options,
                notes: item.notes
              }
            }
          }
          end

          def mercadopago_test_mode?(settings)
            token = settings&.mercadopago_access_token.to_s
            token.start_with?("TEST-") || token.include?("DEV-")
          end

        def serialize_address(order)
          return nil unless order.delivery?

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
      end
    end
  end
end
