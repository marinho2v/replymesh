module Api
  module V1
    module Store
      class DeliveryZonesController < BaseController
        before_action -> { require_feature!("delivery_zones") }
        before_action :set_zone, only: %i[show update destroy]

        def index
          zones = company_scope(DeliveryZone).order(:name)
          render_ok(delivery_zones: zones.map { |z| serialize(z) })
        end

        def show
          render_ok(delivery_zone: serialize(@zone))
        end

        def create
          zone = company_scope(DeliveryZone).build(zone_params)
          if zone.save
            render_created(delivery_zone: serialize(zone))
          else
            render_record_errors(zone)
          end
        end

        def update
          if @zone.update(zone_params)
            render_ok(delivery_zone: serialize(@zone))
          else
            render_record_errors(@zone)
          end
        end

        def destroy
          @zone.destroy
          render_ok(message: "Zona de entrega removida")
        end

        private

        def set_zone
          @zone = company_scope(DeliveryZone).find_by(id: params[:id])
          render_not_found("Zona de entrega") unless @zone
        end

        def zone_params
          params.require(:delivery_zone).permit(
            :name, :slug, :city, :delivery_fee_cents, :estimated_minutes,
            :minimum_order_cents, :match_priority, :is_active, aliases: []
          ).merge(company_id: current_company.id)
        end

        def serialize(z)
          z.as_json(only: %i[id name slug city aliases delivery_fee_cents estimated_minutes
                             minimum_order_cents match_priority is_active created_at updated_at])
        end
      end
    end
  end
end
