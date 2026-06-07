module Api
  module V1
    module Store
      class InventoryMovementsController < BaseController
        def index
          scope = company_scope(InventoryMovement).includes(:inventory_item).recent

          scope = scope.where(inventory_item_id: params[:inventory_item_id]) if params[:inventory_item_id].present?
          scope = scope.where(movement_type: params[:type])  if params[:type].present?
          scope = scope.where(source: params[:source])       if params[:source].present?

          render_ok(
            movements: scope.limit(page_limit).offset(page_offset).map { |m| serialize(m) },
            total: scope.count
          )
        end

        private

        def serialize(m)
          m.as_json(only: %i[id movement_type quantity quantity_before quantity_after source reason notes created_at])
           .merge(item_name: m.inventory_item&.name)
        end
      end
    end
  end
end
