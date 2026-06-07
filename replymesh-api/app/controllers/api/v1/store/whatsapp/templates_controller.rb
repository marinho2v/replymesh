module Api
  module V1
    module Store
      module Whatsapp
        class TemplatesController < Api::V1::Store::BaseController
          before_action :set_template, only: %i[update]

          def index
            WhatsappTemplate.sync_defaults_for!(current_company)
            templates = current_company.whatsapp_templates.order(:template_key)
            render_ok(templates: templates.map { |template| serialize_template(template) })
          end

          def update
            if @template.update(template_params)
              render_ok(template: serialize_template(@template))
            else
              render_record_errors(@template)
            end
          end

          private

          def set_template
            @template = current_company.whatsapp_templates.find_by(id: params[:id])
            render_not_found("Template WhatsApp") unless @template
          end

          def template_params
            params.require(:template).permit(:title, :message, :enabled)
          end

          def serialize_template(template)
            template.as_json(only: %i[id template_key title message enabled created_at updated_at])
          end
        end
      end
    end
  end
end
