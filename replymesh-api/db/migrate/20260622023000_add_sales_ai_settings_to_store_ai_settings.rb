class AddSalesAiSettingsToStoreAiSettings < ActiveRecord::Migration[7.1]
  def change
    add_column :store_ai_settings, :ai_provider, :string, null: false, default: "anthropic"
    add_column :store_ai_settings, :ai_model, :string
    add_column :store_ai_settings, :ai_mode, :string, null: false, default: "answers"
    add_column :store_ai_settings, :ai_sales_mode_enabled, :boolean, null: false, default: false
    add_column :store_ai_settings, :ai_auto_reply_enabled, :boolean, null: false, default: false
    add_column :store_ai_settings, :ai_daily_message_limit, :integer, null: false, default: 100
    add_column :store_ai_settings, :ai_monthly_message_limit, :integer, null: false, default: 3_000
    add_column :store_ai_settings, :ai_monthly_token_limit, :integer, null: false, default: 300_000

    add_column :store_ai_settings, :identify_customer_by_phone, :boolean, null: false, default: true
    add_column :store_ai_settings, :confirm_saved_address, :boolean, null: false, default: true
    add_column :store_ai_settings, :create_customer, :boolean, null: false, default: true
    add_column :store_ai_settings, :allow_address_update, :boolean, null: false, default: true

    add_column :store_ai_settings, :auto_cart_enabled, :boolean, null: false, default: false
    add_column :store_ai_settings, :create_order_after_confirmation, :boolean, null: false, default: false
    add_column :store_ai_settings, :calculate_delivery_fee, :boolean, null: false, default: true
    add_column :store_ai_settings, :verify_store_hours, :boolean, null: false, default: true
    add_column :store_ai_settings, :verify_delivery_area, :boolean, null: false, default: true
    add_column :store_ai_settings, :apply_coupon_enabled, :boolean, null: false, default: true

    add_column :store_ai_settings, :offer_cash, :boolean, null: false, default: true
    add_column :store_ai_settings, :offer_pix, :boolean, null: false, default: true
    add_column :store_ai_settings, :auto_generate_mercadopago_pix, :boolean, null: false, default: false
    add_column :store_ai_settings, :send_pix_copy_paste, :boolean, null: false, default: true
    add_column :store_ai_settings, :wait_payment_confirmation, :boolean, null: false, default: true

    add_column :store_ai_settings, :pause_on_attendant_reply, :boolean, null: false, default: true
    add_column :store_ai_settings, :pause_after_order_confirmation, :boolean, null: false, default: true
    add_column :store_ai_settings, :handoff_on_unknown, :boolean, null: false, default: true
    add_column :store_ai_settings, :handoff_on_request, :boolean, null: false, default: true

    add_index :store_ai_settings, :ai_provider
    add_index :store_ai_settings, :ai_mode
  end
end
