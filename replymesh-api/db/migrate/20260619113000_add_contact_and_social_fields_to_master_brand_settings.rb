class AddContactAndSocialFieldsToMasterBrandSettings < ActiveRecord::Migration[7.1]
  def change
    add_column :master_brand_settings, :support_location, :string
    add_column :master_brand_settings, :instagram_url, :string
    add_column :master_brand_settings, :facebook_url, :string
    add_column :master_brand_settings, :youtube_url, :string
  end
end
