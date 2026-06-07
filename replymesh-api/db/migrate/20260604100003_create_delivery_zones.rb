class CreateDeliveryZones < ActiveRecord::Migration[8.1]
  def change
    create_table :delivery_zones do |t|
      t.references :company,          null: false, foreign_key: { on_delete: :cascade }
      t.text    :name,                null: false
      t.text    :slug,                null: false
      t.text    :city
      t.text    :aliases,             array: true, default: []
      t.integer :delivery_fee_cents,  null: false, default: 0
      t.integer :estimated_minutes,   null: false, default: 40
      t.integer :minimum_order_cents, null: false, default: 0
      t.integer :match_priority,      null: false, default: 0
      t.boolean :is_active,           null: false, default: true
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :delivery_zones, %i[company_id slug], unique: true
    add_index :delivery_zones, %i[company_id is_active]
    add_index :delivery_zones, %i[company_id match_priority]
    add_index :delivery_zones, :legacy_id
  end
end
