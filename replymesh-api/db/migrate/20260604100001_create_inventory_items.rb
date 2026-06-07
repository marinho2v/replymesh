class CreateInventoryItems < ActiveRecord::Migration[8.1]
  def change
    create_table :inventory_items do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.text    :name,              null: false
      t.text    :slug,              null: false
      t.text    :unit,              null: false, default: "un"   # un, kg, l, g, ml
      t.text    :category
      t.decimal :current_quantity,  null: false, default: 0, precision: 10, scale: 3
      t.decimal :minimum_quantity,  null: false, default: 0, precision: 10, scale: 3
      t.decimal :cost_price,        precision: 10, scale: 2
      t.boolean :is_active,         null: false, default: true
      t.text    :notes
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :inventory_items, %i[company_id slug], unique: true
    add_index :inventory_items, %i[company_id is_active]
    add_index :inventory_items, :legacy_id
  end
end
