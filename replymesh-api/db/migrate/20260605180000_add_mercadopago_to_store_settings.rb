class AddMercadopagoToStoreSettings < ActiveRecord::Migration[7.1]
  def change
    add_column :store_settings, :pix_provider,                   :string,  default: 'manual', null: false
    add_column :store_settings, :mercadopago_public_key,         :string
    add_column :store_settings, :mercadopago_access_token,       :text
    add_column :store_settings, :mercadopago_webhook_secret,     :string
    add_column :store_settings, :mercadopago_enabled,            :boolean, default: false, null: false
  end
end
