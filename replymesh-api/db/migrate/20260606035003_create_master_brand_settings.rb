class CreateMasterBrandSettings < ActiveRecord::Migration[8.0]
  def change
    create_table :master_brand_settings do |t|
      t.string :platform_name, null: false, default: "Replymesh"
      t.string :light_logo_url
      t.string :dark_logo_url
      t.string :favicon_url
      t.string :primary_color, null: false, default: "#18181b"
      t.string :secondary_color, null: false, default: "#16a34a"
      t.string :support_email
      t.string :support_whatsapp

      t.timestamps
    end
  end
end
