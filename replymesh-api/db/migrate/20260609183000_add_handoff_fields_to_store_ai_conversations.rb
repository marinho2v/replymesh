class AddHandoffFieldsToStoreAiConversations < ActiveRecord::Migration[8.1]
  def change
    add_column :store_ai_conversations, :paused_until, :datetime
    add_column :store_ai_conversations, :handoff_reason, :string

    add_index :store_ai_conversations, [:company_id, :phone, :paused_until], name: "index_store_ai_conversations_pause_lookup"
  end
end
