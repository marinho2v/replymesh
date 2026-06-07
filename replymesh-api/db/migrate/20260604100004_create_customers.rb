class CreateCustomers < ActiveRecord::Migration[8.1]
  def change
    create_table :customers do |t|
      t.references :company,       null: false, foreign_key: { on_delete: :cascade }
      t.text    :full_name,        null: false
      t.text    :phone,            null: false
      t.text    :whatsapp
      t.text    :email
      t.integer :total_orders,     null: false, default: 0
      t.integer :total_spent_cents, null: false, default: 0
      t.boolean :is_recurring,     null: false, default: false
      t.datetime :first_order_at
      t.datetime :last_order_at
      t.datetime :last_marketing_sent_at
      t.text    :notes
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :customers, %i[company_id phone], unique: true
    add_index :customers, %i[company_id is_recurring]
    add_index :customers, :legacy_id
  end
end
