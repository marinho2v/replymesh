class CreateCashMovements < ActiveRecord::Migration[8.1]
  def change
    create_table :cash_movements do |t|
      t.references :company,      null: false, foreign_key: { on_delete: :cascade }
      t.references :cash_session, null: false, foreign_key: { on_delete: :restrict }
      # movement_type: sale_cash|sale_pix|sale_card|change_given|sangria|reinforcement|withdrawal|adjustment|refund
      t.text    :movement_type,          null: false
      t.integer :amount_cents,           null: false, default: 0
      t.boolean :affects_physical_cash,  null: false, default: true
      t.references :order,               foreign_key: { on_delete: :nullify }
      t.references :created_by,          foreign_key: { to_table: :users, on_delete: :nullify }
      t.text    :notes
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :cash_movements, %i[company_id cash_session_id]
    add_index :cash_movements, %i[company_id order_id movement_type],
              unique: true,
              where: "order_id IS NOT NULL AND movement_type IN ('sale_cash','sale_pix','sale_card','change_given')",
              name: "unique_order_cash_movement_type"
    add_index :cash_movements, :legacy_id
  end
end
