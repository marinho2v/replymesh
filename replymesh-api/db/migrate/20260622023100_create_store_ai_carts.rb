class CreateStoreAiCarts < ActiveRecord::Migration[7.1]
  def change
    create_table :store_ai_carts do |t|
      t.references :company, null: false, foreign_key: true
      t.references :store_ai_conversation, null: false, foreign_key: true
      t.string :customer_phone, null: false
      t.string :stage, null: false, default: "greeting"
      t.jsonb :items, null: false, default: []
      t.jsonb :selected_options, null: false, default: {}
      t.jsonb :delivery_address, null: false, default: {}
      t.integer :delivery_fee_cents, null: false, default: 0
      t.string :payment_method
      t.integer :subtotal_cents, null: false, default: 0
      t.integer :discount_cents, null: false, default: 0
      t.integer :total_cents, null: false, default: 0
      t.datetime :expires_at, null: false
      t.jsonb :metadata_json, null: false, default: {}

      t.timestamps
    end

    add_index :store_ai_carts, [:company_id, :customer_phone, :stage], name: "index_store_ai_carts_lookup"
    add_index :store_ai_carts, :expires_at
  end
end
