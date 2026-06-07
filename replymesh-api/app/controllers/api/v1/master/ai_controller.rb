module Api
  module V1
    module Master
      class AiController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!

        def settings
          render json: { success: true, settings: AiGlobalSetting.current.as_json_safe }
        end

        def update_settings
          setting = AiGlobalSetting.current

          if setting.update(settings_params)
            audit!("ai_global_settings_updated", resource: setting, metadata: setting.as_json_safe.except(:api_key_masked))
            render json: { success: true, settings: setting.as_json_safe }
          else
            render json: { success: false, errors: setting.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def test
          setting = AiGlobalSetting.current
          message = params[:message].presence || "Responda apenas: conexao Claude OK."

          unless setting.api_key_configured?
            return render json: {
              success: false,
              error: "Claude API key nao configurada no backend."
            }, status: :unprocessable_entity
          end

          result = AiProviderService.build(
            provider: setting.provider,
            api_key: setting.api_key,
            model: setting.model
          ).chat(
            system_prompt: setting.base_prompt.presence || AiGlobalSetting::DEFAULT_PROMPT,
            user_message: message,
            max_tokens: 120
          )

          if result.success?
            render json: { success: true, answer: result.content, tokens: result.tokens, settings: setting.as_json_safe }
          else
            render json: { success: false, error: result.error }, status: :bad_gateway
          end
        rescue ArgumentError => e
          render json: { success: false, error: e.message }, status: :unprocessable_entity
        end

        def usage
          render json: {
            success: true,
            usage: {
              carina: usage_for("carina"),
              store_ai: usage_for("store_ai"),
              top_companies: top_companies,
              top_users: top_users,
              models: AiUsageLog.group(:assistant_type, :model).count.map { |(type, model), count| { assistant_type: type, model: model, messages: count } }
            }
          }
        end

        private

        def usage_for(type)
          scope = AiUsageLog.where(assistant_type: type)
          today = scope.where(created_at: Time.current.all_day)
          month = scope.where(created_at: Time.current.all_month)
          {
            messages_today: today.count,
            messages_month: month.count,
            tokens_today: today.sum(:total_tokens),
            tokens_month: month.sum(:total_tokens),
            cost_today: today.sum(:estimated_cost_usd).to_f.round(6),
            cost_month: month.sum(:estimated_cost_usd).to_f.round(6),
            average_response_time_ms: month.average(:response_time_ms).to_f.round
          }
        end

        def top_companies
          AiUsageLog.where.not(company_id: nil).where(created_at: Time.current.all_month)
            .group(:company_id).order(Arel.sql("COUNT(*) DESC")).limit(8).count.map do |company_id, messages|
              company = Company.find_by(id: company_id)
              { company_id: company_id, company_name: company&.name || "Empresa removida", messages: messages }
            end
        end

        def top_users
          AiUsageLog.where.not(user_id: nil).where(created_at: Time.current.all_month)
            .group(:user_id).order(Arel.sql("COUNT(*) DESC")).limit(8).count.map do |user_id, messages|
              user = User.find_by(id: user_id)
              { user_id: user_id, user_name: user&.name || "Usuario removido", messages: messages }
            end
        end

        def settings_params
          params.fetch(:settings, params).permit(
            :enabled,
            :provider,
            :model,
            :api_key,
            :assistant_name,
            :assistant_avatar_url,
            :initial_message,
            :base_prompt,
            :assistant_tone,
            :daily_company_limit,
            :per_minute_user_limit
          )
        end
      end
    end
  end
end
