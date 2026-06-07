class CreateWhatsappInstances < ActiveRecord::Migration[8.1]
  def change
    create_table :whatsapp_instances do |t|
      t.references :company,  null: false, foreign_key: { on_delete: :cascade }
      t.text    :provider,       null: false, default: "evolution_go"
      t.text    :instance_name,  null: false
      t.text    :status,         null: false, default: "not_created"
      t.text    :base_url
      t.text    :connected_number
      t.text    :qr_code
      t.datetime :last_connected_at
      t.datetime :last_disconnected_at

      t.timestamps null: false
    end

    add_index :whatsapp_instances, %i[company_id instance_name], unique: true
    add_index :whatsapp_instances, :status
  end
end
