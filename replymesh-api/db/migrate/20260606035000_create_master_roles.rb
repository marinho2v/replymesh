class CreateMasterRoles < ActiveRecord::Migration[8.0]
  def change
    create_table :master_roles do |t|
      t.string :name, null: false
      t.string :key, null: false
      t.text :description
      t.jsonb :permissions, null: false, default: {}
      t.string :status, null: false, default: "active"

      t.timestamps
    end

    add_index :master_roles, :key, unique: true
    add_index :master_roles, :status
  end
end
