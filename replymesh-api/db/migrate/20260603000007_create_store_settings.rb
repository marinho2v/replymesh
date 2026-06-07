class CreateStoreSettings < ActiveRecord::Migration[8.1]
  def change
    create_table :store_settings do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }, index: { unique: true }
      t.text    :store_name
      t.text    :logo_url
      t.text    :cover_url
      t.text    :primary_color,              default: "#16a34a"
      t.text    :secondary_color,            default: "#0b0b0d"
      t.text    :accent_color,               default: "#2563eb"
      t.text    :whatsapp_number
      t.text    :phone
      t.text    :email
      t.text    :address
      t.text    :city
      t.text    :state
      t.text    :zip_code
      t.boolean :delivery_enabled,           null: false, default: true
      t.boolean :pickup_enabled,             null: false, default: true
      t.boolean :dine_in_enabled,            null: false, default: false
      t.integer :min_order_value_cents,      null: false, default: 0
      t.integer :default_delivery_fee_cents, null: false, default: 0
      t.integer :estimated_delivery_minutes, null: false, default: 40
      t.text    :store_status,               null: false, default: "open"

      t.timestamps null: false
    end
  end
end
