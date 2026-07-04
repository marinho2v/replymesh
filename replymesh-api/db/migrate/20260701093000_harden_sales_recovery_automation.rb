class HardenSalesRecoveryAutomation < ActiveRecord::Migration[7.1]
  def change
    add_column :sales_recovery_settings, :cooldown_hours, :integer, null: false, default: 24
    add_column :sales_recovery_settings, :recent_response_minutes, :integer, null: false, default: 30
    add_column :sales_recovery_settings, :min_cart_total_cents, :integer, null: false, default: 0
    add_column :sales_recovery_settings, :quiet_hours_enabled, :boolean, null: false, default: true
    add_column :sales_recovery_settings, :quiet_window_start, :string, null: false, default: "22:00"
    add_column :sales_recovery_settings, :quiet_window_end, :string, null: false, default: "08:00"
    add_column :sales_recovery_settings, :coupon_rules_json, :jsonb, null: false, default: {}

    add_column :sales_recovery_events, :recovery_score, :integer, null: false, default: 0
    add_column :sales_recovery_events, :block_reason, :string
    add_column :sales_recovery_events, :blocked_at, :datetime
    add_column :sales_recovery_events, :abandoned_minutes, :integer, null: false, default: 0
    add_column :sales_recovery_events, :delivery_strategy, :string, null: false, default: "template"

    add_index :sales_recovery_events, [:company_id, :status, :block_reason, :created_at], name: "idx_sales_recovery_events_blocked"
    add_index :sales_recovery_events, [:company_id, :recovery_score], name: "idx_sales_recovery_events_score"
  end
end
