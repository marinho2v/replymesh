module Api
  module V1
    module Store
      class TicketMessagesController < BaseController
        before_action :set_ticket

        def create
          message = @ticket.support_ticket_messages.build(
            user: current_user,
            message: params.require(:message),
            internal: false
          )

          if message.save
            @ticket.update!(status: "pending") if @ticket.status == "resolved"
            audit!("support_ticket_message_created", company: current_company, resource: @ticket)
            render_created(message: serialize_message(message))
          else
            render_record_errors(message)
          end
        end

        private

        def set_ticket
          @ticket = company_scope(SupportTicket).find_by(id: params[:ticket_id])
          render_not_found("Ticket") unless @ticket
        end

        def serialize_message(message)
          message.as_json(only: %i[id support_ticket_id user_id message internal created_at]).merge(
            user_name: message.user&.name,
            user_email: message.user&.email
          )
        end
      end
    end
  end
end
