module Api
  module V1
    module Store
      class BusinessHoursController < BaseController
        before_action :set_hour, only: %i[show update]

        def index
          hours = company_scope(BusinessHour).ordered
          render_ok(business_hours: hours.map { |h| serialize(h) })
        end

        def show
          render_ok(business_hour: serialize(@hour))
        end

        def update
          if @hour.update(hour_params)
            render_ok(business_hour: serialize(@hour))
          else
            render_record_errors(@hour)
          end
        end

        # Criar os 7 dias de uma vez para a empresa
        def bulk_create
          ActiveRecord::Base.transaction do
            hours = (0..6).map do |day|
              company_scope(BusinessHour).find_or_initialize_by(day_of_week: day).tap do |h|
                h.is_open    = true
                h.open_time  = "08:00"
                h.close_time = "22:00"
                h.save!
              end
            end
            render_ok(business_hours: hours.map { |h| serialize(h) })
          end
        rescue ActiveRecord::RecordInvalid => e
          render_record_errors(e.record)
        end

        private

        def set_hour
          @hour = company_scope(BusinessHour).find_by(id: params[:id])
          render_not_found("Horário") unless @hour
        end

        def hour_params
          params.require(:business_hour).permit(:is_open, :open_time, :close_time, :break_start, :break_end, :closed_message)
        end

        def serialize(h)
          h.as_json(only: %i[id day_of_week is_open open_time close_time break_start break_end closed_message])
           .merge(day_name: h.day_name)
        end
      end
    end
  end
end
