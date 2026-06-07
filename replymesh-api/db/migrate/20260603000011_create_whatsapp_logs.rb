class CreateWhatsappLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :whatsapp_logs do |t|
      t.references :company,           null: false, foreign_key: { on_delete: :cascade }
      t.references :whatsapp_instance, foreign_key: { on_delete: :nullify }
      t.text  :level,         null: false, default: "info"
      t.text  :message,       null: false
      t.jsonb :metadata_json, default: {}

      t.timestamps null: false
    end

    add_index :whatsapp_logs, :level
  end
end
