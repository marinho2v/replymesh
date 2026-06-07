class AddPremiumMetricsToAiAssistantLogs < ActiveRecord::Migration[8.1]
  def change
    add_column :ai_assistant_logs, :tokens_used, :integer, null: false, default: 0
    add_column :ai_assistant_logs, :response_time_ms, :integer, null: false, default: 0

    add_index :ai_assistant_logs, %i[company_id user_id created_at],
              name: "index_ai_logs_on_company_user_created_at"
  end
end
