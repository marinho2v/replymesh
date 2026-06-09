class AddDeliveryAndPaymentPermissionsToStoreAiSettings < ActiveRecord::Migration[8.1]
  def change
    add_column :store_ai_settings, :allow_delivery, :boolean, null: false, default: true
    add_column :store_ai_settings, :allow_payments, :boolean, null: false, default: true
  end
end
