class CreateTableSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :table_sessions do |t|
      t.references :company,       null: false, foreign_key: { on_delete: :cascade }
      t.references :dining_table,  null: false, foreign_key: { on_delete: :restrict }
      t.references :order,         foreign_key: { on_delete: :nullify }
      t.references :opened_by,     foreign_key: { to_table: :users, on_delete: :nullify }
      t.references :attendant,     foreign_key: { to_table: :users, on_delete: :nullify }
      t.references :closed_by,     foreign_key: { to_table: :users, on_delete: :nullify }
      # status: open|sent_to_kitchen|waiting_payment|paid|closed|cancelled
      t.text    :status,                    null: false, default: "open"
      # payment_method: money|pix|card_on_delivery
      t.text    :payment_method
      # payment_status: pending|paid|refunded|cancelled
      t.text    :payment_status,            null: false, default: "pending"
      t.integer :subtotal_cents,            null: false, default: 0
      t.integer :discount_cents,            null: false, default: 0
      t.integer :service_fee_cents,         null: false, default: 0
      t.decimal :service_fee_percent,       null: false, default: 0, precision: 5, scale: 2
      t.integer :total_cents,               null: false, default: 0
      t.datetime :opened_at,                null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.datetime :sent_to_kitchen_at
      t.datetime :requested_close_at
      t.datetime :paid_at
      t.datetime :closed_at
      t.text    :notes
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :table_sessions, %i[company_id dining_table_id]
    add_index :table_sessions, %i[company_id status]
    add_index :table_sessions, %i[company_id opened_at]
    add_index :table_sessions, :legacy_id
  end
end
