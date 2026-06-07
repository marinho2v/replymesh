module Api
  module V1
    module Store
      class ProductOptionItemsController < BaseController
        before_action :set_group
        before_action :set_item, only: %i[show update destroy]

        def index
          items = @group.product_option_items.ordered
          render_ok(items: items.as_json(only: %i[id name additional_price_cents is_active sort_order]))
        end

        def show
          render_ok(item: @item.as_json(only: %i[id name additional_price_cents is_active sort_order]))
        end

        def create
          item = @group.product_option_items.build(item_params)
          if item.save
            render_created(item: item.as_json(only: %i[id name additional_price_cents is_active sort_order]))
          else
            render_record_errors(item)
          end
        end

        def update
          if @item.update(item_params)
            render_ok(item: @item.as_json(only: %i[id name additional_price_cents is_active sort_order]))
          else
            render_record_errors(@item)
          end
        end

        def destroy
          @item.destroy
          render_ok(message: "Item removido")
        end

        private

        def set_group
          product = company_scope(Product).find_by(id: params[:product_id])
          @group = product&.product_option_groups&.find_by(id: params[:option_group_id] || params[:product_option_group_id])
          render_not_found("Grupo de opções") unless @group
        end

        def set_item
          @item = @group.product_option_items.find_by(id: params[:id])
          render_not_found("Item") unless @item
        end

        def item_params
          params.require(:item).permit(:name, :additional_price_cents, :is_active, :sort_order)
                .merge(company_id: current_company.id)
        end
      end
    end
  end
end
