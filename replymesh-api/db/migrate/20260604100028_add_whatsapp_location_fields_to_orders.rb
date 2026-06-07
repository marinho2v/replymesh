class AddWhatsappLocationFieldsToOrders < ActiveRecord::Migration[8.1]
  def change
    add_column :orders, :delivery_latitude, :decimal, precision: 10, scale: 7 unless column_exists?(:orders, :delivery_latitude)
    add_column :orders, :delivery_longitude, :decimal, precision: 10, scale: 7 unless column_exists?(:orders, :delivery_longitude)
    add_column :orders, :google_maps_url, :string unless column_exists?(:orders, :google_maps_url)
    add_column :orders, :waze_url, :string unless column_exists?(:orders, :waze_url)
    add_column :orders, :delivery_location_source, :string unless column_exists?(:orders, :delivery_location_source)
    add_column :orders, :delivery_location_received_at, :datetime unless column_exists?(:orders, :delivery_location_received_at)

    add_index :orders, [:company_id, :customer_phone, :status, :created_at],
              name: "idx_orders_location_phone_lookup",
              if_not_exists: true
  end
end
