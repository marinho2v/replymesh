class AddOperationalSettingsToStoreSettings < ActiveRecord::Migration[8.1]
  def change
    add_column :store_settings, :closed_message, :text
    add_column :store_settings, :allow_pickup, :boolean, default: true, null: false
    add_column :store_settings, :block_outside_delivery_area, :boolean, default: true, null: false
    add_column :store_settings, :block_orders_when_closed, :boolean, default: true, null: false
    add_column :store_settings, :pix_receiver_name, :string
    add_column :store_settings, :pix_receiver_city, :string
    add_column :store_settings, :pix_payload, :text
    add_column :store_settings, :pix_qr_code_url, :text
    add_column :store_settings, :print_footer, :text
    add_column :store_settings, :average_delivery_time, :string
    add_column :store_settings, :default_support_message, :text
    add_column :store_settings, :default_order_message, :text
    add_column :store_settings, :recurring_customer_min_orders, :integer, default: 2, null: false
  end
end
