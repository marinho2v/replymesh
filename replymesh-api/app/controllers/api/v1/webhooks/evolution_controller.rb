module Api
  module V1
    module Webhooks
      class EvolutionController < ApplicationController
        def messages
          return render_error("Nao autorizado", :unauthorized) unless valid_webhook_key?

          payload = parse_payload
          parsed = EvolutionMessagePayloadParser.call(payload: payload, headers: normalized_headers)
          return render json: { success: true, ignored: true, reason: parsed.ignored_reason }, status: :ok if parsed.ignored_reason.present?
          return render json: { success: false, error: parsed.error }, status: :unprocessable_entity unless parsed.success?

          instance = find_message_instance(parsed)
          return render json: { success: false, error: "Instancia Evolution nao vinculada" }, status: :unprocessable_entity unless instance

          setting = StoreAiSetting.for_company(instance.company)
          unless setting.enabled? && setting.auto_reply_whatsapp?
            log_ai_webhook(instance, parsed, "skipped", "IA ou resposta automatica desativada")
            return render json: { success: true, ignored: true, reason: "IA ou resposta automatica desativada" }, status: :ok
          end

          if duplicate_message?(instance, parsed)
            return render json: { success: true, ignored: true, reason: "Mensagem ja processada" }, status: :ok
          end

          result = StoreAiService.call(
            company: instance.company,
            user: nil,
            question: parsed.text,
            phone: parsed.phone,
            simulate: false
          )
          answer = StoreAiWhatsappFormatter.format(result[:answer])

          if result[:status] == "disabled" || answer.blank?
            log_ai_webhook(instance, parsed, "skipped", result[:status])
            return render json: { success: true, ignored: true, reason: result[:status] }, status: :ok
          end

          send_result = EvolutionGoClient.new.send_text(
            instance.instance_token,
            phone: parsed.phone,
            message: answer
          )
          mark_message_processed(instance, parsed)
          log_ai_webhook(instance, parsed, "sent", nil, answer: answer, response: send_result)

          render json: {
            success: true,
            sent: true,
            company_id: instance.company_id,
            phone_last4: parsed.phone.last(4),
            status: result[:status]
          }, status: :ok
        rescue EvolutionGoClient::Error => e
          log_ai_webhook(instance, parsed, "failed", e.message) if defined?(instance) && instance && defined?(parsed) && parsed
          render json: { success: false, error: "Nao foi possivel enviar a resposta pela Evolution" }, status: :bad_gateway
        rescue StandardError => e
          Rails.logger.error("Evolution AI webhook error: #{e.class}")
          render json: { success: false, error: "Erro interno no webhook da IA" }, status: :internal_server_error
        end

        def location
          return render_error("Nao autorizado", :unauthorized) unless valid_webhook_key?

          payload = parse_payload
          parsed = EvolutionLocationPayloadParser.call(payload: payload, headers: normalized_headers)
          instance = find_instance(parsed)

          return render_error("Instancia Evolution nao vinculada", :unprocessable_entity) unless instance

          if parsed.ignored_reason.present?
            log_webhook(instance, "warn", "Localizacao ignorada: #{parsed.ignored_reason}", parsed)
            return render json: { success: true, ignored: true, reason: parsed.ignored_reason }, status: :ok
          end

          return render_error(parsed.error, :unprocessable_entity, instance: instance, parsed: parsed) unless parsed.success?

          order = find_open_order(instance.company, parsed.phone)
          unless order
            log_webhook(instance, "warn", "Localizacao sem pedido aberto vinculado", parsed)
            return render json: {
              success: true,
              matched: false,
              phone_last4: parsed.phone.to_s.last(4),
              message: "Nenhum pedido aberto encontrado para este telefone"
            }, status: :ok
          end

          update_order_location!(order, parsed)
          log_webhook(instance, "ok", "Localizacao vinculada ao pedido ##{order.order_number}", parsed, order: order)
          audit_location!(instance.company, order, parsed)

          render json: {
            success: true,
            matched: true,
            order_id: order.id,
            order_number: order.order_number,
            phone_last4: parsed.phone.to_s.last(4),
            google_maps_url: order.google_maps_url,
            waze_url: order.waze_url
          }, status: :ok
        rescue StandardError => e
          Rails.logger.error("Evolution location webhook error: #{e.class} #{e.message}")
          render json: { success: false, error: "Erro interno no webhook de localizacao" }, status: :internal_server_error
        end

        private

        def parse_payload
          JSON.parse(request.raw_post.presence || "{}")
        rescue JSON::ParserError
          {}
        end

        def normalized_headers
          {
            "apikey" => request.headers["apikey"],
            "x-api-key" => request.headers["x-api-key"],
            "authorization" => request.headers["Authorization"],
            "x-instance-name" => request.headers["x-instance-name"],
            "x-instance-id" => request.headers["x-instance-id"]
          }.compact
        end

        def valid_webhook_key?
          expected = ENV["EVOLUTION_LOCATION_WEBHOOK_SECRET"].presence || ENV["EVOLUTION_GO_API_KEY"].presence
          return false if expected.blank?

          provided = request.headers["apikey"].presence ||
                     request.headers["x-api-key"].presence ||
                     request.headers["Authorization"].to_s.remove(/^Bearer\s+/).presence ||
                     params[:token].presence
          return false if provided.blank?

          ActiveSupport::SecurityUtils.secure_compare(provided.to_s, expected.to_s)
        end

        def find_instance(parsed)
          scope = WhatsappInstance.includes(:company)
          if parsed.instance_uuid.present?
            scope.find_by(instance_uuid: parsed.instance_uuid)
          elsif parsed.instance_name.present?
            scope.find_by(instance_name: parsed.instance_name)
          end
        end

        def find_message_instance(parsed)
          scope = WhatsappInstance.includes(:company).where.not(instance_token: [nil, ""])
          if parsed.instance_uuid.present?
            scope.find_by(instance_uuid: parsed.instance_uuid)
          elsif parsed.instance_name.present?
            scope.find_by(instance_name: parsed.instance_name)
          end
        end

        def duplicate_message?(instance, parsed)
          return false if parsed.message_id.blank?

          Rails.cache.exist?("store-ai:evolution:#{instance.id}:#{parsed.message_id}")
        end

        def mark_message_processed(instance, parsed)
          return if parsed.message_id.blank?

          Rails.cache.write("store-ai:evolution:#{instance.id}:#{parsed.message_id}", true, expires_in: 24.hours)
        end

        def log_ai_webhook(instance, parsed, status, error = nil, answer: nil, response: nil)
          WhatsappLog.create!(
            company: instance.company,
            whatsapp_instance: instance,
            level: status == "failed" ? "err" : "info",
            message: "IA da loja via Evolution: #{status}",
            metadata_json: {
              source: "store_ai_evolution_webhook",
              phone_last4: parsed.phone.to_s.last(4),
              message_id: parsed.message_id,
              status: status,
              question: parsed.text.to_s.truncate(500),
              answer: answer.to_s.truncate(1_200).presence,
              error: error.to_s.truncate(300).presence,
              evolution_message_id: response.is_a?(Hash) ? response[:message_id] : nil
            }.compact
          )
        rescue StandardError => e
          Rails.logger.warn("Evolution AI webhook log failed: #{e.class}")
        end

        def find_open_order(company, phone)
          normalized = normalize_phone(phone)
          without_country = normalized.sub(/\A55/, "")

          company.orders
                 .where(order_type: "delivery")
                 .where.not(status: %w[completed cancelled])
                 .where("orders.created_at >= ?", 3.days.ago)
                 .where(
                   phone_match_sql,
                   normalized,
                   without_country,
                   normalized,
                   without_country
                 )
                 .order(Arel.sql("CASE delivery_status WHEN 'assigned' THEN 0 WHEN 'on_the_way' THEN 0 ELSE 1 END"))
                 .order(created_at: :desc)
                 .first
        end

        def phone_match_sql
          <<~SQL.squish
            regexp_replace(coalesce(customer_whatsapp, customer_phone, ''), '\\D', '', 'g') IN (?, ?)
            OR ? LIKE '%' || regexp_replace(coalesce(customer_whatsapp, customer_phone, ''), '\\D', '', 'g')
            OR ? LIKE '%' || regexp_replace(coalesce(customer_whatsapp, customer_phone, ''), '\\D', '', 'g')
          SQL
        end

        def update_order_location!(order, parsed)
          maps_url = "https://www.google.com/maps?q=#{parsed.latitude},#{parsed.longitude}"
          waze_url = "https://waze.com/ul?ll=#{parsed.latitude},#{parsed.longitude}&navigate=yes"

          order.update!(
            delivery_latitude: parsed.latitude,
            delivery_longitude: parsed.longitude,
            google_maps_url: maps_url,
            waze_url: waze_url,
            delivery_location_source: "whatsapp",
            delivery_location_received_at: Time.current
          )
        end

        def log_webhook(instance, level, message, parsed, order: nil)
          WhatsappLog.create!(
            company: instance.company,
            whatsapp_instance: instance,
            level: level,
            message: message,
            metadata_json: {
              source: "evolution_location_webhook",
              phone_last4: parsed.phone.to_s.last(4),
              instance_name: instance.instance_name,
              order_id: order&.id,
              order_number: order&.order_number,
              ignored_reason: parsed.ignored_reason,
              error: parsed.error,
              latitude_present: parsed.latitude.present?,
              longitude_present: parsed.longitude.present?
            }.compact
          )
        rescue StandardError => e
          Rails.logger.warn("Evolution location webhook log failed: #{e.class}")
        end

        def audit_location!(company, order, parsed)
          ActivityLog.create!(
            company: company,
            action: "webhook_location_received",
            resource_type: "Order",
            resource_id: order.id,
            metadata_json: {
              order_number: order.order_number,
              phone_last4: parsed.phone.to_s.last(4),
              source: "evolution"
            }
          )
        rescue StandardError => e
          Rails.logger.warn("Evolution location audit failed: #{e.class}")
        end

        def render_error(message, status, instance: nil, parsed: nil)
          log_webhook(instance, "err", "Erro no webhook de localizacao: #{message}", parsed) if instance && parsed
          render json: { success: false, error: message }, status: status
        end

        def normalize_phone(value)
          value.to_s.gsub(/\D/, "")
        end
      end
    end
  end
end
