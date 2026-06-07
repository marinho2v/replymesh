module Api
  module V1
    module Store
      class BusinessHourExceptionsController < BaseController
        before_action :set_exception, only: %i[show update destroy]

        def index
          exceptions = company_scope(BusinessHourException).upcoming
          render_ok(exceptions: exceptions.as_json(only: %i[id exception_date is_open open_time close_time message]))
        end

        def show
          render_ok(exception: @exception.as_json(only: %i[id exception_date is_open open_time close_time message]))
        end

        def create
          exc = company_scope(BusinessHourException).build(exception_params)
          if exc.save
            render_created(exception: exc.as_json(only: %i[id exception_date is_open open_time close_time message]))
          else
            render_record_errors(exc)
          end
        end

        def update
          if @exception.update(exception_params)
            render_ok(exception: @exception.as_json(only: %i[id exception_date is_open open_time close_time message]))
          else
            render_record_errors(@exception)
          end
        end

        def destroy
          @exception.destroy
          render_ok(message: "Exceção removida")
        end

        private

        def set_exception
          @exception = company_scope(BusinessHourException).find_by(id: params[:id])
          render_not_found("Exceção de horário") unless @exception
        end

        def exception_params
          params.require(:exception).permit(:exception_date, :is_open, :open_time, :close_time, :break_start, :break_end, :message)
                .merge(company_id: current_company.id)
        end
      end
    end
  end
end
