module Api
  module V1
    module Master
      class SmtpSettingsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        def show
          render json: { success: true, smtp_settings: SmtpSetting.current.as_json_safe }
        end

        def update
          setting = SmtpSetting.current

          if setting.update(smtp_params)
            audit!("smtp_settings_updated", resource: setting, metadata: setting.as_json_safe.except(:last_test_message))
            render json: { success: true, smtp_settings: setting.as_json_safe }
          else
            render json: { success: false, errors: setting.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def test
          setting = SmtpSetting.current
          recipient = params[:recipient].presence || setting.test_recipient.presence || current_user.email

          unless setting.configured?
            return render json: {
              success: false,
              error: "smtp_not_configured",
              message: "SMTP incompleto. Preencha host, porta, usuario, senha e e-mail remetente."
            }, status: :unprocessable_entity
          end

          SmtpTestMailer.test_email(recipient).deliver_now
          setting.update!(
            test_recipient: recipient,
            last_tested_at: Time.current,
            last_test_status: "success",
            last_test_message: "Teste enviado para #{recipient}."
          )
          audit!("smtp_settings_tested", resource: setting, metadata: { recipient: recipient })
          render json: { success: true, smtp_settings: setting.as_json_safe, message: setting.last_test_message }
        rescue StandardError => e
          setting&.update(
            last_tested_at: Time.current,
            last_test_status: "error",
            last_test_message: "#{e.class}: #{e.message.to_s.truncate(180)}"
          )
          render json: {
            success: false,
            error: "smtp_test_failed",
            message: "Nao foi possivel enviar o e-mail de teste.",
            smtp_settings: setting&.as_json_safe
          }, status: :bad_gateway
        end

        private

        def smtp_params
          params.require(:smtp_settings).permit(
            :enabled,
            :host,
            :port,
            :authentication,
            :ssl,
            :enable_starttls_auto,
            :username,
            :password,
            :from_email,
            :from_name,
            :reply_to,
            :test_recipient
          )
        end
      end
    end
  end
end
