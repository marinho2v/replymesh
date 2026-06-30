module Api
  module V1
    module Store
      class MediaController < BaseController
        before_action :require_store_admin!

        def create
          result = CloudStorageService.upload(
            company: current_company,
            file: params.require(:file),
            media_type: params.require(:media_type),
            owner: media_owner
          )

          audit!(
            "cloud_media_uploaded",
            company: current_company,
            metadata: {
              media_type: params[:media_type],
              storage_key: result[:storage_key],
              owner_type: media_owner&.class&.name,
              owner_id: media_owner&.id
            }
          )

          render_created(media: result)
        rescue CloudStorageService::NotConfiguredError => e
          render_error(e.message, status: :service_unavailable)
        rescue CloudStorageService::InvalidFileError, CloudStorageService::UnsafeKeyError => e
          render_error(e.message, status: :unprocessable_entity)
        end

        def destroy
          storage_key = params.require(:storage_key)
          CloudStorageService.delete(storage_key, company: current_company)

          audit!(
            "cloud_media_deleted",
            company: current_company,
            metadata: { storage_key: storage_key }
          )

          render_ok(message: "Imagem removida")
        rescue CloudStorageService::NotConfiguredError => e
          render_error(e.message, status: :service_unavailable)
        rescue CloudStorageService::UnsafeKeyError => e
          render_error(e.message, status: :forbidden)
        end

        private

        def require_store_admin!
          return true if store_admin?

          render json: {
            success: false,
            error: "Perfil sem permissao para enviar imagens"
          }, status: :forbidden
          false
        end

        def media_owner
          owner_type = params[:owner_type].to_s
          owner_id = params[:owner_id].presence
          return nil if owner_type.blank? || owner_id.blank?

          case owner_type
          when "product"
            company_scope(Product).find_by(id: owner_id)
          when "category"
            company_scope(Category).find_by(id: owner_id)
          when "banner", "app_banner"
            company_scope(AppBanner).find_by(id: owner_id)
          else
            nil
          end
        end
      end
    end
  end
end
