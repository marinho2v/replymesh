class CreateStoreAiRagTables < ActiveRecord::Migration[8.1]
  def change
    create_table :store_ai_settings do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }
      t.boolean :enabled, null: false, default: false
      t.string :assistant_name, null: false, default: "Assistente da Loja"
      t.text :initial_message, null: false, default: "Ola! Como posso ajudar?"
      t.string :tone, null: false, default: "simpatico, objetivo e natural"
      t.string :model
      t.integer :daily_limit, null: false, default: 100
      t.boolean :allow_orders, null: false, default: true
      t.boolean :allow_products, null: false, default: true
      t.boolean :allow_hours, null: false, default: true
      t.boolean :allow_promotions, null: false, default: true
      t.boolean :allow_order_status, null: false, default: true
      t.timestamps
    end

    create_table :store_ai_conversations do |t|
      t.references :company, null: false, foreign_key: true
      t.references :customer, null: true, foreign_key: true
      t.string :channel, null: false, default: "simulator"
      t.string :phone
      t.string :status, null: false, default: "open"
      t.datetime :last_message_at
      t.jsonb :context, null: false, default: {}
      t.timestamps
    end
    add_index :store_ai_conversations, %i[company_id phone status],
              name: "index_store_ai_conversations_lookup"

    create_table :store_ai_messages do |t|
      t.references :store_ai_conversation, null: false, foreign_key: true
      t.string :role, null: false
      t.text :content, null: false
      t.jsonb :rag_chunks, null: false, default: []
      t.integer :tokens_used, null: false, default: 0
      t.integer :response_time_ms, null: false, default: 0
      t.timestamps
    end
    add_index :store_ai_messages, %i[store_ai_conversation_id created_at],
              name: "index_store_ai_messages_conversation_created"

    create_table :ai_usage_logs do |t|
      t.references :company, null: true, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.string :assistant_type, null: false
      t.string :provider, null: false, default: "claude"
      t.string :model
      t.integer :input_tokens, null: false, default: 0
      t.integer :output_tokens, null: false, default: 0
      t.integer :total_tokens, null: false, default: 0
      t.decimal :estimated_cost_usd, precision: 12, scale: 6, null: false, default: 0
      t.integer :response_time_ms, null: false, default: 0
      t.string :status, null: false, default: "success"
      t.timestamps
    end
    add_index :ai_usage_logs, %i[company_id assistant_type created_at],
              name: "index_ai_usage_company_type_created"
  end
end
