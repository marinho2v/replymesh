class AddCustomerSourceToCoupons < ActiveRecord::Migration[8.1]
  def change
    add_reference :coupons, :customer, foreign_key: { on_delete: :nullify }
    add_column :coupons, :source, :text, null: false, default: "manual"
    add_column :coupons, :metadata_json, :jsonb, null: false, default: {}

    add_index :coupons, %i[company_id source]
    add_index :coupons, %i[company_id customer_id]
  end
end
