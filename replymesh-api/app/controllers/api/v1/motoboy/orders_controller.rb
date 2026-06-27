module Api
  module V1
    module Motoboy
      class OrdersController < BaseController
        before_action :set_order, only: %i[start complete]

        def index
          orders = current_company.orders
                                  .includes(:delivery_history, :order_items, :delivery_zone)
                                  .where(motoboy_id: current_motoboy.id, delivery_status: %w[assigned on_the_way])
                                  .to_a
          route = DeliveryRouteService.call(orders: orders)

          render_ok(
            orders: route.orders.each_with_index.map { |order, index| serialize_order(order, route_position: index + 1) },
            route: {
              summary: route.summary,
              maps_url: route.maps_url
            }
          )
        end

        def start
          unless @order.delivery_status == "assigned"
            return render_error("Entrega precisa estar atribuida para iniciar")
          end

          result = nil
          rollback_reason = nil

          ActiveRecord::Base.transaction do
            result = DeliveryService.update_status(
              order: @order,
              new_delivery_status: "on_the_way",
              motoboy: current_motoboy
            )
            unless result.success?
              rollback_reason = result.error
              raise ActiveRecord::Rollback
            end

            if @order.reload.status != "out_for_delivery"
              status_result = OrderStatusService.call(
                order: @order,
                new_status: "out_for_delivery",
                user: current_user,
                skip_side_effects: true
              )
              unless status_result.success?
                rollback_reason = status_result.error
                raise ActiveRecord::Rollback
              end
            end
          end

          return render_error(rollback_reason) if rollback_reason

          render_ok(order: serialize_order(@order.reload))
        end

        def complete
          unless @order.delivery_status.in?(%w[assigned on_the_way])
            return render_error("Entrega precisa estar atribuida ou em andamento para finalizar")
          end

          result = DeliveryService.complete(
            order: @order,
            motoboy: current_motoboy,
            user: current_user,
            notes: params[:notes]
          )

          if result.success?
            render_ok(order: serialize_order(result.data.reload))
          else
            render_error(result.error)
          end
        end

        private

        def set_order
          @order = current_company.orders
                                  .includes(:delivery_history, :order_items, :delivery_zone)
                                  .find_by(id: params[:id], motoboy_id: current_motoboy.id)
          render_not_found("Pedido") unless @order
        end

        def serialize_order(order, route_position: nil)
          {
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            delivery_status: order.delivery_status,
            order_type: order.order_type,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            delivery_fee_cents: order.delivery_fee_cents,
            delivery_fee: order.delivery_fee_cents.to_f / 100,
            total_cents: order.total_cents,
            total: order.total_brl,
            notes: order.notes,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_whatsapp: order.customer_whatsapp,
            delivery_latitude: order.delivery_latitude,
            delivery_longitude: order.delivery_longitude,
            google_maps_url: order.google_maps_url,
            waze_url: order.waze_url,
            delivery_location_source: order.delivery_location_source,
            delivery_location_received_at: order.delivery_location_received_at,
            delivery_area_name: order.delivery_area_name,
            estimated_distance_km: order.estimated_distance_km,
            estimated_delivery_minutes: order.estimated_delivery_minutes,
            logistics_group: order.logistics_group,
            route_priority: order.route_priority,
            route_position: route_position,
            address: order.delivery? ? {
              street: order.street,
              number: order.number,
              complement: order.complement,
              neighborhood: order.neighborhood,
              city: order.city,
              state: order.state,
              reference: order.reference
            } : nil,
            delivery_zone: order.delivery_zone&.slice(
              "id", "name", "delivery_fee_cents", "estimated_minutes",
              "estimated_distance_km", "logistics_group", "match_priority"
            ),
            delivery_history: order.delivery_history&.as_json(only: %i[id status assigned_at delivered_at notes]),
            assigned_at: order.delivery_history&.assigned_at,
            delivered_at: order.delivery_history&.delivered_at,
            items: order.order_items.map { |item|
              item.as_json(only: %i[id product_name quantity unit_price_cents total_price_cents selected_options notes])
            },
            created_at: order.created_at,
            accepted_at: order.accepted_at,
            preparing_at: order.preparing_at,
            ready_at: order.ready_at,
            out_for_delivery_at: order.out_for_delivery_at,
            completed_at: order.completed_at
          }
        end
      end
    end
  end
end
