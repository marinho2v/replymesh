class CreateAiAssistantTables < ActiveRecord::Migration[7.1]
  def change
    create_table :ai_global_settings do |t|
      t.boolean :enabled, null: false, default: false
      t.string :provider, null: false, default: "claude"
      t.string :model, null: false, default: "claude-3-5-haiku-latest"
      t.text :api_key_encrypted
      t.string :assistant_name, null: false, default: "Carina"
      t.string :assistant_avatar_url
      t.text :initial_message, null: false, default: "Oi! Eu sou a Carina, assistente da Replymesh. Posso ajudar voce a usar o sistema."
      t.text :base_prompt
      t.integer :daily_company_limit, null: false, default: 100
      t.integer :per_minute_user_limit, null: false, default: 8

      t.timestamps
    end

    create_table :ai_company_settings do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }
      t.boolean :enabled, null: false, default: false
      t.string :assistant_name
      t.string :assistant_avatar_url
      t.text :initial_message
      t.boolean :show_floating_button, null: false, default: true

      t.timestamps
    end

    create_table :ai_assistant_logs do |t|
      t.references :company, null: true, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.text :question
      t.text :response_summary
      t.string :status, null: false, default: "success"
      t.string :page
      t.integer :estimated_tokens, null: false, default: 0
      t.text :error_message

      t.timestamps
    end

    add_index :ai_assistant_logs, %i[company_id created_at]
    add_index :ai_assistant_logs, %i[user_id created_at]
    add_index :ai_assistant_logs, :status
  end
end
