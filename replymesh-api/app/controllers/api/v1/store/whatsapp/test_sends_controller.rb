module Api
  module V1
    module Store
      module Whatsapp
        class TestSendsController < Api::V1::Store::BaseController
          def create
            order = company_scope(Order).find_by(id: params.require(:order_id))
            return render_not_found("Pedido") unless order

            result = WhatsappStatusDispatcher.call(
              order: order,
              status: params[:status].presence || order.status,
              user: current_user,
              test_mode: true
            )

            if result.success?
              render_ok(
                sent: result.sent,
                log: serialize_log(result.log),
                message: result.error,
                manual_whatsapp: result.manual_preview
              )
            else
              render_error(result.error, status: :bad_gateway, errors: [result.error])
            end
          end

          private

          def serialize_log(log)
            log.as_json(only: %i[id level message created_at]).merge(
              metadata_json: scrub_secret(log.metadata_json || {})
            )
          end

          def scrub_secret(value)
            case value.as_json
            when Array
              value.as_json.map { |item| scrub_secret(item) }
            when Hash
              value.as_json.each_with_object({}) do |(key, item), result|
                next if %w[apikey api_key authorization token instance_token].include?(key.to_s.downcase)

                result[key] = scrub_secret(item)
              end
            else
              value
            end
          end
        end
      end
    end
  end
end
