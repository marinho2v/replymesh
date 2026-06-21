module Api
  module V1
    module Store
      module Whatsapp
        class InstancesController < Api::V1::Store::BaseController
          before_action :reject_non_automatic_mode!, only: %i[ensure status qrcode]
          before_action :set_instance, only: %i[status qrcode]

          def index
            instance = primary_instance
            render_ok(
              instances: automatic_mode? && instance ? [instance.safe_json] : [],
              whatsapp_mode: current_mode,
              message: manual_mode? ? "Modo manual ativo. As mensagens devem ser enviadas pelo atendente." : nil
            )
          end

          def ensure
            if (instance = primary_instance)
              remote = sync_remote_for!(instance)
              ensure_evolution_webhooks!(instance, remote: remote)
              return render_ok(instance: instance.reload.safe_json)
            end

            instance = ensure_company_instance!
            render_ok(instance: instance.safe_json)
          rescue ActiveRecord::RecordInvalid => e
            render_record_errors(e.record)
          rescue EvolutionGoClient::Error => e
            render_error(e.message, status: :bad_gateway)
          end

          def status
            response = client.status(@instance.instance_uuid.presence || @instance.instance_name)
            apply_remote_status!(@instance, response)
            ensure_evolution_webhooks!(@instance, remote: response)
            render_ok(instance: @instance.reload.safe_json)
          rescue EvolutionGoClient::Error => e
            render_error(e.message, status: :bad_gateway)
          end

          def qrcode
            unless @instance.instance_token.present?
              return render_error("Instancia nao possui token local para QR Code", status: :unprocessable_entity)
            end

            ensure_evolution_webhooks!(@instance)
            response = client.get_qr_code(@instance.instance_token, instance_name: @instance.instance_name)
            @instance.update!(
              qr_code: response.dig(:qrcode, :value),
              status: response[:status].presence || "connecting"
            )

            render_ok(
              instance: @instance.reload.safe_json.slice(:id, :instance_name, :status, :remote_status),
              qrcode: response[:qrcode],
              pairing_code: response[:pairing_code]
            )
          rescue EvolutionGoClient::Error => e
            render_error(e.message, status: :bad_gateway)
          end

          private

          def current_mode
            current_company.store_setting&.whatsapp_mode.presence || "automatic"
          end

          def automatic_mode?
            current_mode == "automatic"
          end

          def manual_mode?
            current_mode == "manual"
          end

          def reject_non_automatic_mode!
            return if automatic_mode?

            render_ok(
              skipped: true,
              whatsapp_mode: current_mode,
              message: manual_mode? ?
                "Modo manual ativo. Nenhuma conexao Replymesh Connect e necessaria." :
                "WhatsApp desativado para esta empresa."
            )
          end

          def set_instance
            @instance = primary_instance
            render_not_found("Instancia WhatsApp") unless @instance
          end

          def client
            @client ||= EvolutionGoClient.new
          end

          def ensure_company_instance!
            name = safe_instance_name
            now = Time.current
            instance = current_company.whatsapp_instances.find_or_initialize_by(instance_name: name)
            remote = remote_instance_by_name(name)

            if remote
              assign_remote_attrs(instance, remote, now)
              instance.provider = "evolution_go"
              instance.status = remote[:status].presence || instance.status.presence || "created"
              instance.save!
              ensure_evolution_webhooks!(instance, remote: remote)
              return instance
            end

            token = instance.instance_token.presence || SecureRandom.hex(32)
            response = client.create_instance(name, token: token)
            remote_after_create = remote_instance_by_name(name) || response

            instance.instance_token = token
            instance.provider = "evolution_go"
            instance.base_url = response[:base_url].presence || ENV["EVOLUTION_GO_BASE_URL"].presence
            instance.status = remote_after_create[:status].presence || response[:status].presence || "created"
            assign_remote_attrs(instance, remote_after_create, now)
            instance.save!
            ensure_evolution_webhooks!(instance, remote: remote_after_create)
            instance
          end

          def safe_instance_name
            "replymesh_#{current_company.slug.to_s.gsub(/[^a-z0-9_]/, "_")}"
          end

          def primary_instance
            @primary_instance ||= WhatsappInstance.primary_for_company(current_company)
          end

          def remote_instance_by_name(name)
            client.list_instances.find { |remote| remote[:instance_name].to_s == name.to_s }
          end

          def sync_remote_for!(instance)
            remote = remote_instance_by_name(instance.instance_name)
            return unless remote

            assign_remote_attrs(instance, remote, Time.current)
            instance.status = remote[:status].presence || instance.status
            instance.save!
            remote
          end

          def ensure_evolution_webhooks!(instance, remote: nil)
            client.ensure_webhooks(instance, remote: remote)
          end

          def apply_remote_status!(instance, response)
            previous_status = instance.status
            attrs = {
              status: response[:status].presence || instance.status,
              remote_status: response[:raw_status].presence || response[:status],
              remote_data: scrub_secret(response[:remote_data] || response),
              last_remote_sync_at: Time.current
            }
            attrs[:instance_uuid] = response[:instance_uuid] if response[:instance_uuid].present?
            attrs[:connected_number] = response[:connected_number] if response[:connected_number].present?
            attrs[:last_connected_at] = Time.current if attrs[:status] == "connected"
            attrs[:last_disconnected_at] = Time.current if attrs[:status] == "disconnected"
            instance.update!(attrs.compact)
            notify_disconnection(instance) if attrs[:status] == "disconnected" && previous_status != "disconnected"
          end

          def notify_disconnection(instance)
            NotificationService.notify_company(
              company: current_company,
              title: "WhatsApp desconectado",
              message: "A conexao #{instance.instance_name} precisa de atencao.",
              type: "whatsapp",
              link_url: "/admin/whatsapp",
              metadata: { whatsapp_instance_id: instance.id }
            )
          end

          def assign_remote_attrs(instance, remote, synced_at)
            instance.instance_uuid = remote[:instance_uuid].presence || instance.instance_uuid
            instance.remote_status = remote[:raw_status].presence || remote[:status]
            instance.remote_data = scrub_secret(remote[:remote_data] || remote)
            instance.connected_number = remote[:connected_number].presence || instance.connected_number
            instance.base_url = remote[:base_url].presence || ENV["EVOLUTION_GO_BASE_URL"].presence
            instance.last_remote_sync_at = synced_at
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
