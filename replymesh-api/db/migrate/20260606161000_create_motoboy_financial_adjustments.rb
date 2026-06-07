class CreateMotoboyFinancialAdjustments < ActiveRecord::Migration[8.0]
  def change
    create_table :motoboy_financial_adjustments do |t|
      t.references :company, null: false, foreign_key: true
      t.references :motoboy, null: false, foreign_key: true
      t.string :adjustment_type, null: false, default: "adjustment"
      t.string :direction, null: false, default: "debit"
      t.integer :amount_cents, null: false, default: 0
      t.string :description
      t.date :adjustment_date, null: false
      t.references :created_by, foreign_key: { to_table: :users }
      t.timestamps
    end

    add_index :motoboy_financial_adjustments,
              %i[company_id adjustment_date],
              name: "idx_motoboy_adjustments_company_date"
  end
end
