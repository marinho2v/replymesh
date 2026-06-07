class CompleteMarketingAndCreateAndroidAppRequests < ActiveRecord::Migration[8.1]
  def change
    change_table :marketing_campaigns, bulk: true do |t|
      t.text :message_template
      t.string :coupon_code
      t.integer :pause_seconds, null: false, default: 45
      t.integer :total_recipients, null: false, default: 0
      t.jsonb :metadata, null: false, default: {}
    end

    add_reference :marketing_campaign_recipients, :customer, foreign_key: { on_delete: :nullify }

    create_table :marketing_message_logs do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.references :customer, foreign_key: { on_delete: :nullify }
      t.references :marketing_campaign, foreign_key: { on_delete: :nullify }
      t.string :phone, null: false
      t.text :message, null: false
      t.string :status, null: false, default: "pending"
      t.text :error_message
      t.datetime :sent_at
      t.string :provider, null: false, default: "evolution"
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :marketing_message_logs, %i[company_id status]

    create_table :android_app_requests do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }, index: { unique: true }
      t.string :app_name, null: false
      t.string :display_name, null: false
      t.text :logo_url
      t.text :icon_url
      t.text :splash_url
      t.string :primary_color, null: false, default: "#f59e0b"
      t.string :secondary_color, null: false, default: "#111111"
      t.string :support_whatsapp
      t.text :notes
      t.string :status, null: false, default: "requested"
      t.datetime :requested_at
      t.datetime :approved_at
      t.datetime :published_at
      t.references :responsible, foreign_key: { to_table: :users, on_delete: :nullify }
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :android_app_requests, :status
  end
end
