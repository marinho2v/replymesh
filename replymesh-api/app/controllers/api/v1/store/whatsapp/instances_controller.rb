module Api
  module V1
    module Store
      module Whatsapp
        class InstancesController < Api::V1::Store::BaseController
          before_action -> { require_feature!("whatsapp_basic") }, except: %i[index]
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
              remote ||= recreate_remote_instance!(instance, reason: "remote_missing_on_ensure")
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
            render_ok(instance: @instance.reload.safe_json)
          rescue EvolutionGoClient::Error => e
            if recoverable_evolution_instance_error?(e)
              mark_instance_remote_missing!(@instance, e)
              return render_ok(
                instance: @instance.reload.safe_json,
                recoverable: true,
                message: "Instancia desconectada ou removida na Evolution. Gere um novo QR Code para reconectar."
              )
            end

            mark_instance_sync_error!(@instance, e)
            render_ok(
              instance: @instance.reload.safe_json,
              recoverable: false,
              message: "Nao foi possivel consultar a Evolution agora. Tente atualizar novamente em alguns instantes."
            )
          end

          def qrcode
            unless @instance.instance_token.present?
              return render_error("Instancia nao possui token local para QR Code", status: :unprocessable_entity)
            end

            response = client.get_qr_code(@instance.instance_token, instance_name: @instance.instance_name)
            ensure_evolution_webhooks!(@instance)
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
            if recoverable_evolution_instance_error?(e)
              remote = recreate_remote_instance!(@instance, reason: "remote_missing_on_qrcode")
              response = client.get_qr_code(@instance.instance_token, instance_name: @instance.instance_name)
              ensure_evolution_webhooks!(@instance, remote: remote)
              @instance.update!(
                qr_code: response.dig(:qrcode, :value),
                status: response[:status].presence || "connecting"
              )

              return render_ok(
                instance: @instance.reload.safe_json.slice(:id, :instance_name, :status, :remote_status),
                qrcode: response[:qrcode],
                pairing_code: response[:pairing_code],
                recovered: true
              )
            end

            mark_instance_sync_error!(@instance, e)
            render_ok(
              instance: @instance.reload.safe_json.slice(:id, :instance_name, :status, :remote_status),
              qrcode: nil,
              remote_error: true,
              message: "A Evolution demorou ou recusou a geracao do QR Code. Tente novamente em alguns instantes."
            )
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

          def recreate_remote_instance!(instance, reason:)
            now = Time.current
            token = SecureRandom.hex(32)
            response = client.create_instance(instance.instance_name, token: token)
            remote_after_create = remote_instance_by_name(instance.instance_name) || response

            instance.instance_token = token
            instance.provider = "evolution_go"
            instance.base_url = response[:base_url].presence || ENV["EVOLUTION_GO_BASE_URL"].presence
            instance.status = remote_after_create[:status].presence || response[:status].presence || "created"
            instance.qr_code = nil
            assign_remote_attrs(instance, remote_after_create, now)
            instance.save!

            log_recovery!(instance, reason: reason, remote: remote_after_create)
            remote_after_create
          end

          def recoverable_evolution_instance_error?(error)
            status = error.status.to_i
            message = error.message.to_s.downcase
            payload = error.payload.to_s.downcase

            return true if [401, 403, 404, 410].include?(status)

            [
              "not authorized",
              "unauthorized",
              "forbidden",
              "not found",
              "nao encontrado",
              "não encontrado",
              "instance not found",
              "instancia nao encontrada",
              "instância não encontrada",
              "does not exist"
            ].any? { |term| message.include?(term) || payload.include?(term) }
          end

          def mark_instance_remote_missing!(instance, error)
            instance.update!(
              status: "disconnected",
              remote_status: "remote_missing",
              remote_data: scrub_secret({
                error: error.message,
                status: error.status,
                recovered: false
              }),
              qr_code: nil,
              last_disconnected_at: Time.current,
              last_remote_sync_at: Time.current
            )
          end

          def mark_instance_sync_error!(instance, error)
            instance.update!(
              status: "disconnected",
              remote_status: "remote_error",
              remote_data: scrub_secret({
                error: error.message,
                status: error.status,
                recovered: false
              }),
              qr_code: nil,
              last_disconnected_at: Time.current,
              last_remote_sync_at: Time.current
            )
          rescue StandardError => e
            Rails.logger.warn("WhatsApp instance sync error update failed: #{e.class}")
          end

          def log_recovery!(instance, reason:, remote:)
            ActivityLog.create!(
              company: instance.company,
              user: current_user,
              action: "whatsapp_instance_recreated",
              message: "Instancia WhatsApp recriada automaticamente para gerar novo QR Code",
              metadata: {
                source: "store_whatsapp_instances",
                reason: reason,
                whatsapp_instance_id: instance.id,
                instance_name: instance.instance_name,
                remote_status: remote[:status],
                remote_mode: remote[:mode]
              }
            )
          rescue StandardError => e
            Rails.logger.warn("WhatsApp instance recovery log failed: #{e.class}")
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
