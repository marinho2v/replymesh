module Api
  module V1
    module Webhooks
      class MercadopagoController < ActionController::API
        # POST /api/v1/webhooks/mercadopago
        def payment
          payment_id = extract_payment_id

          unless valid_payment_id?(payment_id)
            Rails.logger.warn("[MP Webhook] Missing payment id")
            return render json: { success: false, error: "invalid_payment_id" }, status: :bad_request
          end

          if payment_event_type.present? && payment_event_type != "payment"
            Rails.logger.warn("[MP Webhook] Invalid type=#{payment_event_type}")
            return render json: { success: false, error: "invalid_type" }, status: :bad_request
          end

          Rails.logger.info("[MP Webhook] Received notification payment_id=#{payment_id}")

          order = Order.find_by(external_payment_id: payment_id.to_s)
          result = nil

          if order
            settings = order.company&.store_setting
            unless mercado_pago_configured?(settings)
              Rails.logger.warn("[MP Webhook] MP not configured for company #{order.company_id}")
              return head :ok
            end

            result = MercadoPagoPixService.new(settings.mercadopago_access_token).check_payment(payment_id)
          else
            result = fetch_payment_from_configured_accounts(payment_id)
            order = find_order_from_payment_result(result)
          end

          unless order
            Rails.logger.warn("[MP Webhook] Order not found for payment_id=#{payment_id}")
            return head :ok
          end

          settings = order.company&.store_setting
          unless mercado_pago_configured?(settings)
            Rails.logger.warn("[MP Webhook] MP not configured for company #{order.company_id}")
            return head :ok
          end

          result ||= MercadoPagoPixService.new(settings.mercadopago_access_token).check_payment(payment_id)
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

        def extract_payment_id
          params.dig(:data, :id) ||
            params.dig(:resource, :id) ||
            params[:id] ||
            params[:payment_id]
        end

        def payment_event_type
          params[:type].presence || params[:topic].presence || params[:action].to_s.split(".").first.presence
        end

        def valid_payment_id?(payment_id)
          payment_id.to_s.match?(/\A[A-Za-z0-9_-]{3,80}\z/)
        end

        def mercado_pago_configured?(settings)
          settings&.mercadopago_enabled? && settings.mercadopago_access_token.present?
        end

        def fetch_payment_from_configured_accounts(payment_id)
          StoreSetting
            .where(mercadopago_enabled: true)
            .where.not(mercadopago_access_token: [nil, ""])
            .find_each do |settings|
              result = MercadoPagoPixService.new(settings.mercadopago_access_token).check_payment(payment_id)
              status = result[:status] || result["status"]
              next if status.blank? || status == "error"

              return result
            rescue StandardError => e
              Rails.logger.warn("[MP Webhook] Payment lookup skipped for store_setting=#{settings.id}: #{e.class}")
            end

          nil
        end

        def find_order_from_payment_result(result)
          return nil if result.blank?

          by_metadata(result[:metadata] || result["metadata"]) ||
            by_external_reference(result[:external_reference] || result["external_reference"])
        end

        def by_metadata(metadata)
          return nil unless metadata.respond_to?(:to_h)

          metadata = metadata.to_h.with_indifferent_access
          order_id = metadata[:order_id].presence
          company_id = metadata[:company_id].presence
          public_token = metadata[:public_token].presence
          return nil if order_id.blank?

          scope = Order.where(id: order_id)
          scope = scope.where(company_id: company_id) if company_id.present?
          scope = scope.where(public_token: public_token) if public_token.present?
          scope.first
        end

        def by_external_reference(reference)
          parts = reference.to_s.split(":")
          return nil unless parts[0] == "replymesh" && parts.size >= 4

          company_slug = parts[1]
          order_id = parts[2]
          public_token = parts[3]

          Order.joins(:company)
            .where(id: order_id, public_token: public_token)
            .where(companies: { slug: company_slug })
            .first
        end
      end
    end
  end
end
