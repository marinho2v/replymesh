class AddCloudStorageKeysToMediaFields < ActiveRecord::Migration[8.0]
  def change
    add_column :store_settings, :logo_storage_key, :string, if_not_exists: true
    add_column :store_settings, :banner_storage_key, :string, if_not_exists: true
    add_column :store_settings, :cover_storage_key, :string, if_not_exists: true
    add_column :store_settings, :favicon_storage_key, :string, if_not_exists: true
    add_column :store_settings, :hero_image_storage_key, :string, if_not_exists: true

    add_column :products, :image_storage_key, :string, if_not_exists: true
    add_column :categories, :image_url, :string, if_not_exists: true
    add_column :categories, :image_storage_key, :string, if_not_exists: true
    add_column :app_banners, :image_storage_key, :string, if_not_exists: true

    add_column :coupons, :image_url, :string, if_not_exists: true
    add_column :coupons, :image_storage_key, :string, if_not_exists: true
    add_column :wheel_prizes, :image_url, :string, if_not_exists: true
    add_column :wheel_prizes, :image_storage_key, :string, if_not_exists: true
    add_column :users, :avatar_storage_key, :string, if_not_exists: true

    add_index :store_settings, :logo_storage_key, if_not_exists: true
    add_index :store_settings, :banner_storage_key, if_not_exists: true
    add_index :store_settings, :cover_storage_key, if_not_exists: true
    add_index :products, :image_storage_key, if_not_exists: true
    add_index :categories, :image_storage_key, if_not_exists: true
    add_index :app_banners, :image_storage_key, if_not_exists: true
    add_index :coupons, :image_storage_key, if_not_exists: true
    add_index :wheel_prizes, :image_storage_key, if_not_exists: true
    add_index :users, :avatar_storage_key, if_not_exists: true
  end
end
