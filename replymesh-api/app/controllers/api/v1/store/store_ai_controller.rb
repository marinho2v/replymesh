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

      end
    end
  end
end
