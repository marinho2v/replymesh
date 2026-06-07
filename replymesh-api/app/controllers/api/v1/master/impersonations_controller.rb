module Api
  module V1
    module Master
      class ImpersonationsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_master_user!

        def destroy
          session = MasterImpersonationSession.find_by(
            token_hash: MasterImpersonationSession.digest(params[:token])
          )

          unless session && session.master_user_id == current_user.id
            return render json: { success: false, error: "Sessao de suporte nao encontrada" }, status: :not_found
          end

          session.revoke! unless session.revoked_at?
          audit!(
            "company_impersonation_ended",
            company: session.company,
            resource: session,
            metadata: { expires_at: session.expires_at }
          )

          render json: { success: true, revoked_at: session.revoked_at }
        end
      end
    end
  end
end
