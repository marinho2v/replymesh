module Api
  module V1
    module Master
      class SystemUpdatesController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_update, only: %i[show update destroy publish unpublish]

        def index
          updates = SystemUpdate.includes(:company).recent_first
          updates = updates.where(status: params[:status]) if params[:status].present?
          updates = updates.where(update_type: params[:update_type]) if params[:update_type].present?

          render json: { success: true, system_updates: updates.map { |item| serialize(item) } }
        end

        def show
          render json: { success: true, system_update: serialize(@system_update) }
        end

        def create
          system_update = SystemUpdate.new(system_update_params)
          if system_update.save
            audit!("system_update_created", resource: system_update, metadata: system_update.attributes)
            publish_update!(system_update) if system_update.status == "published"
            render json: { success: true, system_update: serialize(system_update) }, status: :created
          else
            render json: { success: false, errors: system_update.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          was_published = @system_update.status == "published"
          if @system_update.update(system_update_params)
            publish_update!(@system_update) if !was_published && @system_update.status == "published"
            audit!("system_update_updated", resource: @system_update, metadata: @system_update.attributes)
            render json: { success: true, system_update: serialize(@system_update) }
          else
            render json: { success: false, errors: @system_update.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @system_update.destroy!
          render json: { success: true, message: "Atualizacao removida" }
        end

        def publish
          publish_update!(@system_update)
          render json: { success: true, system_update: serialize(@system_update) }
        end

        def unpublish
          @system_update.unpublish!
          audit!("system_update_unpublished", resource: @system_update)
          render json: { success: true, system_update: serialize(@system_update) }
        end

        private

        def set_update
          @system_update = SystemUpdate.find(params[:id])
        end

        def system_update_params
          params.require(:system_update).permit(
            :title, :short_description, :content, :version, :update_type, :status,
            :audience_type, :company_id, :plan_key, :is_featured, :published_at,
            :icon, :color, :link_url, :image_url
          )
        end

        def publish_update!(system_update)
          system_update.publish!
          SystemUpdatePublicationService.call(system_update)
          audit!("system_update_published", resource: system_update)
        end

        def serialize(item)
          item.as_json(
            only: %i[
              id title short_description content version update_type status audience_type
              company_id plan_key is_featured published_at icon color link_url image_url
              created_at updated_at
            ]
          ).merge(company_name: item.company&.name)
        end
      end
    end
  end
end
