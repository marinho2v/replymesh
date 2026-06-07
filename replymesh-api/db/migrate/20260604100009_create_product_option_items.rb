class CreateProductOptionItems < ActiveRecord::Migration[8.1]
  def change
    create_table :product_option_items do |t|
      t.references :company,              null: false, foreign_key: { on_delete: :cascade }
      t.references :product_option_group, null: false, foreign_key: { on_delete: :cascade }
      t.text    :name,                   null: false
      t.integer :additional_price_cents, null: false, default: 0
      t.boolean :is_active,              null: false, default: true
      t.integer :sort_order,             null: false, default: 0
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :product_option_items, %i[company_id product_option_group_id]
    add_index :product_option_items, :legacy_id
  end
end
