class AddPremiumVisualControlsToStoreSettings < ActiveRecord::Migration[7.1]
  def change
    add_column :store_settings, :hero_image_url, :text unless column_exists?(:store_settings, :hero_image_url)
    add_column :store_settings, :hero_image_position, :string unless column_exists?(:store_settings, :hero_image_position)
    add_column :store_settings, :hero_image_zoom, :integer, default: 100, null: false unless column_exists?(:store_settings, :hero_image_zoom)
    add_column :store_settings, :hero_overlay_opacity, :integer, default: 65, null: false unless column_exists?(:store_settings, :hero_overlay_opacity)
    add_column :store_settings, :hero_height, :integer, default: 480, null: false unless column_exists?(:store_settings, :hero_height)
    add_column :store_settings, :theme_primary_color, :string unless column_exists?(:store_settings, :theme_primary_color)
  end
end
