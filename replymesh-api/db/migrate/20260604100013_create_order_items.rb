class CreateOrderItems < ActiveRecord::Migration[8.1]
  def change
    create_table :order_items do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.references :order,   null: false, foreign_key: { on_delete: :cascade }
      t.references :product, foreign_key: { on_delete: :nullify }
      t.text    :product_name,          null: false  # desnormalizado para histórico
      t.integer :unit_price_cents,      null: false, default: 0
      t.integer :unit_cost_cents,       default: 0   # custo no momento da venda
      t.integer :quantity,              null: false, default: 1
      t.integer :total_price_cents,     null: false, default: 0
      t.integer :total_cost_cents,      default: 0
      t.jsonb   :selected_options,      default: []  # opções escolhidas pelo cliente
      # status: active|sent_to_kitchen|preparing|ready|delivered|cancelled
      t.text    :status,                null: false, default: "active"
      t.text    :notes
      t.datetime :sent_to_kitchen_at
      t.datetime :cancelled_at
      t.references :cancelled_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :order_items, %i[company_id order_id]
    add_index :order_items, %i[company_id status]
    add_index :order_items, :legacy_id
  end
end
