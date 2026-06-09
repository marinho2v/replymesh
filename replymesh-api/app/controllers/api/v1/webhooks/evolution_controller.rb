module Api
  module V1
    module Webhooks
      class EvolutionController < ApplicationController
        def messages
          payload = parse_payload
          parsed = EvolutionMessagePayloadParser.call(payload: payload, headers: normalized_headers)
          return handle_from_me_message(parsed) if parsed.from_me
          return render json: { success: true, ignored: true, reason: parsed.ignored_reason }, status: :ok if parsed.ignored_reason.present?
          return render json: { success: false, error: parsed.error }, status: :unprocessable_entity unless parsed.success?

          process_message(parsed)
        rescue EvolutionGoClient::Error => e
          log_ai_webhook(instance, parsed, "failed", e.message) if defined?(instance) && instance && defined?(parsed) && parsed
          render json: { success: false, error: "Nao foi possivel enviar a resposta pela Evolution" }, status: :bad_gateway
        rescue StandardError => e
          Rails.logger.error("Evolution AI webhook error: #{e.class}")
          render json: { success: false, error: "Erro interno no webhook da IA" }, status: :internal_server_error
        end

        def location
          payload = parse_payload
          message = EvolutionMessagePayloadParser.call(payload: payload, headers: normalized_headers)
          return handle_from_me_message(message) if message.from_me
          return process_message(message) if message.success?
          if message.ignored_reason.present? && message.ignored_reason != "Evento de localizacao"
            return render json: {
              success: true,
              ignored: true,
              reason: message.ignored_reason
            }, status: :ok
          end

          parsed = EvolutionLocationPayloadParser.call(payload: payload, headers: normalized_headers)
          instance = authorized_instance(parsed, require_token: false)

          return render_error("Nao autorizado", :unauthorized) unless instance

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
        rescue EvolutionGoClient::Error
          render json: { success: false, error: "Nao foi possivel enviar a resposta pela Evolution" }, status: :bad_gateway
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

        def find_instance(parsed, require_token: false)
          scope = WhatsappInstance.includes(:company)
          scope = scope.where.not(instance_token: [nil, ""]) if require_token
          if parsed.instance_uuid.present?
            scope.find_by(instance_uuid: parsed.instance_uuid)
          elsif parsed.instance_name.present?
            scope.find_by(instance_name: parsed.instance_name)
          end
        end

        def authorized_instance(parsed, require_token:)
          token_instance = EvolutionWebhookToken.resolve(params[:token])
          if token_instance
            return if parsed.instance_uuid.present? && token_instance.instance_uuid.present? &&
                      parsed.instance_uuid.to_s != token_instance.instance_uuid.to_s
            return if parsed.instance_name.present? && parsed.instance_name.to_s != token_instance.instance_name.to_s

            return token_instance if !require_token || token_instance.instance_token.present?
          end

          return unless valid_webhook_key?

          find_instance(parsed, require_token: require_token)
        end

        def process_message(parsed)
          instance = authorized_instance(parsed, require_token: true)
          return render json: { success: false, error: "Nao autorizado" }, status: :unauthorized unless instance

          setting = StoreAiSetting.for_company(instance.company)
          unless setting.enabled? && setting.auto_reply_whatsapp?
            log_ai_webhook(instance, parsed, "skipped", "IA ou resposta automatica desativada")
            return render json: { success: true, ignored: true, reason: "IA ou resposta automatica desativada" }, status: :ok
          end

          if duplicate_message?(instance, parsed)
            return render json: { success: true, ignored: true, reason: "Mensagem ja processada" }, status: :ok
          end

          if ai_paused?(instance, parsed)
            log_ai_webhook(instance, parsed, "skipped", "human_takeover")
            return render json: { success: true, ignored: true, reason: "human_takeover" }, status: :ok
          end

          if human_request?(parsed.text)
            answer = "Certo, vou deixar um atendente continuar por aqui."
            pause_conversation!(instance, parsed.phone, "customer_requested_human")
            send_result = EvolutionGoClient.new.send_text(
              instance.instance_token,
              phone: parsed.phone,
              message: answer
            )
            remember_ai_send(instance, parsed.phone)
            mark_message_processed(instance, parsed)
            log_ai_webhook(instance, parsed, "sent", nil, answer: answer, response: send_result, result: { intent: "human_request", status: "handoff" })
            return render json: { success: true, sent: true, company_id: instance.company_id, phone_last4: parsed.phone.last(4), status: "handoff", intent: "human_request" }, status: :ok
          end

          unless StoreAiRateLimiter.allow?(company: instance.company, phone: parsed.phone)
            log_ai_webhook(instance, parsed, "skipped", "rate_limit")
            return render json: { success: true, ignored: true, reason: "rate_limit" }, status: :ok
          end

          result = StoreAiService.call(
            company: instance.company,
            user: nil,
            question: parsed.text,
            phone: parsed.phone,
            simulate: false
          )
          answer = StoreAiWhatsappFormatter.format(result[:answer])

          if %w[disabled ignored limited].include?(result[:status]) || answer.blank?
            log_ai_webhook(instance, parsed, "skipped", result[:status], result: result)
            return render json: { success: true, ignored: true, reason: result[:status] }, status: :ok
          end

          begin
            send_result = EvolutionGoClient.new.send_text(
              instance.instance_token,
              phone: parsed.phone,
              message: answer
            )
          rescue EvolutionGoClient::Error => e
            log_ai_webhook(instance, parsed, "failed", e.message, answer: answer, result: result)
            raise
          end
          remember_ai_send(instance, parsed.phone)
          mark_message_processed(instance, parsed)
          log_ai_webhook(instance, parsed, "sent", nil, answer: answer, response: send_result, result: result)

          render json: {
            success: true,
            sent: true,
            company_id: instance.company_id,
            phone_last4: parsed.phone.last(4),
            status: result[:status],
            intent: result[:intent]
          }, status: :ok
        end

        def duplicate_message?(instance, parsed)
          return false if parsed.message_id.blank?

          Rails.cache.exist?("store-ai:evolution:#{instance.id}:#{parsed.message_id}")
        end

        def handle_from_me_message(parsed)
          instance = authorized_instance(parsed, require_token: false) || find_instance(parsed, require_token: false)
          return render json: { success: true, ignored: true, reason: parsed.ignored_reason }, status: :ok unless instance && parsed.phone.present?

          if recent_ai_send?(instance, parsed.phone)
            return render json: { success: true, ignored: true, reason: "Mensagem automatica enviada pela IA" }, status: :ok
          end

          pause_conversation!(instance, parsed.phone, "manual_whatsapp_reply")
          log_ai_webhook(instance, parsed, "skipped", "manual_whatsapp_reply")
          render json: { success: true, ignored: true, reason: "manual_whatsapp_reply" }, status: :ok
        end

        def ai_paused?(instance, parsed)
          conversation = StoreAiConversation.latest_for_phone(instance.company_id, parsed.phone).first
          conversation&.resume_if_expired!
          conversation&.paused?
        end

        def pause_conversation!(instance, phone, reason)
          normalized_phone = normalize_phone(phone)
          conversation = StoreAiConversation.latest_for_phone(instance.company_id, normalized_phone).first
          conversation ||= instance.company.store_ai_conversations.create!(
            phone: normalized_phone,
            channel: "whatsapp",
            status: "open",
            last_message_at: Time.current
          )
          conversation.pause_for!(30.minutes, reason: reason)
        end

        def human_request?(text)
          StoreAiIntentClassifier.call(text) == :human_request
        end

        def remember_ai_send(instance, phone)
          Rails.cache.write(ai_send_cache_key(instance, phone), true, expires_in: 45.seconds)
        end

        def recent_ai_send?(instance, phone)
          Rails.cache.exist?(ai_send_cache_key(instance, phone))
        end

        def ai_send_cache_key(instance, phone)
          "store-ai:evolution:recent-send:#{instance.id}:#{normalize_phone(phone)}"
        end

        def mark_message_processed(instance, parsed)
          return if parsed.message_id.blank?

          Rails.cache.write("store-ai:evolution:#{instance.id}:#{parsed.message_id}", true, expires_in: 24.hours)
        end

        def log_ai_webhook(instance, parsed, status, error = nil, answer: nil, response: nil, result: nil)
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
              intent: result&.dig(:intent),
              provider_called: result&.dig(:provider_called),
              fallback: result&.dig(:fallback),
              tokens_used: result&.dig(:tokens_estimated),
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
