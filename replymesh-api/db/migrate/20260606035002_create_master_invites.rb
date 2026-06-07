class CreateMasterInvites < ActiveRecord::Migration[8.0]
  def change
    create_table :master_invites do |t|
      t.string :name
      t.string :email, null: false
      t.references :master_role, null: false, foreign_key: true
      t.references :invited_by, null: true, foreign_key: { to_table: :users }
      t.string :token, null: false
      t.string :status, null: false, default: "pending"
      t.datetime :expires_at, null: false
      t.datetime :last_sent_at
      t.integer :resend_count, null: false, default: 0

      t.timestamps
    end

    add_index :master_invites, :token, unique: true
    add_index :master_invites, :email
    add_index :master_invites, :status
    add_index :master_invites, :expires_at
  end
end
