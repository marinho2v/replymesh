module Api
  module V1
    module Master
      module Whatsapp
        class InstancesController < ApplicationController
          TEST_INSTANCE_NAME = "replymesh_teste_local".freeze

          before_action :authenticate_user!
          before_action :require_super_admin!
          before_action :set_instance, only: %i[show status qrcode disconnect restart destroy]

          def index
            local_instances = WhatsappInstance.includes(:company).order(created_at: :desc).map { |instance| serialize_instance(instance) }
            instances = local_instances + remote_instances(local_instances)

            render json: { success: true, metrics: metrics(instances), instances: instances }
          end

          def show
            render json: { success: true, instance: serialize_instance(@instance) }
          end

          def sync
            result = sync_remote_instances!
            render json: { success: true, synced: result }
          rescue EvolutionGoClient::Error => e
            render json: { success: false, errors: [e.message] }, status: :bad_gateway
          end

          def create_test
            result = create_or_sync_test_instance!
            instance = result.delete(:instance)
            render json: { success: true, result: result, instance: serialize_instance(instance.reload) }
          rescue ActiveRecord::RecordInvalid => e
            render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
          rescue EvolutionGoClient::Error => e
            render json: { success: false, errors: [e.message] }, status: :bad_gateway
          rescue StandardError => e
            render json: { success: false, errors: [e.message] }, status: :unprocessable_entity
          end

          def create
            company = Company.find(instance_params[:company_id])
            name = instance_params[:instance_name].presence || "replymesh_#{company.slug}"
            instance = WhatsappInstance.find_or_initialize_by(company: company, instance_name: name)
            token = instance.instance_token.presence || SecureRandom.hex(32)

            response = client.create_instance(name, token: token)
            instance.assign_attributes(
              provider: "evolution_go",
              status: response[:status] || "created",
              base_url: response[:base_url],
              connected_number: response[:connected_number],
              instance_token: token
            )
            instance.save!
            client.configure_location_webhook(token, webhook_token: EvolutionWebhookToken.generate(instance))
            log!(instance, "ok", "Instancia WhatsApp criada", response)

            render json: { success: true, instance: serialize_instance(instance) }, status: :created
          rescue ActiveRecord::RecordInvalid => e
            render json: { success: false, errors: e.record.errors.full_messages }, status: :unprocessable_entity
          rescue ActiveRecord::RecordNotFound => e
            render json: { success: false, errors: [e.message] }, status: :not_found
          rescue EvolutionGoClient::Error => e
            create_error_log(company: defined?(company) ? company : nil, message: e.message)
            render json: { success: false, errors: [e.message] }, status: :bad_gateway
          end

          def status
            response = client.status(@instance.instance_uuid.presence || @instance.instance_name)
            apply_status!(@instance, response)
            log!(@instance, "info", "Status da instancia consultado", response)

            render json: { success: true, instance: serialize_instance(@instance.reload), result: safe_result(response) }
          rescue EvolutionGoClient::Error => e
            log!(@instance, "err", "Falha ao consultar status: #{e.message}")
            render json: { success: false, errors: [e.message] }, status: :bad_gateway
          end

          def qrcode
            unless safe_test_instance?(@instance)
              return render json: { success: false, errors: ["QR Code real permitido somente para instancia teste segura"] }, status: :forbidden
            end

            unless @instance.instance_token.present?
              return render json: { success: false, errors: ["Instancia teste nao possui token local"] }, status: :unprocessable_entity
            end

            response = client.get_qr_code(@instance.instance_token, instance_name: @instance.instance_name)
            @instance.update!(qr_code: response.dig(:qrcode, :value), status: response[:status].presence || "connecting")
            log!(@instance, "info", "QR Code solicitado para instancia teste", response.except(:qrcode))

            render json: {
              success: true,
              instance: serialize_instance(@instance.reload).slice(:id, :instance_name, :status, :remote_status),
              qrcode: response[:qrcode],
              pairing_code: response[:pairing_code]
            }
          rescue EvolutionGoClient::Error => e
            log!(@instance, "err", "Falha ao buscar QR Code: #{e.message}")
            render json: { success: false, errors: [e.message] }, status: :bad_gateway
          end

          def disconnect
            response = client.disconnect(@instance.instance_name)
            @instance.update!(status: "disconnected", last_disconnected_at: Time.current)
            log!(@instance, "warn", "Instancia desconectada", response)

            render json: { success: true, instance: serialize_instance(@instance.reload) }
          rescue EvolutionGoClient::Error => e
            log!(@instance, "err", "Falha ao desconectar: #{e.message}")
            render json: { success: false, errors: [e.message] }, status: :bad_gateway
          end

          def restart
            response = client.restart(@instance.instance_name)
            @instance.update!(status: response[:status] || "created")
            log!(@instance, "info", "Instancia reiniciada", response)

            render json: { success: true, instance: serialize_instance(@instance.reload) }
          rescue EvolutionGoClient::Error => e
            log!(@instance, "err", "Falha ao reiniciar: #{e.message}")
            render json: { success: false, errors: [e.message] }, status: :bad_gateway
          end

          def destroy
            response = client.delete_instance(@instance.instance_name)
            @instance.update!(status: "not_created", qr_code: nil, connected_number: nil)
            log!(@instance, "warn", "Instancia removida na Evolution", response)

            render json: { success: true, instance: serialize_instance(@instance.reload) }
          rescue EvolutionGoClient::Error => e
            log!(@instance, "err", "Falha ao excluir instancia: #{e.message}")
            render json: { success: false, errors: [e.message] }, status: :bad_gateway
          end

          private

          def set_instance
            @instance = WhatsappInstance.includes(:company).find(params[:id])
          end

          def instance_params
            params.require(:whatsapp_instance).permit(:company_id, :instance_name)
          end

          def client
            @client ||= EvolutionGoClient.new
          end

          def create_or_sync_test_instance!
            company = Company.order(:id).first
            raise "Cadastre uma empresa antes de criar a instancia teste" unless company

            now = Time.current
            local = WhatsappInstance.find_by(instance_name: TEST_INSTANCE_NAME)
            remote = remote_instance_by_name(TEST_INSTANCE_NAME)

            if remote
              instance = local || WhatsappInstance.find_or_initialize_by(company: company, instance_name: TEST_INSTANCE_NAME)
              assign_remote_attrs(instance, remote, now)
              instance.save!
              WhatsappRemoteInstance.where(instance_name: TEST_INSTANCE_NAME).delete_all
              log!(instance, "info", "Instancia teste ja existia na Evolution; dados sincronizados", remote)

              return {
                action: local ? "local_and_remote_already_existed" : "remote_already_existed_linked_locally",
                created_remote: false,
                instance: instance,
                remote_status: instance.remote_status || instance.status,
                instance_uuid_present: instance.instance_uuid.present?
              }
            end

            instance = local || WhatsappInstance.find_or_initialize_by(company: company, instance_name: TEST_INSTANCE_NAME)
            token = instance.instance_token.presence || SecureRandom.hex(32)
            response = client.create_instance(TEST_INSTANCE_NAME, token: token)
            remote_after_create = remote_instance_by_name(TEST_INSTANCE_NAME) || response

            instance.instance_token = token
            assign_remote_attrs(instance, remote_after_create, now)
            instance.status = remote_after_create[:status] || response[:status] || "created"
            instance.provider = "evolution_go"
            instance.base_url = response[:base_url].presence || remote_after_create[:base_url].presence || ENV["EVOLUTION_GO_BASE_URL"].presence
            instance.save!
            client.configure_location_webhook(token, webhook_token: EvolutionWebhookToken.generate(instance))
            WhatsappRemoteInstance.where(instance_name: TEST_INSTANCE_NAME).delete_all
            log!(instance, "ok", "Instancia teste criada na Evolution", remote_after_create)

            {
              action: "created_remote",
              created_remote: true,
              instance: instance,
              remote_status: instance.remote_status || instance.status,
              instance_uuid_present: instance.instance_uuid.present?
            }
          end

          def remote_instance_by_name(name)
            client.list_instances.find { |remote| remote[:instance_name].to_s == name.to_s }
          end

          def assign_remote_attrs(instance, remote, synced_at)
            instance.provider = "evolution_go"
            instance.status = remote[:status].presence || instance.status.presence || "created"
            instance.instance_uuid = remote[:instance_uuid].presence || instance.instance_uuid
            instance.remote_status = remote[:raw_status].presence || remote[:status]
            instance.remote_data = safe_result(remote[:remote_data] || remote)
            instance.connected_number = remote[:connected_number].presence || instance.connected_number
            instance.base_url = remote[:base_url].presence || ENV["EVOLUTION_GO_BASE_URL"].presence
            instance.last_remote_sync_at = synced_at
          end

          def metrics(instances)
            {
              total_count: instances.size,
              connected_count: instances.count { |instance| instance[:status] == "connected" },
              disconnected_count: instances.count { |instance| instance[:status] == "disconnected" },
              pending_count: instances.count { |instance| %w[not_created created connecting].include?(instance[:status]) },
              error_count: instances.count { |instance| instance[:status] == "error" }
            }
          end

          def remote_instances(local_instances)
            local_names = local_instances.map { |instance| instance[:instance_name].to_s }
            persisted_names = local_names + WhatsappRemoteInstance.pluck(:instance_name)
            remote_from_api = client.list_instances
              .reject { |instance| local_names.include?(instance[:instance_name].to_s) }
              .map { |instance| serialize_remote_instance(instance) }
            persisted_remote = WhatsappRemoteInstance.order(updated_at: :desc)
              .reject { |instance| persisted_names.include?(instance.instance_name) && remote_from_api.any? { |remote| remote[:instance_name] == instance.instance_name } }
              .map { |instance| serialize_unlinked_instance(instance) }

            remote_from_api + persisted_remote
          rescue EvolutionGoClient::Error
            WhatsappRemoteInstance.order(updated_at: :desc).map { |instance| serialize_unlinked_instance(instance) }
          end

          def sync_remote_instances!
            now = Time.current
            linked = []
            unlinked = []

            client.list_instances.each do |remote|
              name = remote[:instance_name].to_s
              next if name.blank?

              local = WhatsappInstance.find_by(instance_name: name)
              attrs = {
                instance_uuid: remote[:instance_uuid],
                remote_status: remote[:raw_status].presence || remote[:status],
                remote_data: safe_result(remote[:remote_data] || remote),
                connected_number: remote[:connected_number],
                last_remote_sync_at: now
              }

              if local
                local.update!(attrs.compact)
                linked << { instance_name: name, status: local.remote_status || local.status }
              else
                record = WhatsappRemoteInstance.find_or_initialize_by(instance_name: name)
                record.assign_attributes(
                  instance_uuid: remote[:instance_uuid],
                  status: remote[:status],
                  connected_number: remote[:connected_number],
                  profile_name: remote[:profile_name],
                  remote_data: safe_result(remote[:remote_data] || remote),
                  last_remote_sync_at: now
                )
                record.save!
                unlinked << { instance_name: name, status: record.status }
              end
            end

            { linked_count: linked.size, unlinked_count: unlinked.size, linked: linked, unlinked: unlinked }
          end

          def safe_test_instance?(instance)
            instance.instance_name == TEST_INSTANCE_NAME || instance.instance_name.start_with?("replymesh_teste_")
          end

          def apply_status!(instance, response)
            status = response[:status]
            attrs = {
              status: status,
              remote_status: response[:raw_status].presence || status,
              remote_data: safe_result(response[:remote_data] || response),
              last_remote_sync_at: Time.current
            }
            attrs[:instance_uuid] = response[:instance_uuid] if response[:instance_uuid].present?
            attrs[:connected_number] = response[:connected_number] if response[:connected_number].present?
            attrs[:last_connected_at] = Time.current if status == "connected"
            attrs[:last_disconnected_at] = Time.current if status == "disconnected"
            instance.update!(attrs)
          end

          def serialize_instance(instance)
            instance.safe_json.merge(
              company: {
                id: instance.company.id,
                name: instance.company.name,
                slug: instance.company.slug,
                status: instance.company.status
              }
            )
          end

          def serialize_remote_instance(instance)
            {
              id: nil,
              provider: "evolution_go",
              instance_name: instance[:instance_name],
              status: instance[:status],
              base_url: instance[:base_url],
              connected_number: instance[:connected_number],
              profile_name: instance[:profile_name],
              raw_status: instance[:raw_status],
              last_connected_at: nil,
              last_disconnected_at: nil,
              created_at: nil,
              updated_at: nil,
              source: "remote",
              remote_linked: false,
              company: {
                id: nil,
                name: "Evolution Go",
                slug: "remote",
                status: "active"
              }
            }
          end

          def serialize_unlinked_instance(instance)
            {
              id: nil,
              provider: "evolution_go",
              instance_name: instance.instance_name,
              instance_uuid: instance.instance_uuid,
              status: instance.status,
              base_url: ENV["EVOLUTION_GO_BASE_URL"].presence,
              connected_number: instance.connected_number,
              profile_name: instance.profile_name,
              raw_status: instance.status,
              last_connected_at: nil,
              last_disconnected_at: nil,
              created_at: instance.created_at,
              updated_at: instance.updated_at,
              last_remote_sync_at: instance.last_remote_sync_at,
              source: "remote",
              remote_linked: false,
              company: {
                id: nil,
                name: "Nao vinculada",
                slug: "unlinked",
                status: "remote"
              }
            }
          end

          def log!(instance, level, message, metadata = {})
            WhatsappLog.create!(
              company: instance.company,
              whatsapp_instance: instance,
              level: level,
              message: message,
              metadata_json: safe_result(metadata)
            )
            audit!(
              activity_action_for(message, level),
              company: instance.company,
              resource: instance,
              metadata: safe_result(metadata).merge(level: level, message: message, instance_name: instance.instance_name)
            )
            system_alert!(level: "error", title: "Falha WhatsApp / Evolution Go", message: message, company: instance.company) if level == "err"
          end

          def create_error_log(company:, message:)
            return unless company

            WhatsappLog.create!(company: company, level: "err", message: message, metadata_json: {})
            system_alert!(level: "error", title: "Falha na Evolution Go", message: message, company: company)
          end

          def activity_action_for(message, level)
            return "whatsapp_error" if level == "err"
            return "whatsapp_instance_created" if message.include?("criada")
            return "whatsapp_instance_synced" if message.include?("sincronizados")
            return "whatsapp_instance_status_checked" if message.include?("Status")
            return "whatsapp_instance_qrcode_requested" if message.include?("QR Code")
            return "whatsapp_instance_disconnected" if message.include?("desconectada")
            return "whatsapp_instance_restarted" if message.include?("reiniciada")
            return "whatsapp_instance_deleted" if message.include?("removida")

            "whatsapp_event"
          end

          def safe_result(value)
            scrub_secret(value.as_json)
          end

          def scrub_secret(value)
            case value
            when Array
              value.map { |item| scrub_secret(item) }
            when Hash
              value.each_with_object({}) do |(key, item), result|
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
