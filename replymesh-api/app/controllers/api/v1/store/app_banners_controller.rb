module Api
  module V1
    module Store
      class AppBannersController < BaseController
        before_action -> { require_feature!("banners") }
        before_action :set_banner, only: %i[show update destroy]

        def index
          banners = company_scope(AppBanner).active.ordered
          render_ok(app_banners: banners.as_json(only: %i[id title image_url link_url is_active sort_order]))
        end

        def show
          render_ok(app_banner: @banner.as_json(only: %i[id title image_url link_url is_active sort_order]))
        end

        def create
          banner = company_scope(AppBanner).build(banner_params)
          if banner.save
            render_created(app_banner: banner.as_json(only: %i[id title image_url link_url is_active sort_order]))
          else
            render_record_errors(banner)
          end
        end

        def update
          if @banner.update(banner_params)
            render_ok(app_banner: @banner.as_json(only: %i[id title image_url link_url is_active sort_order]))
          else
            render_record_errors(@banner)
          end
        end

        def destroy
          @banner.destroy
          render_ok(message: "Banner removido")
        end

        private

        def set_banner
          @banner = company_scope(AppBanner).find_by(id: params[:id])
          render_not_found("Banner") unless @banner
        end

        def banner_params
          params.require(:app_banner).permit(:title, :image_url, :link_url, :is_active, :sort_order)
                .merge(company_id: current_company.id)
        end
      end
    end
  end
end
