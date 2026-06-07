class AddEvolutionRemoteFieldsToWhatsappInstances < ActiveRecord::Migration[8.1]
  def change
    add_column :whatsapp_instances, :instance_uuid, :string
    add_column :whatsapp_instances, :instance_token, :string
    add_column :whatsapp_instances, :remote_status, :string
    add_column :whatsapp_instances, :remote_data, :jsonb, default: {}, null: false
    add_column :whatsapp_instances, :last_remote_sync_at, :datetime

    add_index :whatsapp_instances, :instance_uuid

    create_table :whatsapp_remote_instances do |t|
      t.string :instance_uuid
      t.string :instance_name, null: false
      t.string :status
      t.string :connected_number
      t.string :profile_name
      t.jsonb :remote_data, default: {}, null: false
      t.datetime :last_remote_sync_at

      t.timestamps null: false
    end

    add_index :whatsapp_remote_instances, :instance_uuid, unique: true, where: "instance_uuid IS NOT NULL"
    add_index :whatsapp_remote_instances, :instance_name, unique: true
    add_index :whatsapp_remote_instances, :status
  end
end
