class AddHeroCopyToStoreSettings < ActiveRecord::Migration[7.1]
  def change
    add_column :store_settings, :hero_title, :string
    add_column :store_settings, :hero_highlight, :string
    add_column :store_settings, :hero_subtitle, :text
  end
end
