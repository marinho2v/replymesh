module Api
  module V1
    module Store
      class InventoryItemsController < BaseController
        before_action :set_item, only: %i[show update destroy entry adjust]

        def index
          scope = company_scope(InventoryItem).active
          scope = scope.low_stock if params[:low_stock] == "true"
          render_ok(inventory_items: scope.map { |i| serialize(i) }, total: scope.count)
        end

        def show
          render_ok(inventory_item: serialize_full(@item))
        end

        def create
          item = company_scope(InventoryItem).build(item_params)
          if item.save
            render_created(inventory_item: serialize(item))
          else
            render_record_errors(item)
          end
        end

        def update
          if @item.update(item_params)
            render_ok(inventory_item: serialize(@item))
          else
            render_record_errors(@item)
          end
        end

        def destroy
          @item.update!(is_active: false)
          render_ok(message: "Item desativado")
        end

        # POST /store/inventory_items/:id/entry
        def entry
          result = InventoryService.entry(
            item:   @item,
            qty:    params.require(:quantity).to_d,
            user:   current_user,
            reason: params[:reason],
            notes:  params[:notes]
          )
          if result.success?
            render_ok(inventory_item: serialize(result.data), message: "Entrada registrada")
          else
            render_error(result.error)
          end
        end

        # POST /store/inventory_items/:id/adjust
        def adjust
          qty = params.require(:quantity).to_d
          @item.apply_movement!(
            type: "adjust",
            qty: qty,
            source: "ajuste",
            reason: params[:reason] || "Ajuste manual",
            user: current_user,
            notes: params[:notes]
          )
          render_ok(inventory_item: serialize(@item.reload), message: "Estoque ajustado")
        rescue ActiveRecord::RecordInvalid => e
          render_error(e.record.errors.full_messages.join(", "))
        end

        private

        def set_item
          @item = company_scope(InventoryItem).find_by(id: params[:id])
          render_not_found("Item de estoque") unless @item
        end

        def item_params
          params.require(:inventory_item).permit(:name, :slug, :unit, :category,
                                                  :minimum_quantity, :cost_price, :is_active, :notes)
                .merge(company_id: current_company.id)
        end

        def serialize(i)
          i.as_json(only: %i[id name slug unit category current_quantity minimum_quantity cost_price is_active])
           .merge(low_stock: i.low_stock?, in_stock: i.in_stock?)
        end

        def serialize_full(i)
          serialize(i).merge(
            recent_movements: i.inventory_movements.recent.limit(10).as_json(
              only: %i[id movement_type quantity quantity_before quantity_after source reason created_at]
            )
          )
        end
      end
    end
  end
end
