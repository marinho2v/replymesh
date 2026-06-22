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
          return test_store_ai_provider(setting) if params[:scope].to_s == "store_ai" || params[:provider].present?

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
              models: AiUsageLog.group(:assistant_type, :model).count.map { |(type, model), count| { assistant_type: type, model: model, messages: count } },
              knowledge_gaps: knowledge_gaps
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

        def knowledge_gaps
          AiAssistantLog.includes(:company, :user).where(status: "gap").order(created_at: :desc).limit(20).map do |log|
            probable_module = log.error_message.to_s[/module=([^|]+)/, 1].to_s.strip.presence || "A revisar"
            {
              id: log.id,
              question: log.question,
              company_id: log.company_id,
              company_name: log.company&.name || "Empresa removida",
              user_name: log.user&.name || "Usuario removido",
              probable_module: probable_module,
              created_at: log.created_at,
              article_draft: article_draft(log.question, probable_module)
            }
          end
        end

        def article_draft(question, probable_module)
          <<~MARKDOWN.strip
            # #{probable_module}
            <!-- keywords: revisar -->
            **Modulo:** #{probable_module}
            **Pergunta:** #{question}

            **Resposta ideal:** Preencher apos validacao humana.

            **Passo a passo:** 1. Revisar o fluxo real. 2. Documentar o caminho do menu. 3. Validar antes de publicar.
            **Observacoes:** Nao incluir senhas, tokens ou dados de clientes.
            **Quando abrir ticket:** Quando o fluxo documentado nao resolver.
          MARKDOWN
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
            :per_minute_user_limit,
            :store_ai_enabled,
            :store_ai_provider,
            :store_ai_model,
            :store_ai_groq_api_key,
            :store_ai_claude_api_key,
            :store_ai_openai_api_key,
            :store_ai_daily_message_limit,
            :store_ai_monthly_message_limit,
            :store_ai_monthly_token_limit,
            :store_ai_timeout_seconds,
            :store_ai_max_context_products,
            :store_ai_handoff_attempts
          )
        end

        def test_store_ai_provider(setting)
          provider = params[:provider].presence || setting.store_ai_provider
          provider = "anthropic" if provider == "claude"
          model = params[:model].presence || setting.store_ai_model
          message = params[:message].presence || "Responda apenas: conexao IA das lojas OK."

          if provider.blank? || provider == "disabled"
            return render json: {
              success: false,
              error: "ai_provider_not_configured",
              message: "Provider da IA das lojas desativado ou nao configurado."
            }, status: :unprocessable_entity
          end

          api_key = setting.store_ai_api_key_for(provider)
          if api_key.blank?
            return render json: {
              success: false,
              error: "ai_provider_not_configured",
              provider: provider,
              model: model,
              message: "Chave da IA das lojas nao configurada para este provider."
            }, status: :unprocessable_entity
          end

          started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
          result = AiProviderService.build(provider: provider, api_key: api_key, model: model).chat(
            system_prompt: "Voce e um teste seguro de conectividade da IA das lojas Replymesh. Responda curto.",
            user_message: message,
            max_tokens: 80
          )
          latency_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round

          if result.success?
            render json: {
              success: true,
              provider: provider,
              model: model,
              latency_ms: latency_ms,
              answer: result.content,
              tokens: result.tokens,
              settings: setting.as_json_safe
            }
          else
            render json: {
              success: false,
              error: result.error,
              provider: provider,
              model: model,
              latency_ms: latency_ms
            }, status: :bad_gateway
          end
        rescue ArgumentError => e
          render json: { success: false, error: e.message }, status: :unprocessable_entity
        end
      end
    end
  end
end
