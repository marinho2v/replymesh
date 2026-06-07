class CreateDiningTables < ActiveRecord::Migration[8.1]
  def change
    create_table :dining_tables do |t|
      t.references :company,  null: false, foreign_key: { on_delete: :cascade }
      t.integer :number,      null: false
      t.text    :name
      t.text    :slug,        null: false
      t.integer :seats,       null: false, default: 4
      # status: available | occupied | preparing | waiting_payment | closed | disabled
      t.text    :status,      null: false, default: "available"
      t.boolean :is_active,   null: false, default: true
      t.integer :sort_order,  null: false, default: 0
      t.text    :notes
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :dining_tables, %i[company_id slug], unique: true
    add_index :dining_tables, %i[company_id number]
    add_index :dining_tables, %i[company_id status]
    add_index :dining_tables, :legacy_id
  end
end
