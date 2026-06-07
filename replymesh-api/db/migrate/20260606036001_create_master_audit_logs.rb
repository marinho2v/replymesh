class CreateMasterAuditLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :master_audit_logs do |t|
      t.references :actor, foreign_key: { to_table: :users, on_delete: :nullify }
      t.string :actor_name
      t.string :actor_email
      t.string :action, null: false
      t.string :module_name, null: false, default: "system"
      t.string :resource_type
      t.bigint :resource_id
      t.references :company, foreign_key: { on_delete: :nullify }
      t.string :company_name
      t.string :ip_address
      t.text :user_agent
      t.jsonb :metadata, null: false, default: {}
      t.string :status, null: false, default: "success"

      t.timestamps
    end

    add_index :master_audit_logs, :action
    add_index :master_audit_logs, :module_name
    add_index :master_audit_logs, :status
    add_index :master_audit_logs, :created_at
    add_index :master_audit_logs, %i[resource_type resource_id]
  end
end
