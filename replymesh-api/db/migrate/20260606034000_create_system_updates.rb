class CreateSystemUpdates < ActiveRecord::Migration[7.1]
  def change
    create_table :system_updates do |t|
      t.string :title, null: false
      t.string :short_description, null: false
      t.text :content, null: false
      t.string :version, null: false
      t.string :update_type, null: false, default: "improvement"
      t.string :status, null: false, default: "draft"
      t.string :audience_type, null: false, default: "all"
      t.references :company, foreign_key: true, null: true
      t.string :plan_key
      t.boolean :is_featured, null: false, default: false
      t.datetime :published_at
      t.string :icon
      t.string :color
      t.string :link_url
      t.string :image_url
      t.timestamps
    end

    add_index :system_updates, :version
    add_index :system_updates, :status
    add_index :system_updates, :update_type
    add_index :system_updates, :audience_type
    add_index :system_updates, :published_at
  end
end
