class AddLandingFieldsToMasterBrandSettings < ActiveRecord::Migration[8.0]
  def change
    add_column :master_brand_settings, :landing_logo_url, :string
    add_column :master_brand_settings, :landing_hero_image_url, :string
    add_column :master_brand_settings, :landing_clients, :jsonb, null: false, default: []
  end
end
