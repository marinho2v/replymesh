class AddWhatsappModeToStoreSettings < ActiveRecord::Migration[8.1]
  def change
    add_column :store_settings, :whatsapp_mode, :string, default: "automatic", null: false
    add_check_constraint :store_settings,
                         "whatsapp_mode IN ('automatic', 'manual', 'disabled')",
                         name: "store_settings_whatsapp_mode_check"
  end
end
