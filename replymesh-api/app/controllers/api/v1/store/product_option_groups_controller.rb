module Api
  module V1
    module Store
      class ProductOptionGroupsController < BaseController
        before_action :set_product
        before_action :set_group, only: %i[show update destroy]

        def index
          groups = @product.product_option_groups.ordered.includes(:product_option_items)
          render_ok(option_groups: groups.map { |g| serialize(g) })
        end

        def show
          render_ok(option_group: serialize(@group))
        end

        def create
          group = @product.product_option_groups.build(group_params)
          if group.save
            render_created(option_group: serialize(group))
          else
            render_record_errors(group)
          end
        end

        def update
          if @group.update(group_params)
            render_ok(option_group: serialize(@group))
          else
            render_record_errors(@group)
          end
        end

        def destroy
          @group.destroy
          render_ok(message: "Grupo de opções removido")
        end

        private

        def set_product
          @product = company_scope(Product).find_by(id: params[:product_id])
          render_not_found("Produto") unless @product
        end

        def set_group
          @group = @product.product_option_groups.find_by(id: params[:id])
          render_not_found("Grupo de opções") unless @group
        end

        def group_params
          params.require(:option_group).permit(:name, :group_type, :required, :min_select, :max_select, :sort_order)
                .merge(company_id: current_company.id)
        end

        def serialize(g)
          g.as_json(only: %i[id name group_type required min_select max_select sort_order])
           .merge(items: g.product_option_items.ordered.as_json(
             only: %i[id name additional_price_cents is_active sort_order]
           ))
        end
      end
    end
  end
end
