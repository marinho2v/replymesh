module Api
  module V1
    module Store
      class DashboardController < BaseController
        before_action -> { require_feature!("dashboard") }
        BUSINESS_TIME_ZONE = "America/Sao_Paulo".freeze

        # GET /api/v1/store/dashboard
        def show
          render_ok(
            ReplymeshCacheService.fetch(
              company: current_company,
              group: :dashboard,
              endpoint: :store_dashboard,
              expires_in: 30.seconds
            ) { dashboard_payload }
          )
        end

        private

        def dashboard_payload
          zone = ActiveSupport::TimeZone[BUSINESS_TIME_ZONE]
          local_today = Time.current.in_time_zone(zone).to_date
          today_range = local_day_range(local_today, zone)

          today_orders     = company_scope(Order).where(created_at: today_range)
          valid_today      = today_orders.where.not(status: "cancelled")
          completed_today  = valid_today.where(status: "completed")
          today_revenue    = completed_today.sum(:total_cents)
          yesterday_revenue = company_scope(Order)
            .where(status: "completed", created_at: local_day_range(local_today.yesterday, zone))
            .sum(:total_cents)
          revenue_change_percent = percentage_change(today_revenue, yesterday_revenue)
          today_count      = valid_today.count
          completed_count  = completed_today.count
          avg_ticket       = completed_count > 0 ? today_revenue / completed_count : 0

          new_customers    = company_scope(Customer).where(created_at: today_range).count
          recurring        = company_scope(Customer).recurring.count

          status_counts    = today_orders.reorder(nil).group(:status).count
          total_orders     = company_scope(Order).count
          total_revenue    = company_scope(Order).where(status: "completed").sum(:total_cents)
          used_coupons     = valid_today.where.not(coupon_id: nil).count

          low_stock      = company_scope(InventoryItem).active.low_stock.count
          out_of_stock   = company_scope(InventoryItem).active.where("current_quantity <= 0").count

          trend_data = build_trend_data(local_today, zone)

          {
            today_revenue_cents:  today_revenue,
            yesterday_revenue_cents: yesterday_revenue,
            today_revenue_change_percent: revenue_change_percent,
            today_orders:         today_count,
            average_ticket_cents: avg_ticket,
            new_customers_today:  new_customers,
            status_counts:        status_counts,
            total_orders:         total_orders,
            total_revenue_cents:  total_revenue,
            low_stock_items:      low_stock,
            out_of_stock_items:   out_of_stock,
            recurring_customers:  recurring,
            used_coupons:         used_coupons,
            trend_data:           trend_data,
            sales_coach:          sales_coach_summary
          }
        end

        def sales_coach_summary
          SalesCoachLearningService.call(company: current_company)[:summary] || {}
        rescue StandardError => e
          Rails.logger.warn("[DashboardController] sales coach skipped company=#{current_company&.id}: #{e.class} #{e.message}")
          {}
        end

        def build_trend_data(local_today, zone)
          (6).downto(0).map do |days_ago|
            date = local_today - days_ago
            revenue = company_scope(Order)
              .where(status: "completed", created_at: local_day_range(date, zone))
              .sum(:total_cents)

            { date: date.iso8601, revenue_cents: revenue }
          end
        end

        def local_day_range(date, zone)
          starts_at = zone.local(date.year, date.month, date.day)
          ends_at = zone.local(date.next_day.year, date.next_day.month, date.next_day.day)
          starts_at.utc...ends_at.utc
        end

        def percentage_change(current_value, previous_value)
          return 0.0 if current_value.zero? && previous_value.zero?
          return 100.0 if previous_value.zero?

          (((current_value - previous_value).to_f / previous_value) * 100).round(1)
        end
      end
    end
  end
end
