module Api
  module V1
    module Master
      class TicketsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_ticket, only: %i[show create_message update_status]

        def index
          scope = SupportTicket.includes(:company, :user, support_ticket_messages: :user).recent
          scope = scope.where(company_id: params[:company_id]) if params[:company_id].present?
          scope = scope.where(status: params[:status]) if params[:status].present?
          scope = scope.where(priority: params[:priority]) if params[:priority].present?
          scope = scope.where("support_tickets.created_at >= ?", params[:start_date]) if params[:start_date].present?
          scope = scope.where("support_tickets.created_at <= ?", params[:end_date]) if params[:end_date].present?

          render json: {
            success: true,
            tickets: scope.limit(page_limit).offset(page_offset).map { |ticket| serialize_ticket(ticket) },
            total: scope.count
          }
        end

        def show
          render json: { success: true, ticket: serialize_ticket(@ticket, include_messages: true) }
        end

        def create_message
          message = @ticket.support_ticket_messages.create!(
            user: current_user,
            message: params.require(:message),
            internal: ActiveModel::Type::Boolean.new.cast(params[:internal])
          )
          audit!("master_support_ticket_message_created", company: @ticket.company, resource: @ticket)
          NotificationService.ticket_replied(@ticket) rescue nil unless message.internal
          render json: { success: true, message: serialize_message(message) }, status: :created
        end

        def update_status
          if @ticket.update(status: params.require(:status))
            audit!("master_support_ticket_status_updated", company: @ticket.company, resource: @ticket, metadata: { status: @ticket.status })
            render json: { success: true, ticket: serialize_ticket(@ticket.reload, include_messages: true) }
          else
            render json: { success: false, errors: @ticket.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def set_ticket
          @ticket = SupportTicket.includes(:company, :user, support_ticket_messages: :user).find(params[:id])
        end

        def page_limit
          [[params.fetch(:limit, 50).to_i, 1].max, 200].min
        end

        def page_offset
          [params.fetch(:offset, 0).to_i, 0].max
        end

        def serialize_ticket(ticket, include_messages: false)
          last_message = ticket.support_ticket_messages.max_by(&:created_at)
          payload = ticket.as_json(
            only: %i[id company_id user_id subject message priority status resolved_at closed_at created_at updated_at]
          ).merge(
            company_name: ticket.company&.name,
            company_slug: ticket.company&.slug,
            user_name: ticket.user&.name,
            user_email: ticket.user&.email,
            last_message: last_message&.message,
            messages_count: ticket.support_ticket_messages.size
          )

          if include_messages
            payload[:messages] = ticket.support_ticket_messages.sort_by(&:created_at).map { |message| serialize_message(message) }
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
