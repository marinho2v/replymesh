class CreateMasterImpersonationSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :master_impersonation_sessions do |t|
      t.references :master_user, null: false, foreign_key: { to_table: :users, on_delete: :cascade }
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.string :token_hash, null: false
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.string :ip_address
      t.text :user_agent
      t.text :reason
      t.string :status, null: false, default: "active"

      t.timestamps
    end

    add_index :master_impersonation_sessions, :token_hash, unique: true
    add_index :master_impersonation_sessions, %i[company_id status]
    add_index :master_impersonation_sessions, %i[master_user_id status]
    add_index :master_impersonation_sessions, :expires_at
  end
end
