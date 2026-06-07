class CreateCoupons < ActiveRecord::Migration[8.1]
  def change
    create_table :coupons do |t|
      t.references :company,               null: false, foreign_key: { on_delete: :cascade }
      t.text    :code,                     null: false
      t.text    :title,                    null: false
      t.text    :description
      # discount_type: percentage | fixed | free_shipping | free_item
      t.text    :discount_type,            null: false, default: "percentage"
      t.decimal :discount_value,           null: false, default: 0, precision: 10, scale: 2
      t.integer :minimum_order_cents,      null: false, default: 0
      t.integer :max_uses
      t.integer :used_count,               null: false, default: 0
      t.datetime :starts_at
      t.datetime :expires_at
      t.boolean :is_active,               null: false, default: true
      t.boolean :is_single_use_per_customer, null: false, default: false
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :coupons, %i[company_id code], unique: true
    add_index :coupons, %i[company_id is_active]
    add_index :coupons, :legacy_id
  end
end
