module Api
  module V1
    module Store
      class ReportsController < BaseController
        before_action -> { require_feature!("advanced_reports") }

        def show
          orders = filtered_orders.includes(:customer, :order_items)
          serialized_orders = orders.map { |order| serialize_order(order) }
          completed = orders.select(&:completed?)
          cancelled = orders.select(&:cancelled?)

          received_revenue = completed.sum(&:total_cents)
          total_cost = completed.sum { |order| order.order_items.sum(&:total_cost_cents) }
          gross_profit = received_revenue - total_cost

          render_ok(
            summary: {
              gross_sales: orders.reject(&:cancelled?).sum(&:total_cents) / 100.0,
              received_revenue: received_revenue / 100.0,
              total_cost: total_cost / 100.0,
              gross_profit: gross_profit / 100.0,
              profit_margin: received_revenue.positive? ? (gross_profit * 100.0 / received_revenue).round(2) : 0,
              cancelled_revenue: cancelled.sum(&:total_cents) / 100.0,
              total_orders: orders.size,
              completed_orders: completed.size,
              cancelled_orders: cancelled.size,
              open_orders: orders.count { |order| !order.status.in?(%w[completed cancelled]) },
              average_ticket: completed.any? ? received_revenue / completed.size / 100.0 : 0,
              total_products_sold: completed.sum { |order| order.order_items.sum(&:quantity) }
            },
            status_totals: grouped_totals(orders, &:status),
            payment_totals: grouped_totals(completed, &:payment_method),
            origin_totals: origin_totals(completed),
            top_products: top_products(completed),
            hourly_sales: hourly_sales(completed),
            orders: serialized_orders
          )
        rescue ArgumentError
          render_error("Periodo invalido", status: :bad_request)
        end

        private

        def filtered_orders
          scope = company_scope(Order).recent
          scope = scope.where("orders.created_at >= ?", Time.zone.parse(params[:date_from])) if params[:date_from].present?
          scope = scope.where("orders.created_at <= ?", Time.zone.parse(params[:date_to])) if params[:date_to].present?
          scope.limit(2_000)
        end

        def grouped_totals(orders)
          orders.group_by { |order| yield(order) }.transform_values do |items|
            { count: items.size, total: items.sum(&:total_cents) / 100.0 }
          end
        end

        def top_products(orders)
          rows = orders.flat_map(&:order_items).group_by { |item| item.product_id || item.product_name }
          rows.map do |_key, items|
            revenue = items.sum(&:total_price_cents)
            cost = items.sum(&:total_cost_cents)
            {
              product_id: items.first.product_id,
              name: items.first.product_name,
              quantity: items.sum(&:quantity),
              revenue: revenue / 100.0,
              totalCost: cost / 100.0,
              grossProfit: (revenue - cost) / 100.0,
              profitMargin: revenue.positive? ? ((revenue - cost) * 100.0 / revenue).round(2) : 0
            }
          end.sort_by { |item| -item[:quantity] }.first(10)
        end

        def origin_totals(orders)
          origin_map = { "delivery" => "delivery", "dine_in" => "table", "pickup" => "pickup" }
          orders.group_by { |o| origin_map[o.order_type] || "other" }.transform_values do |items|
            { count: items.size, total: items.sum(&:total_cents) / 100.0 }
          end
        end

        def hourly_sales(orders)
          orders.group_by { |order| order.created_at.in_time_zone.hour }.map do |hour, items|
            { hour: hour, count: items.size, total: items.sum(&:total_cents) / 100.0 }
          end.sort_by { |item| item[:hour] }
        end

        def serialize_order(order)
          total_cost = order.order_items.sum(&:total_cost_cents)
          {
            id: order.id,
            order_number: order.order_number,
            customer_name: order.customer_name,
            status: order.status,
            payment_method: order.payment_method,
            subtotal: order.subtotal_cents / 100.0,
            delivery_fee: order.delivery_fee_cents / 100.0,
            discount_amount: order.discount_cents / 100.0,
            total: order.total_cents / 100.0,
            total_cost: total_cost / 100.0,
            gross_profit: (order.total_cents - total_cost) / 100.0,
            created_at: order.created_at,
            order_items: order.order_items.map do |item|
              {
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                total_price: item.total_price_cents / 100.0,
                total_cost_at_sale: item.total_cost_cents / 100.0,
                gross_profit_at_sale: (item.total_price_cents - item.total_cost_cents) / 100.0
              }
            end
          }
        end
      end
    end
  end
end
