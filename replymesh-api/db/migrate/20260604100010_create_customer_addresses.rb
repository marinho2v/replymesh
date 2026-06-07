class CreateCustomerAddresses < ActiveRecord::Migration[8.1]
  def change
    create_table :customer_addresses do |t|
      t.references :company,  null: false, foreign_key: { on_delete: :cascade }
      t.references :customer, null: false, foreign_key: { on_delete: :cascade }
      t.text    :zip_code
      t.text    :street
      t.text    :number
      t.text    :complement
      t.text    :neighborhood
      t.text    :city
      t.text    :state
      t.text    :reference
      t.boolean :is_default,  null: false, default: false
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :customer_addresses, %i[company_id customer_id]
    add_index :customer_addresses, :legacy_id
  end
end
