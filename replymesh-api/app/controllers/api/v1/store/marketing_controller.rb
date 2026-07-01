module Api
  module V1
    module Store
      class MarketingController < BaseController
        before_action :require_marketing_feature!

        def customers
          scope = current_company.customers.includes(:customer_addresses).where.not(phone: [nil, ""])
          scope = apply_audience_filter(scope)
          render_ok(customers: scope.order(last_order_at: :desc).limit(500).map { |customer| serialize_customer(customer) })
        end

        def campaigns
          render_ok(campaigns: current_company.marketing_campaigns.order(created_at: :desc).limit(50).map { |item| serialize_campaign(item) })
        end

        def create_campaign
          campaign = current_company.marketing_campaigns.new(campaign_params)
          customer_ids = Array(params[:customer_ids]).map(&:to_i).uniq
          customers = current_company.customers.where(id: customer_ids)
          campaign.total_recipients = customers.size
          campaign.status = "draft"

          MarketingCampaign.transaction do
            campaign.save!
            customers.each do |customer|
              message = personalize(campaign.message_template, customer, campaign.coupon_code)
              campaign.marketing_campaign_recipients.create!(
                company: current_company, customer: customer, phone: customer.phone,
                personalized_message: message, status: "pending"
              )
            end
          end
          render_created(campaign: serialize_campaign(campaign))
        rescue ActiveRecord::RecordInvalid => e
          render_error(e.record.errors.full_messages.first)
        end

        def send_individual
          log = MarketingMessageService.send!(
            company: current_company, phone: params[:phone], message: params[:message]
          )
          render_created(log: serialize_log(log))
        rescue ArgumentError, EvolutionGoClient::Error => e
          render_error(e.message)
        end

        def send_campaign
          campaign = current_company.marketing_campaigns.find(params[:id])
          return render_error("Confirmacao obrigatoria", status: :bad_request) unless ActiveModel::Type::Boolean.new.cast(params[:confirm])

          limit = [campaign.daily_limit, campaign.marketing_campaign_recipients.pending.count].min
          sent = 0
          failed = 0
          campaign.update!(status: "active", started_at: campaign.started_at || Time.current)
          campaign.marketing_campaign_recipients.pending.limit(limit).each do |recipient|
            begin
              MarketingMessageService.send!(
                company: current_company, phone: recipient.phone, message: recipient.personalized_message,
                customer: recipient.customer, campaign: campaign
              )
              recipient.update!(status: "sent", sent_at: Time.current)
              sent += 1
            rescue StandardError => e
              recipient.update!(status: "failed", error_message: e.message.to_s.first(500))
              failed += 1
            end
          end
          campaign.update!(
            sent_count: campaign.sent_count + sent, failed_count: campaign.failed_count + failed,
            status: campaign.marketing_campaign_recipients.pending.exists? ? "paused" : "completed",
            completed_at: campaign.marketing_campaign_recipients.pending.exists? ? nil : Time.current
          )
          render_ok(campaign: serialize_campaign(campaign), sent: sent, failed: failed)
        end

        def recovery_customers
          days = [7, 15, 30, 60, 90].include?(params[:days].to_i) ? params[:days].to_i : 30
          customers = current_company.customers.where("last_order_at <= ?", days.days.ago).where.not(phone: [nil, ""])
          render_ok(customers: customers.order(last_order_at: :asc).limit(500).map { |customer| serialize_customer(customer).merge(days_without_order: ((Time.current - customer.last_order_at) / 1.day).floor, average_ticket_cents: customer.total_orders.positive? ? customer.total_spent_cents / customer.total_orders : 0) })
        end

        def sales_recovery
          setting = SalesRecoverySetting.for_company(current_company)
          render_ok(
            settings: setting.as_json_safe,
            metrics: sales_recovery_metrics,
            logs: current_company.sales_recovery_events.includes(:coupon, :customer, :store_ai_cart)
              .order(created_at: :desc).limit(80).map { |event| serialize_recovery_event(event) }
          )
        end

        def sales_recovery_settings
          render_ok(settings: SalesRecoverySetting.for_company(current_company).as_json_safe)
        end

        def update_sales_recovery_settings
          setting = SalesRecoverySetting.for_company(current_company)
          setting.update!(sales_recovery_setting_params)
          render_ok(settings: setting.as_json_safe)
        rescue ActiveRecord::RecordInvalid => e
          render_record_errors(e.record)
        end

        def run_sales_recovery
          result = SalesRecoveryEngine.call(company: current_company)
          render_ok(result: result, metrics: sales_recovery_metrics)
        end

        private

        def require_marketing_feature!
          feature = action_name.to_s.start_with?("sales_recovery") || action_name == "recovery_customers" || action_name == "run_sales_recovery" ? "sales_recovery" : "marketing_whatsapp"
          require_feature!(feature)
        end

        def apply_audience_filter(scope)
          case params[:filter]
          when "recurring" then scope.where(is_recurring: true)
          when "new" then scope.where(total_orders: 0..1)
          when "inactive_30" then scope.where("last_order_at <= ?", 30.days.ago)
          when "inactive_60" then scope.where("last_order_at <= ?", 60.days.ago)
          when "inactive_90" then scope.where("last_order_at <= ?", 90.days.ago)
          else scope
          end
        end

        def campaign_params
          params.require(:campaign).permit(:title, :message_template, :coupon_code, :pause_seconds, :daily_limit)
        end

        def sales_recovery_setting_params
          params.require(:settings).permit(
            :enabled, :delay_minutes, :daily_limit, :window_start, :window_end, :use_ai,
            :auto_coupon, :default_discount_percent, :free_delivery, :coupon_validity_hours,
            :per_customer_daily_limit, :queue_spacing_minutes, :cooldown_hours,
            :recent_response_minutes, :min_cart_total_cents, :quiet_hours_enabled,
            :quiet_window_start, :quiet_window_end, :message_template,
            coupon_rules_json: {},
            allowed_weekdays: []
          )
        end

        def serialize_customer(customer)
          address = customer.customer_addresses.first
          { id: customer.id, full_name: customer.full_name, phone: customer.whatsapp.presence || customer.phone,
            total_orders: customer.total_orders, total_spent_cents: customer.total_spent_cents,
            last_order_at: customer.last_order_at, neighborhood: address&.neighborhood, city: address&.city }
        end

        def serialize_campaign(item)
          { id: item.id, title: item.title, status: item.status, message_template: item.message_template,
            coupon_code: item.coupon_code, pause_seconds: item.pause_seconds, daily_limit: item.daily_limit,
            total_recipients: item.total_recipients, sent_count: item.sent_count, failed_count: item.failed_count,
            created_at: item.created_at, completed_at: item.completed_at }
        end

        def serialize_log(log)
          { id: log.id, phone: log.phone, status: log.status, sent_at: log.sent_at, provider: log.provider }
        end

        def sales_recovery_metrics
          today = current_company.sales_recovery_events.today_for(current_company)
          recovered = current_company.sales_recovery_events.recovered
          sent = current_company.sales_recovery_events.where(status: %w[sent recovered])
          blocked = current_company.sales_recovery_events.where(status: "skipped")
          average_score = current_company.sales_recovery_events.where(status: %w[queued sent recovered skipped]).average(:recovery_score)
          top_coupon = recovered.where.not(coupon_id: nil).joins(:coupon).group("coupons.code").count.max_by { |_code, count| count }
          top_products = current_company.sales_recovery_events
            .where(status: %w[sent recovered])
            .order(created_at: :desc)
            .limit(200)
            .flat_map { |event| Array(event.cart_snapshot["items"]) }
            .group_by { |item| item["name"].presence || item["product_name"].presence || "Produto" }
            .map { |name, rows| { name: name, count: rows.size } }
            .sort_by { |row| -row[:count] }
            .first(5)

          {
            today_recovered: today.recovered.count,
            recovered_carts: recovered.count,
            recovered_value_cents: recovered.sum(:recovered_value_cents),
            messages_sent: sent.count,
            recovery_rate_percent: sent.count.positive? ? ((recovered.count.to_f / sent.count) * 100).round(1) : 0,
            coupons_used: recovered.where.not(coupon_id: nil).count,
            blocked_messages: blocked.count,
            average_recovery_score: average_score.to_f.round(1),
            top_coupon: top_coupon ? { code: top_coupon[0], count: top_coupon[1] } : nil,
            average_recovered_value_cents: recovered.count.positive? ? (recovered.sum(:recovered_value_cents) / recovered.count) : 0,
            queued: current_company.sales_recovery_events.queued.count,
            failed: current_company.sales_recovery_events.where(status: "failed").count,
            top_products: top_products
          }
        end

        def serialize_recovery_event(event)
          {
            id: event.id,
            customer: event.customer&.full_name,
            phone: event.customer_phone,
            cart_id: event.store_ai_cart_id,
            status: event.status,
            message: event.message,
            coupon: event.coupon&.code,
            block_reason: event.block_reason,
            recovery_score: event.recovery_score,
            abandoned_minutes: event.abandoned_minutes,
            delivery_strategy: event.delivery_strategy,
            response: event.responded_at.present? ? "respondeu" : nil,
            purchase: event.recovered_order_id.present?,
            ignored: event.status == "ignored",
            error: event.error_message,
            sent_at: event.sent_at,
            recovered_at: event.recovered_at,
            cart_total_cents: event.cart_total_cents,
            recovered_value_cents: event.recovered_value_cents,
            created_at: event.created_at
          }
        end

        def personalize(template, customer, coupon)
          value = template.to_s
          value = value.lines.reject { |line| line.match?(/\{cupom\}/i) }.join if coupon.blank?
          value.gsub(/\{nome\}/i, customer.full_name).gsub(/\{telefone\}/i, customer.phone)
            .gsub(/\{cupom\}/i, coupon.to_s).gsub(/\{link_loja\}/i, public_store_url).strip
        end

        def public_store_url
          "https://#{current_company.slug}.replymesh.cloud"
        end
      end
    end
  end
end
