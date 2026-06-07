module Api
  module V1
    module Motoboy
      class HistoryController < BaseController
        def index
          deliveries = current_motoboy.delivery_histories
                                      .includes(:order)
                                      .where(status: "delivered")
                                      .order(delivered_at: :desc, assigned_at: :desc)
                                      .limit(page_limit)

          render_ok(history: deliveries.map { |delivery| serialize_delivery(delivery) })
        end

        private

        def page_limit
          [[params.fetch(:limit, 50).to_i, 1].max, 200].min
        end

        def serialize_delivery(delivery)
          {
            id: delivery.id,
            status: delivery.status,
            assigned_at: delivery.assigned_at,
            delivered_at: delivery.delivered_at,
            notes: delivery.notes,
            order: delivery.order&.as_json(
              only: %i[id order_number status delivery_status customer_name customer_phone
                       order_type payment_method total_cents created_at completed_at
                       delivery_latitude delivery_longitude google_maps_url waze_url
                       delivery_location_source delivery_location_received_at]
            )&.merge(total: delivery.order.total_brl)
          }
        end
      end
    end
  end
end
