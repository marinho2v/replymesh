module Api
  module V1
    module Store
      module Whatsapp
        class LogsController < Api::V1::Store::BaseController
          def index
            logs = current_company.whatsapp_logs.includes(:whatsapp_instance).order(created_at: :desc).limit(page_limit)
            render_ok(logs: logs.map { |log| serialize_log(log) })
          end

          private

          def serialize_log(log)
            log.as_json(only: %i[id level message created_at]).merge(
              instance_name: log.whatsapp_instance&.instance_name,
              metadata_json: scrub_secret(log.metadata_json || {})
            )
          end

          def scrub_secret(value)
            case value.as_json
            when Array
              value.as_json.map { |item| scrub_secret(item) }
            when Hash
              value.as_json.each_with_object({}) do |(key, item), result|
                next if %w[
                  apikey api_key authorization token instance_token
                  tokens_used provider_called provider model estimated_cost_usd
                ].include?(key.to_s.downcase)

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
