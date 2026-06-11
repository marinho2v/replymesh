class AddOriginToCashMovements < ActiveRecord::Migration[8.1]
  def change
    add_column :cash_movements, :origin,             :string
    add_column :cash_movements, :origin_table_name,  :string
    add_column :cash_movements, :origin_waiter_name, :string
  end
end
