module Api
  module V1
    module Store
      class CustomersController < BaseController
        before_action :set_customer, only: %i[show update]

        def index
          scope = company_scope(Customer).recent
          scope = scope.where("full_name ILIKE ? OR phone ILIKE ?", "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?
          scope = scope.recurring if params[:recurring] == "true"
          render_ok(
            customers: scope.limit(page_limit).offset(page_offset).map { |c| serialize(c) },
            total: scope.count
          )
        end

        def show
          render_ok(customer: serialize_full(@customer))
        end

        def create
          customer = company_scope(Customer).build(customer_params)
          if customer.save
            render_created(customer: serialize(customer))
          else
            render_record_errors(customer)
          end
        end

        def update
          if @customer.update(customer_params)
            render_ok(customer: serialize(@customer))
          else
            render_record_errors(@customer)
          end
        end

        private

        def set_customer
          @customer = company_scope(Customer).find_by(id: params[:id])
          render_not_found("Cliente") unless @customer
        end

        def customer_params
          params.require(:customer).permit(:full_name, :phone, :whatsapp, :email, :notes)
                .merge(company_id: current_company.id)
        end

        def serialize(c)
          c.as_json(only: %i[id full_name phone whatsapp email total_orders total_spent_cents is_recurring last_order_at])
           .merge(total_spent_brl: c.total_spent_brl)
        end

        def serialize_full(c)
          serialize(c).merge(
            addresses: c.customer_addresses.default_first.as_json(
              only: %i[id zip_code street number complement neighborhood city state reference is_default]
            ),
            orders: c.orders.includes(:order_items).order(created_at: :desc).limit(50).map { |order| serialize_order(order) }
          )
        end

        def serialize_order(order)
          {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            order_type: order.order_type,
            payment_method: order.payment_method,
            subtotal_cents: order.subtotal_cents,
            subtotal: order.subtotal_cents.to_i / 100.0,
            delivery_fee_cents: order.delivery_fee_cents,
            delivery_fee: order.delivery_fee_cents.to_i / 100.0,
            discount_cents: order.discount_cents,
            discount_amount: order.discount_cents.to_i / 100.0,
            total_cents: order.total_cents,
            total: order.total_cents.to_i / 100.0,
            coupon_code: order.coupon_code,
            created_at: order.created_at,
            completed_at: order.completed_at,
            order_items: order.order_items.map { |item|
              {
                id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price_cents: item.unit_price_cents,
                unit_price: item.unit_price_cents.to_i / 100.0,
                total_price_cents: item.total_price_cents,
                total_price: item.total_price_cents.to_i / 100.0,
                selected_options: item.selected_options,
                notes: item.notes
              }
            }
          }
        end
      end
    end
  end
end
