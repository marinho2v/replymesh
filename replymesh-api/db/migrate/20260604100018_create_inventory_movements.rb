class CreateInventoryMovements < ActiveRecord::Migration[8.1]
  def change
    create_table :inventory_movements do |t|
      t.references :company,        null: false, foreign_key: { on_delete: :cascade }
      t.references :inventory_item, null: false, foreign_key: { on_delete: :cascade }
      # movement_type: in | out | adjust
      t.text    :movement_type,     null: false
      t.decimal :quantity,          null: false, precision: 10, scale: 3
      t.decimal :quantity_before,   null: false, precision: 10, scale: 3
      t.decimal :quantity_after,    null: false, precision: 10, scale: 3
      # source: manual | pedido | cancelamento | ajuste
      t.text    :source,            null: false, default: "manual"
      t.text    :reason
      t.bigint  :reference_id       # order_id se source=pedido
      t.references :user, foreign_key: { on_delete: :nullify }
      t.decimal :unit_cost,         precision: 10, scale: 2
      t.decimal :total_cost,        precision: 10, scale: 2
      t.text    :supplier_name
      t.date    :purchase_date
      t.text    :notes
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :inventory_movements, %i[company_id inventory_item_id]
    add_index :inventory_movements, %i[company_id movement_type]
    add_index :inventory_movements, %i[company_id source]
    add_index :inventory_movements, %i[company_id reference_id]
    add_index :inventory_movements, :legacy_id
  end
end
