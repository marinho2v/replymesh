module Api
  module V1
    module Store
      class WheelController < BaseController
        def summary
          render_ok(WheelService.new(company: current_company).admin_summary)
        end

        def spins
          service = WheelService.new(company: current_company)
          render_ok(spins: service.admin_spin_history(
            start_date: params[:startDate] || params[:start_date],
            end_date: params[:endDate] || params[:end_date],
            search: params[:search],
            prize_id: params[:prizeId] || params[:prize_id],
            status: params[:status],
            limit: params[:limit]
          ))
        end
      end
    end
  end
end
