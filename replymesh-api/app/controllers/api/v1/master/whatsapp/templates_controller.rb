module Api
  module V1
    module Master
      module Whatsapp
        class TemplatesController < ApplicationController
          before_action :authenticate_user!
          before_action :require_super_admin!
          before_action :set_template, only: %i[show update]

          def index
            templates = WhatsappTemplate.includes(:company).order(created_at: :desc)
            render json: { success: true, templates: templates.map { |template| serialize_template(template) } }
          end

          def show
            render json: { success: true, template: serialize_template(@template) }
          end

          def create
            template = WhatsappTemplate.new(template_params)

            if template.save
              log!(template.company, "ok", "Template WhatsApp criado", template)
              render json: { success: true, template: serialize_template(template) }, status: :created
            else
              render json: { success: false, errors: template.errors.full_messages }, status: :unprocessable_entity
            end
          end

          def update
            if @template.update(template_params)
              log!(@template.company, "info", "Template WhatsApp atualizado", @template)
              render json: { success: true, template: serialize_template(@template) }
            else
              render json: { success: false, errors: @template.errors.full_messages }, status: :unprocessable_entity
            end
          end

          private

          def set_template
            @template = WhatsappTemplate.includes(:company).find(params[:id])
          end

          def template_params
            params.require(:whatsapp_template).permit(:company_id, :template_key, :title, :message, :enabled)
          end

          def serialize_template(template)
            {
              id: template.id,
              template_key: template.template_key,
              title: template.title,
              message: template.message,
              enabled: template.enabled,
              created_at: template.created_at,
              updated_at: template.updated_at,
              company: {
                id: template.company.id,
                name: template.company.name,
                slug: template.company.slug
              }
            }
          end

          def log!(company, level, message, template)
            WhatsappLog.create!(
              company: company,
              level: level,
              message: message,
              metadata_json: { template_id: template.id, template_key: template.template_key }
            )
            audit!(
              template.previous_changes.key?("id") ? "whatsapp_template_created" : "whatsapp_template_updated",
              company: company,
              resource: template,
              metadata: { template_id: template.id, template_key: template.template_key, enabled: template.enabled }
            )
          end
        end
      end
    end
  end
end
