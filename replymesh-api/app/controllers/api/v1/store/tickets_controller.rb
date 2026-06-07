module Api
  module V1
    module Store
      class TicketsController < BaseController
        before_action :set_ticket, only: %i[show update_status]

        def index
          scope = company_scope(SupportTicket).includes(:company, :user, support_ticket_messages: :user).recent
          scope = scope.where(status: params[:status]) if params[:status].present?
          scope = scope.where(priority: params[:priority]) if params[:priority].present?

          render_ok(tickets: scope.limit(page_limit).offset(page_offset).map { |ticket| serialize_ticket(ticket) })
        end

        def show
          render_ok(ticket: serialize_ticket(@ticket, include_messages: true))
        end

        def create
          ticket = company_scope(SupportTicket).build(ticket_params.merge(user: current_user))

          if ticket.save
            ticket.support_ticket_messages.create!(
              user: current_user,
              message: ticket.message,
              internal: false
            )
            audit!("support_ticket_created", company: current_company, resource: ticket)
            NotificationService.ticket_created(ticket) rescue nil
            render_created(ticket: serialize_ticket(ticket.reload, include_messages: true))
          else
            render_record_errors(ticket)
          end
        end

        def update_status
          render_error("Somente o suporte master pode alterar o status do ticket", status: :forbidden)
        end

        private

        def set_ticket
          @ticket = company_scope(SupportTicket).includes(:company, :user, support_ticket_messages: :user).find_by(id: params[:id])
          render_not_found("Ticket") unless @ticket
        end

        def ticket_params
          params.require(:ticket).permit(:subject, :message, :priority)
        end

        def serialize_ticket(ticket, include_messages: false)
          last_message = ticket.support_ticket_messages.max_by(&:created_at)
          payload = ticket.as_json(
            only: %i[id company_id user_id subject message priority status resolved_at closed_at created_at updated_at]
          ).merge(
            company_name: ticket.company&.name,
            user_name: ticket.user&.name,
            user_email: ticket.user&.email,
            last_message: last_message&.message,
            messages_count: ticket.support_ticket_messages.size
          )

          if include_messages
            payload[:messages] = ticket.support_ticket_messages.sort_by(&:created_at).map do |message|
              serialize_message(message)
            end
          end

          payload
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
