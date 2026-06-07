class CreateCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :categories do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.text    :name,       null: false
      t.text    :slug,       null: false
      t.integer :sort_order, null: false, default: 0
      t.boolean :is_active,  null: false, default: true
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :categories, %i[company_id slug], unique: true
    add_index :categories, %i[company_id is_active]
    add_index :categories, %i[company_id sort_order]
    add_index :categories, :legacy_id
  end
end
