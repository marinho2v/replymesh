module Api
  module V1
    module Master
      module Companies
        class BackupImportsController < ApplicationController
          before_action :authenticate_user!
          before_action :require_super_admin!
          before_action :set_company

          def dry_run
            result = ReplymeshBackupImportService.call(company: @company, payload: backup_payload, import: false)
            render_result(result)
          end

          def create
            result = ReplymeshBackupImportService.call(company: @company, payload: backup_payload, import: true)
            if result.success?
              audit!(
                "company_backup_imported",
                company: @company,
                resource: @company,
                metadata: {
                  imported: result.payload[:imported],
                  updated: result.payload[:updated],
                  skipped: result.payload[:skipped],
                  count_only: result.payload[:count_only_counts]
                }
              )
            end
            render_result(result)
          end

          private

          def set_company
            @company = Company.find(params[:company_id])
          end

          def backup_payload
            params.require(:backup)
          end

          def render_result(result)
            if result.success?
              render json: result.payload
            else
              render json: { success: false, errors: result.errors }, status: :unprocessable_entity
            end
          end
        end
      end
    end
  end
end
