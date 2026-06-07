class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.text    :name,            null: false
      t.text    :email,           null: false
      t.text    :password_digest, null: false
      t.text    :phone
      t.text    :global_role,     null: false, default: "user"
      t.text    :status,          null: false, default: "active"
      t.datetime :last_sign_in_at

      t.timestamps null: false
    end

    add_index :users, :email,  unique: true
    add_index :users, :status
  end
end
