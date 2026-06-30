module Api
  module V1
    module Public
      class MediaController < ApplicationController
        def show
          storage_key = CloudStorageService.decode_storage_key(params[:token])
          return head :not_found if storage_key.blank?

          file = CloudStorageService.download(storage_key)
          return head :not_found unless file

          expires_in 1.year, public: true
          response.headers["Cache-Control"] = file[:cache_control]
          response.headers["X-Content-Type-Options"] = "nosniff"

          send_data(
            file[:body],
            type: file[:content_type],
            disposition: "inline",
            filename: "replymesh-image.webp"
          )
        rescue CloudStorageService::NotConfiguredError
          head :not_found
        end
      end
    end
  end
end
