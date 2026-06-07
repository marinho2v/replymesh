class AddMasterFieldsToUsers < ActiveRecord::Migration[8.0]
  def change
    add_reference :users, :master_role, foreign_key: true, null: true
    add_column :users, :avatar_url, :string

    add_index :users, [:master_role_id, :status]
  end
end
