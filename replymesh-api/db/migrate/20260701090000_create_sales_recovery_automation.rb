class CreateSalesRecoveryAutomation < ActiveRecord::Migration[8.0]
  def change
    create_table :sales_recovery_settings do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }
      t.boolean :enabled, null: false, default: false
      t.integer :delay_minutes, null: false, default: 60
      t.integer :daily_limit, null: false, default: 20
      t.string :window_start, null: false, default: "08:00"
      t.string :window_end, null: false, default: "21:00"
      t.integer :allowed_weekdays, null: false, default: [], array: true
      t.boolean :use_ai, null: false, default: true
      t.boolean :auto_coupon, null: false, default: true
      t.integer :default_discount_percent, null: false, default: 10
      t.boolean :free_delivery, null: false, default: false
      t.integer :coupon_validity_hours, null: false, default: 48
      t.integer :per_customer_daily_limit, null: false, default: 1
      t.integer :queue_spacing_minutes, null: false, default: 3
      t.text :message_template
      t.jsonb :metadata_json, null: false, default: {}

      t.timestamps
    end

    create_table :sales_recovery_events do |t|
      t.references :company, null: false, foreign_key: true
      t.references :store_ai_cart, foreign_key: true
      t.references :customer, foreign_key: true
      t.references :coupon, foreign_key: true
      t.references :marketing_message_log, foreign_key: true
      t.bigint :recovered_order_id
      t.string :customer_phone, null: false
      t.string :status, null: false, default: "queued"
      t.string :source, null: false, default: "store_ai_cart"
      t.text :message
      t.text :error_message
      t.datetime :scheduled_at
      t.datetime :sent_at
      t.datetime :responded_at
      t.datetime :recovered_at
      t.integer :cart_total_cents, null: false, default: 0
      t.integer :recovered_value_cents, null: false, default: 0
      t.jsonb :cart_snapshot, null: false, default: {}
      t.jsonb :metadata_json, null: false, default: {}

      t.timestamps
    end

    add_index :sales_recovery_events, [:company_id, :status, :scheduled_at], name: "idx_sales_recovery_events_queue"
    add_index :sales_recovery_events, [:company_id, :customer_phone, :created_at], name: "idx_sales_recovery_events_customer"
    add_index :sales_recovery_events, [:company_id, :store_ai_cart_id], unique: true, where: "store_ai_cart_id IS NOT NULL", name: "idx_sales_recovery_events_unique_cart"
    add_index :sales_recovery_events, :recovered_order_id
  end
end
