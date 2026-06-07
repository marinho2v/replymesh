module Api
  module V1
    module Master
      class InvitesController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_invite, only: %i[cancel resend]

        def index
          render json: { success: true, invites: MasterInvite.includes(:master_role).recent.map { |invite| serialize(invite) } }
        end

        def create
          invite = MasterInvite.new(invite_params.merge(invited_by: current_user))
          if invite.save
            audit!("master_invite_created", resource: invite, metadata: { email: invite.email, master_role_id: invite.master_role_id })
            render json: { success: true, invite: serialize(invite) }, status: :created
          else
            render json: { success: false, errors: invite.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def cancel
          @invite.update!(status: "canceled")
          audit!("master_invite_canceled", resource: @invite, metadata: { email: @invite.email })
          render json: { success: true, invite: serialize(@invite) }
        end

        def resend
          @invite.refresh_expiration!
          audit!("master_invite_resent", resource: @invite, metadata: { email: @invite.email, resend_count: @invite.resend_count })
          render json: { success: true, invite: serialize(@invite) }
        end

        private

        def set_invite
          @invite = MasterInvite.find(params[:id])
        end

        def invite_params
          params.require(:invite).permit(:name, :email, :master_role_id)
        end

        def serialize(invite)
          frontend_url = ENV.fetch("MASTER_FRONTEND_URL", "http://127.0.0.1:5173")
          invite.as_json_safe(base_url: frontend_url)
        end
      end
    end
  end
end
