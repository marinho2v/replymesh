module Api
  module V1
    module Webhooks
      class MercadopagoController < ActionController::API
        # POST /api/v1/webhooks/mercadopago
        def payment
          payment_id = params.dig(:data, :id) || params[:id]

          unless valid_payment_id?(payment_id)
            Rails.logger.warn("[MP Webhook] Missing payment id")
            return render json: { success: false, error: "invalid_payment_id" }, status: :bad_request
          end

          if params[:type].present? && params[:type] != "payment"
            Rails.logger.warn("[MP Webhook] Invalid type=#{params[:type]}")
            return render json: { success: false, error: "invalid_type" }, status: :bad_request
          end

          Rails.logger.info("[MP Webhook] Received notification payment_id=#{payment_id}")

          order = Order.find_by(external_payment_id: payment_id.to_s)
          unless order
            Rails.logger.warn("[MP Webhook] Order not found for payment_id=#{payment_id}")
            return head :ok
          end

          settings = order.company&.store_setting
          unless settings&.mercadopago_enabled? && settings.mercadopago_access_token.present?
            Rails.logger.warn("[MP Webhook] MP not configured for company #{order.company_id}")
            return head :ok
          end

          result = MercadoPagoPixService.new(settings.mercadopago_access_token).check_payment(payment_id)
          MercadoPagoPaymentProcessor.process_result!(order, result, payment_id)
          head :ok
        rescue StandardError => e
          Rails.logger.error("[MP Webhook] Error processing webhook: #{e.class} #{e.message}")
          head :ok
        end

        # POST /api/v1/webhooks/mercadopago/simulate
        def simulate
          unless Rails.env.development?
            return render json: { error: "Simulacao disponivel apenas em desenvolvimento" }, status: :forbidden
          end

          order = Order.find_by(id: params[:order_id])
          return render json: { error: "Pedido nao encontrado" }, status: :not_found unless order

          mp_status = params[:status].presence || "approved"
          result = {
            id: order.external_payment_id || "DEV-SIM-#{order.id}",
            status: mp_status,
            detail: "simulated"
          }

          data = MercadoPagoPaymentProcessor.process_result!(order, result, order.external_payment_id)
          render json: { success: true, order_id: order.id }.merge(data)
        rescue StandardError => e
          render json: { error: e.message }, status: :unprocessable_entity
        end

        private

        def valid_payment_id?(payment_id)
          payment_id.to_s.match?(/\A[A-Za-z0-9_-]{3,80}\z/)
        end
      end
    end
  end
end
