class CreateAppBanners < ActiveRecord::Migration[8.1]
  def change
    create_table :app_banners do |t|
      t.references :company,  null: false, foreign_key: { on_delete: :cascade }
      t.text    :title,       null: false
      t.text    :image_url
      t.text    :link_url
      t.boolean :is_active,   null: false, default: true
      t.integer :sort_order,  null: false, default: 0
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :app_banners, %i[company_id is_active sort_order]
    add_index :app_banners, :legacy_id
  end
end
