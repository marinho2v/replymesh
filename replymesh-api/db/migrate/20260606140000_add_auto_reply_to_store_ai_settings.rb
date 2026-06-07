class AddAutoReplyToStoreAiSettings < ActiveRecord::Migration[8.1]
  def change
    add_column :store_ai_settings, :auto_reply_whatsapp, :boolean, null: false, default: false
    add_index :store_ai_settings, %i[enabled auto_reply_whatsapp]
  end
end
