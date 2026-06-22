class AddStoreAiGlobalSettingsToAiGlobalSettings < ActiveRecord::Migration[8.1]
  def change
    add_column :ai_global_settings, :store_ai_enabled, :boolean, null: false, default: false
    add_column :ai_global_settings, :store_ai_provider, :string, null: false, default: "groq"
    add_column :ai_global_settings, :store_ai_model, :string, null: false, default: "llama-3.1-8b-instant"
    add_column :ai_global_settings, :store_ai_groq_api_key_encrypted, :text
    add_column :ai_global_settings, :store_ai_claude_api_key_encrypted, :text
    add_column :ai_global_settings, :store_ai_openai_api_key_encrypted, :text
    add_column :ai_global_settings, :store_ai_daily_message_limit, :integer, null: false, default: 100
    add_column :ai_global_settings, :store_ai_monthly_message_limit, :integer, null: false, default: 3_000
    add_column :ai_global_settings, :store_ai_monthly_token_limit, :integer, null: false, default: 300_000
    add_column :ai_global_settings, :store_ai_timeout_seconds, :integer, null: false, default: 30
    add_column :ai_global_settings, :store_ai_max_context_products, :integer, null: false, default: 8
    add_column :ai_global_settings, :store_ai_handoff_attempts, :integer, null: false, default: 2
  end
end
