class CreateNotifications < ActiveRecord::Migration[7.1]
  def change
    create_table :notifications do |t|
      t.references :company, foreign_key: true, null: true, index: true
      t.references :user, foreign_key: true, null: true, index: true
      t.string :title, null: false
      t.text :message
      t.string :notification_type, null: false, default: 'system'
      t.datetime :read_at
      t.string :link_url
      t.jsonb :metadata, default: {}
      t.timestamps
    end

    add_index :notifications, :notification_type
    add_index :notifications, :read_at
    add_index :notifications, [:company_id, :read_at]
    add_index :notifications, [:user_id, :read_at]
  end
end
