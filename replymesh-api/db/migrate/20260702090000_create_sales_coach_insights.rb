# frozen_string_literal: true

class CreateSalesCoachInsights < ActiveRecord::Migration[7.1]
  def change
    create_table :sales_coach_insights do |t|
      t.references :company, null: false, foreign_key: true
      t.string :public_id, null: false
      t.string :stable_key, null: false
      t.string :title, null: false
      t.text :description
      t.string :category, null: false
      t.string :priority, null: false
      t.integer :estimated_value_cents, null: false, default: 0
      t.integer :confidence, null: false, default: 0
      t.text :reason
      t.string :origin
      t.string :suggested_action
      t.string :status, null: false, default: "new"
      t.string :feedback_result
      t.integer :feedback_impact_cents, null: false, default: 0
      t.datetime :generated_at
      t.datetime :viewed_at
      t.datetime :accepted_at
      t.datetime :ignored_at
      t.datetime :archived_at
      t.datetime :manual_executed_at
      t.datetime :worked_at
      t.datetime :failed_at
      t.jsonb :metadata_json, null: false, default: {}

      t.timestamps
    end

    add_index :sales_coach_insights, %i[company_id public_id], unique: true
    add_index :sales_coach_insights, %i[company_id stable_key], unique: true
    add_index :sales_coach_insights, %i[company_id status]
    add_index :sales_coach_insights, %i[company_id category]
    add_index :sales_coach_insights, %i[company_id priority]
    add_index :sales_coach_insights, :generated_at
  end
end
