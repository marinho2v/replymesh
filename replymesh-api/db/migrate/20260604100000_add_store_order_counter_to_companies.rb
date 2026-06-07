class AddStoreOrderCounterToCompanies < ActiveRecord::Migration[8.1]
  def change
    add_column :companies, :store_order_counter, :bigint, null: false, default: 0
    add_index  :companies, :store_order_counter
  end
end
