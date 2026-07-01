class AddRecoveryIntelligenceMetrics < ActiveRecord::Migration[7.1]
  def change
    add_column :customers, :customer_value_score, :integer, null: false, default: 0
    add_column :customers, :customer_segment, :string, null: false, default: "new"
    add_column :customers, :customer_value_score_calculated_at, :datetime
    add_column :customers, :recovery_reputation_json, :jsonb, null: false, default: {}

    add_column :sales_recovery_events, :customer_value_score, :integer, null: false, default: 0
    add_column :sales_recovery_events, :customer_segment, :string
    add_column :sales_recovery_events, :benefit_decision, :string, null: false, default: "none"
    add_column :sales_recovery_events, :benefit_reason, :string
    add_column :sales_recovery_events, :conversion_minutes, :integer
    add_column :sales_recovery_events, :reputation_snapshot, :jsonb, null: false, default: {}

    add_index :customers, [:company_id, :customer_value_score], name: "idx_customers_company_value_score"
    add_index :sales_recovery_events, [:company_id, :benefit_decision, :status], name: "idx_sales_recovery_events_benefit"
    add_index :sales_recovery_events, [:company_id, :customer_value_score], name: "idx_sales_recovery_events_customer_value"
  end
end
