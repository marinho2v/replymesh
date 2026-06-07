module Api
  module V1
    module Store
      class DeliveriesController < BaseController
        before_action :set_delivery, only: %i[show status complete]

        def index
          scope = company_scope(DeliveryHistory).includes(:order, :motoboy).recent
          scope = scope.where(status: params[:status]) if params[:status].present?
          scope = scope.where(motoboy_id: params[:motoboy_id]) if params[:motoboy_id].present?
          scope = scope.where("assigned_at >= ?", Time.zone.parse(params[:start_date])) if params[:start_date].present?
          scope = scope.where("assigned_at <= ?", Time.zone.parse(params[:end_date])) if params[:end_date].present?
          scope = apply_search(scope)

          render_ok(
            deliveries: scope.limit(page_limit).offset(page_offset).map { |delivery| serialize(delivery) },
            total: scope.count
          )
        rescue ArgumentError
          render_error("Periodo invalido", status: :bad_request)
        end

        def show
          render_ok(delivery: serialize_full(@delivery))
        end

        def assign
          order = company_scope(Order).find_by(id: params.require(:order_id))
          return render_not_found("Pedido") unless order

          motoboy = company_scope(::Motoboy).find_by(id: params.require(:motoboy_id))
          return render_not_found("Motoboy") unless motoboy

          result = DeliveryService.assign(order: order, motoboy: motoboy, user: current_user, notes: params[:notes])

          if result.success?
            render_created(delivery: serialize_full(result.data.delivery_history))
          else
            render_error(result.error)
          end
        end

        def status
          result = DeliveryService.update_status(
            order: @delivery.order,
            new_delivery_status: params.require(:delivery_status),
            motoboy: @delivery.motoboy
          )

          if result.success?
            render_ok(delivery: serialize_full(result.data.delivery_history))
          else
            render_error(result.error)
          end
        end

        def complete
          result = DeliveryService.complete(
            order: @delivery.order,
            motoboy: @delivery.motoboy,
            notes: params[:notes],
            user: current_user
          )

          if result.success?
            render_ok(delivery: serialize_full(result.data.delivery_history))
          else
            render_error(result.error)
          end
        end

        private

        def set_delivery
          @delivery = company_scope(DeliveryHistory).includes(:order, :motoboy).find_by(id: params[:id])
          render_not_found("Entrega") unless @delivery
        end

        def serialize(delivery)
          {
            id: delivery.id,
            status: delivery.status,
            assigned_at: delivery.assigned_at,
            delivered_at: delivery.delivered_at,
            motoboy: delivery.motoboy&.slice("id", "name", "phone", "active", "is_available"),
            order: serialize_order(delivery.order)
          }
        end

        def serialize_full(delivery)
          serialize(delivery).merge(
            notes: delivery.notes,
            order: serialize_order(delivery.order, full: true)
          )
        end

        def serialize_order(order, full: false)
          return unless order

          result = order.as_json(
            only: %i[id order_number status delivery_status customer_name customer_phone created_at]
          ).merge(
            total: order.total_cents.to_f / 100,
            subtotal: order.subtotal_cents.to_f / 100,
            delivery_fee: order.delivery_fee_cents.to_f / 100,
            discount_amount: order.discount_cents.to_f / 100
          )
          return result unless full

          result.merge(order.as_json(
            only: %i[order_type payment_method payment_status street number complement
                     neighborhood city state updated_at]
          ))
        end

        def apply_search(scope)
          term = params[:search].to_s.strip
          return scope if term.blank?

          scope.joins(:order, :motoboy).where(
            "orders.order_number ILIKE :term OR orders.customer_name ILIKE :term OR orders.customer_phone ILIKE :term OR motoboys.name ILIKE :term",
            term: "%#{ActiveRecord::Base.sanitize_sql_like(term)}%"
          )
        end
      end
    end
  end
end
