module Api
  module V1
    module Store
      class StoreAiController < BaseController
        before_action -> { require_feature!("store_ai") }

        def settings
          render_ok(settings: setting.as_json_safe, metrics: ai_metrics)
        end

        def update_settings
          if setting.update(setting_params)
            render_ok(settings: setting.as_json_safe)
          else
            render_record_errors(setting)
          end
        end

        def simulate
          result = StoreAiService.call(
            company: current_company,
            user: current_user,
            question: params[:message] || params[:question],
            phone: params[:phone],
            simulate: true
          )
          render_ok(result)
        end

        def logs
          range = logs_range(params[:period])
          conversations = current_company.store_ai_conversations
            .includes(:customer, :store_ai_messages)
            .where(created_at: range)
            .order(created_at: :desc)
            .limit(100)

          usage_logs = current_company.ai_usage_logs
            .where(assistant_type: "store_ai", created_at: range)
            .order(:created_at)
            .to_a
          orders = current_company.orders
            .where(legacy_source: "whatsapp_ai", created_at: range)
            .order(:created_at)
            .to_a

          render_ok(
            logs: conversations.flat_map { |conversation|
              serialize_conversation_logs(conversation, usage_logs, orders)
            }.sort_by { |item| item[:created_at] }.reverse.first(200),
            company: current_company.slice(:id, :name, :slug),
            period: params[:period].presence || "today"
          )
        end

        private

        def setting
          @setting ||= StoreAiSetting.for_company(current_company)
        end

        def setting_params
          params.require(:settings).permit(
            :enabled, :auto_reply_whatsapp, :assistant_name, :initial_message, :tone,
            :allow_orders, :allow_products, :allow_hours, :allow_delivery, :allow_payments,
            :allow_promotions, :allow_order_status,
            :ai_provider, :ai_model, :ai_mode, :ai_sales_mode_enabled, :ai_auto_reply_enabled,
            :ai_daily_message_limit, :ai_monthly_message_limit, :ai_monthly_token_limit,
            :identify_customer_by_phone, :confirm_saved_address, :create_customer, :allow_address_update,
            :auto_cart_enabled, :create_order_after_confirmation, :calculate_delivery_fee,
            :verify_store_hours, :verify_delivery_area, :apply_coupon_enabled,
            :offer_cash, :offer_pix, :auto_generate_mercadopago_pix, :send_pix_copy_paste,
            :wait_payment_confirmation, :pause_on_attendant_reply, :pause_after_order_confirmation,
            :handoff_on_unknown, :handoff_on_request
          )
        end

        def ai_metrics
          today = Time.current.all_day
          conversations_today = current_company.store_ai_conversations.where(created_at: today).count
          messages_answered = StoreAiMessage
            .joins(:store_ai_conversation)
            .where(store_ai_conversations: { company_id: current_company.id })
            .where(role: "assistant", created_at: today)
            .count
          helped_orders = current_company.orders.where(legacy_source: "whatsapp_ai", created_at: today).count
          saved_minutes = messages_answered * 2

          {
            conversations_today: conversations_today,
            helped_orders: helped_orders,
            answered_messages: messages_answered,
            estimated_saving_minutes: saved_minutes,
            estimated_saving_label: saved_minutes.positive? ? "#{saved_minutes} min" : "0 min"
          }
        end

        def logs_range(period)
          case period.to_s
          when "yesterday"
            1.day.ago.all_day
          when "7days"
            6.days.ago.beginning_of_day..Time.current.end_of_day
          else
            Time.current.all_day
          end
        end

        def serialize_conversation_logs(conversation, usage_logs, orders)
          messages = conversation.store_ai_messages.sort_by(&:created_at)
          messages.each_with_index.filter_map do |message, index|
            next unless message.role == "assistant"

            question = messages[0...index].reverse.find { |item| item.role == "user" }
            usage = nearest_record(usage_logs, message.created_at)
            order = orders.find do |item|
              same_phone?(item.customer_phone, conversation.phone) &&
                (item.created_at - message.created_at).abs <= 30.seconds
            end
            status = usage&.status || (conversation.status == "handed_off" ? "handoff" : "success")

            {
              id: message.id,
              conversation_id: conversation.id,
              customer: conversation.customer&.full_name,
              phone: masked_phone(conversation.phone),
              question: question&.content,
              answer: message.content,
              response_time_ms: message.response_time_ms.to_i.nonzero? || usage&.response_time_ms.to_i,
              tokens: message.tokens_used.to_i.nonzero? || usage&.total_tokens.to_i,
              provider: usage&.provider.presence || "sales_flow",
              status: status,
              order_created: order.present?,
              order_number: order&.order_number,
              error: status.in?(%w[error fallback blocked]) ? message.content : nil,
              reason: conversation.handoff_reason,
              channel: conversation.channel,
              created_at: message.created_at
            }
          end
        end

        def nearest_record(records, timestamp)
          records
            .select { |item| (item.created_at - timestamp).abs <= 10.seconds }
            .min_by { |item| (item.created_at - timestamp).abs }
        end

        def same_phone?(left, right)
          left_digits = left.to_s.gsub(/\D/, "")
          right_digits = right.to_s.gsub(/\D/, "")
          left_digits.present? && right_digits.present? &&
            (left_digits == right_digits || left_digits.last(11) == right_digits.last(11))
        end

        def masked_phone(value)
          digits = value.to_s.gsub(/\D/, "")
          return "-" if digits.blank?

          "••••#{digits.last(4)}"
        end

      end
    end
  end
end
