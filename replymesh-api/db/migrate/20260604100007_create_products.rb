class CreateProducts < ActiveRecord::Migration[8.1]
  def change
    create_table :products do |t|
      t.references :company,              null: false, foreign_key: { on_delete: :cascade }
      t.references :category,             null: false, foreign_key: { on_delete: :restrict }
      t.references :stock_item, foreign_key: { to_table: :inventory_items, on_delete: :nullify }
      t.text    :name,                    null: false
      t.text    :slug,                    null: false
      t.text    :description
      t.integer :price_cents,             null: false, default: 0
      t.integer :promotional_price_cents
      t.integer :cost_price_cents,        default: 0
      t.text    :image_url
      t.boolean :is_featured,             null: false, default: false
      t.boolean :is_promotional,          null: false, default: false
      t.boolean :is_combo,                null: false, default: false
      t.boolean :is_customizable,         null: false, default: false
      t.boolean :track_inventory,         null: false, default: false
      t.integer :sort_order,              null: false, default: 0
      t.boolean :is_active,               null: false, default: true
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :products, %i[company_id slug], unique: true
    add_index :products, %i[company_id is_active]
    add_index :products, %i[company_id is_featured]
    add_index :products, %i[company_id category_id]
    add_index :products, :legacy_id
  end
end
