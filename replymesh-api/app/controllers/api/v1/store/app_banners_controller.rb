module Api
  module V1
    module Store
      class AppBannersController < BaseController
        before_action -> { require_feature!("banners") }
        before_action :set_banner, only: %i[show update destroy]

        def index
          banners = company_scope(AppBanner).active.ordered
          render_ok(app_banners: banners.map { |banner| serialize_banner(banner) })
        end

        def show
          render_ok(app_banner: serialize_banner(@banner))
        end

        def create
          banner = company_scope(AppBanner).build(banner_params)
          if banner.save
            render_created(app_banner: serialize_banner(banner))
          else
            render_record_errors(banner)
          end
        end

        def update
          if @banner.update(banner_params)
            render_ok(app_banner: serialize_banner(@banner))
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
          params.require(:app_banner).permit(:title, :image_url, :image_storage_key, :link_url, :is_active, :sort_order)
                .merge(company_id: current_company.id)
        end

        def serialize_banner(banner)
          banner.as_json(only: %i[id title image_url image_storage_key link_url is_active sort_order])
                .merge(image_url: media_url(banner, :image_storage_key, banner.image_url))
        end

        def media_url(record, storage_field, fallback)
          return fallback unless record.respond_to?(storage_field)

          CloudStorageService.public_url_or_fallback(record.public_send(storage_field), fallback)
        end
      end
    end
  end
end
