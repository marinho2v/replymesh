class ExtendStoreSettingsForCompanySettings < ActiveRecord::Migration[8.1]
  def change
    change_table :store_settings, bulk: true do |t|
      t.text :company_name
      t.text :trade_name
      t.text :banner_url
      t.text :whatsapp
      t.text :instagram
      t.text :facebook
      t.integer :delivery_fee_cents, null: false, default: 0
      t.integer :free_delivery_above_cents, null: false, default: 0
      t.boolean :pix_enabled, null: false, default: false
      t.text :pix_key
      t.text :pix_key_type
      t.jsonb :opening_hours, null: false, default: {}
      t.text :order_message_template
      t.jsonb :accepted_payment_methods, null: false, default: []
    end
  end
end
