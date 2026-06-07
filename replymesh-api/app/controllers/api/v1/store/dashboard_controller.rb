module Api
  module V1
    module Store
      class DashboardController < BaseController
        # GET /api/v1/store/dashboard
        def show
          today_range = Time.current.beginning_of_day..Time.current.end_of_day
          week_range  = 6.days.ago.beginning_of_day..Time.current.end_of_day

          today_orders     = company_scope(Order).today
          completed_today  = today_orders.where(status: "completed")
          today_revenue    = completed_today.sum(:total_cents)
          today_count      = today_orders.count
          avg_ticket       = today_count > 0 ? today_revenue / today_count : 0

          new_customers    = company_scope(Customer).where(created_at: today_range).count
          recurring        = company_scope(Customer).recurring.count

          status_counts    = company_scope(Order).active.group(:status).count
          total_orders     = company_scope(Order).count
          total_revenue    = company_scope(Order).where(status: "completed").sum(:total_cents)
          used_coupons     = company_scope(Order).today.where.not(coupon_id: nil).count

          low_stock      = company_scope(InventoryItem).active.low_stock.count
          out_of_stock   = company_scope(InventoryItem).active.where("current_quantity <= 0").count

          trend_data = build_trend_data(week_range)

          render_ok(
            today_revenue_cents:  today_revenue,
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
            trend_data:           trend_data
          )
        end

        private

        def build_trend_data(range)
          rows = company_scope(Order)
            .where(status: "completed", created_at: range)
            .group("DATE(created_at AT TIME ZONE 'America/Sao_Paulo')")
            .sum(:total_cents)

          (0..6).map do |days_ago|
            date = days_ago.days.ago.to_date
            { date: date.iso8601, revenue_cents: rows[date] || 0 }
          end.reverse
        end
      end
    end
  end
end
