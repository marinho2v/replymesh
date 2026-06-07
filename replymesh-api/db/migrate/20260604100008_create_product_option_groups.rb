class CreateProductOptionGroups < ActiveRecord::Migration[8.1]
  def change
    create_table :product_option_groups do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.references :product, null: false, foreign_key: { on_delete: :cascade }
      t.text    :name,        null: false
      # group_type: single | multiple
      t.text    :group_type,  null: false, default: "single"
      t.boolean :required,    null: false, default: false
      t.integer :min_select,  null: false, default: 0
      t.integer :max_select,  null: false, default: 1
      t.integer :sort_order,  null: false, default: 0
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :product_option_groups, %i[company_id product_id]
    add_index :product_option_groups, :legacy_id
  end
end
