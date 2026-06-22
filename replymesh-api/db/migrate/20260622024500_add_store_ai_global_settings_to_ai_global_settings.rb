class AddStoreAiGlobalSettingsToAiGlobalSettings < ActiveRecord::Migration[8.1]
  def change
    add_column :ai_global_settings, :store_ai_enabled, :boolean, null: false, default: false
    add_column :ai_global_settings, :store_ai_provider, :string
    add_column :ai_global_settings, :store_ai_model, :string
    add_column :ai_global_settings, :store_ai_groq_api_key_encrypted, :text
    add_column :ai_global_settings, :store_ai_claude_api_key_encrypted, :text
    add_column :ai_global_settings, :store_ai_openai_api_key_encrypted, :text
    add_column :ai_global_settings, :store_ai_daily_message_limit, :integer, null: false, default: 100
    add_column :ai_global_settings, :store_ai_monthly_message_limit, :integer, null: false, default: 3_000
    add_column :ai_global_settings, :store_ai_monthly_token_limit, :integer, null: false, default: 300_000
    add_column :ai_global_settings, :store_ai_timeout_seconds, :integer, null: false, default: 30
    add_column :ai_global_settings, :store_ai_max_context_products, :integer, null: false, default: 8
    add_column :ai_global_settings, :store_ai_handoff_attempts, :integer, null: false, default: 2

    reversible do |direction|
      direction.up do
        execute <<~SQL.squish
          UPDATE ai_global_settings
          SET store_ai_provider = CASE
                WHEN provider IN ('claude', 'anthropic') THEN 'anthropic'
                WHEN provider = 'openai' THEN 'openai'
                ELSE 'groq'
              END,
              store_ai_model = CASE
                WHEN provider IN ('claude', 'anthropic', 'openai') THEN model
                ELSE 'llama-3.1-8b-instant'
              END
        SQL
      end
    end

    change_column_default :ai_global_settings, :store_ai_provider, from: nil, to: "groq"
    change_column_default :ai_global_settings, :store_ai_model, from: nil, to: "llama-3.1-8b-instant"
    change_column_null :ai_global_settings, :store_ai_provider, false
    change_column_null :ai_global_settings, :store_ai_model, false
  end
end
