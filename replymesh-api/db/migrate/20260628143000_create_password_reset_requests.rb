class CreatePasswordResetRequests < ActiveRecord::Migration[7.1]
  def change
    create_table :password_reset_requests do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.string :email, null: false
      t.string :code_digest, null: false
      t.string :status, null: false, default: "pending"
      t.integer :attempts_count, null: false, default: 0
      t.datetime :expires_at, null: false
      t.datetime :used_at
      t.datetime :last_sent_at
      t.string :ip_address
      t.text :user_agent

      t.timestamps
    end

    add_index :password_reset_requests, :email
    add_index :password_reset_requests, :status
    add_index :password_reset_requests, [:company_id, :email, :created_at], name: "idx_password_resets_company_email_created"
  end
end
