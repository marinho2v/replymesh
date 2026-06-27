class AddLogisticsSnapshotToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :delivery_area_name, :string
    add_column :orders, :estimated_distance_km, :decimal, precision: 8, scale: 2
    add_column :orders, :estimated_delivery_minutes, :integer
    add_column :orders, :logistics_group, :string
    add_column :orders, :route_priority, :integer

    add_index :orders, [:company_id, :motoboy_id, :delivery_status, :route_priority], name: "idx_orders_motoboy_route_priority"
  end
end
