module Api
  module V1
    module Store
      class ProductsController < BaseController
        before_action :set_product, only: %i[show update destroy]

        def index
          scope = company_scope(Product).includes(:category)
          scope = scope.where(category_id: params[:category_id]) if params[:category_id].present?
          scope = scope.active    if params[:active]   == "true"
          scope = scope.featured  if params[:featured] == "true"
          scope = scope.ordered

          render_ok(products: scope.map { |p| serialize_list(p) })
        end

        def show
          render_ok(product: serialize_full(@product))
        end

        def create
          product = company_scope(Product).build(product_params)
          if product.save
            render_created(product: serialize_full(product))
          else
            render_record_errors(product)
          end
        end

        def update
          if @product.update(product_params)
            render_ok(product: serialize_full(@product))
          else
            render_record_errors(@product)
          end
        end

        def destroy
          @product.update!(is_active: false)
          render_ok(message: "Produto desativado")
        end

        private

        def set_product
          @product = company_scope(Product).includes(:category, product_option_groups: :product_option_items)
                                           .find_by(id: params[:id])
          render_not_found("Produto") unless @product
        end

        def product_params
          params.require(:product).permit(
            :name, :slug, :description, :category_id, :price_cents,
            :promotional_price_cents, :cost_price_cents, :image_url,
            :is_featured, :is_promotional, :is_combo, :is_customizable,
            :track_inventory, :stock_item_id, :sort_order, :is_active
          ).merge(company_id: current_company.id)
        end

        def serialize_list(p)
          p.as_json(only: %i[id name slug category_id price_cents promotional_price_cents
                             cost_price_cents image_url is_featured is_promotional is_combo
                             is_customizable is_active sort_order track_inventory stock_item_id])
           .merge(category: p.category&.slice("id", "name"),
                  category_name: p.category&.name,
                  price_brl: p.price_brl,
                  margin_percent: p.margin_percent)
        end

        def serialize_full(p)
          p.as_json(
            only: %i[id name slug description price_cents promotional_price_cents
                     cost_price_cents image_url is_featured is_promotional is_combo
                     is_customizable track_inventory sort_order is_active created_at updated_at]
          ).merge(
            category: p.category&.slice("id", "name"),
            price_brl: p.price_brl,
            margin_percent: p.margin_percent,
            option_groups: p.product_option_groups.ordered.map { |g|
              g.as_json(only: %i[id name group_type required min_select max_select sort_order])
               .merge(items: g.product_option_items.active.ordered.as_json(
                 only: %i[id name additional_price_cents is_active sort_order]
               ))
            }
          )
        end
      end
    end
  end
end
