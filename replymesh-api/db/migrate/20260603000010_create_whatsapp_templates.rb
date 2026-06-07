class CreateWhatsappTemplates < ActiveRecord::Migration[8.1]
  def change
    create_table :whatsapp_templates do |t|
      t.references :company,     null: false, foreign_key: { on_delete: :cascade }
      t.text    :template_key,   null: false
      t.text    :title,          null: false
      t.text    :message,        null: false
      t.boolean :enabled,        null: false, default: true

      t.timestamps null: false
    end

    add_index :whatsapp_templates, %i[company_id template_key], unique: true
  end
end
