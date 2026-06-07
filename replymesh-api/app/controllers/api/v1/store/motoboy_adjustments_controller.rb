module Api
  module V1
    module Store
      class MotoboyAdjustmentsController < BaseController
        before_action :set_adjustment, only: :destroy

        def index
          scope = company_scope(MotoboyFinancialAdjustment).includes(:motoboy).recent
          scope = scope.where(motoboy_id: params[:motoboy_id]) if params[:motoboy_id].present?
          scope = scope.where("adjustment_date >= ?", Date.parse(params[:start_date])) if params[:start_date].present?
          scope = scope.where("adjustment_date <= ?", Date.parse(params[:end_date])) if params[:end_date].present?

          render_ok(adjustments: scope.limit(page_limit).map { |item| serialize(item) })
        rescue Date::Error
          render_error("Periodo invalido", status: :bad_request)
        end

        def create
          adjustment = company_scope(MotoboyFinancialAdjustment).new(adjustment_params)
          adjustment.created_by = current_user
          adjustment.save!
          render_created(adjustment: serialize(adjustment))
        rescue ActiveRecord::RecordInvalid => e
          render_record_errors(e.record)
        end

        def destroy
          @adjustment.destroy!
          render_ok(message: "Lancamento removido")
        end

        private

        def set_adjustment
          @adjustment = company_scope(MotoboyFinancialAdjustment).find_by(id: params[:id])
          render_not_found("Lancamento") unless @adjustment
        end

        def adjustment_params
          permitted = params.require(:adjustment).permit(
            :motoboy_id, :type, :direction, :amount, :description, :adjustment_date
          )
          permitted[:adjustment_type] = permitted.delete(:type).presence || "adjustment"
          permitted[:amount_cents] = (BigDecimal(permitted.delete(:amount).to_s) * 100).round
          permitted[:adjustment_date] ||= Date.current
          permitted
        rescue ArgumentError
          raise ActiveRecord::RecordInvalid.new(MotoboyFinancialAdjustment.new)
        end

        def serialize(item)
          {
            id: item.id,
            motoboy_id: item.motoboy_id,
            type: item.adjustment_type,
            direction: item.direction,
            amount: item.amount_cents.to_f / 100,
            description: item.description,
            adjustment_date: item.adjustment_date,
            created_at: item.created_at,
            motoboys: item.motoboy&.slice("id", "name", "phone")
          }
        end
      end
    end
  end
end
