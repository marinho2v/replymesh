module Api
  module V1
    module Store
      class CategoriesController < BaseController
        before_action :set_category, only: %i[show update destroy]

        def index
          categories = company_scope(Category).visible.ordered
          render_ok(categories: categories.as_json(only: %i[id name slug sort_order is_active created_at]))
        end

        def show
          render_ok(category: serialize(@category))
        end

        def create
          category = company_scope(Category).build(category_params)
          if category.save
            render_created(category: serialize(category))
          else
            render_record_errors(category)
          end
        end

        def update
          if @category.update(category_params)
            render_ok(category: serialize(@category))
          else
            render_record_errors(@category)
          end
        end

        def destroy
          @category.update!(is_active: false, deleted_at: Time.current)
          render_ok(message: "Categoria excluida da listagem", category: serialize(@category))
        end

        private

        def set_category
          @category = company_scope(Category).find_by(id: params[:id])
          render_not_found("Categoria") unless @category
        end

        def category_params
          params.require(:category).permit(:name, :slug, :sort_order, :is_active)
                .merge(company_id: current_company.id)
        end

        def serialize(cat)
          cat.as_json(only: %i[id name slug sort_order is_active created_at updated_at])
        end
      end
    end
  end
end
