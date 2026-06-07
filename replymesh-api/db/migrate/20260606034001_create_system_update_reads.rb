class CreateSystemUpdateReads < ActiveRecord::Migration[7.1]
  def change
    create_table :system_update_reads do |t|
      t.references :system_update, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.datetime :read_at, null: false
      t.timestamps
    end

    add_index :system_update_reads,
              %i[system_update_id company_id user_id],
              unique: true,
              name: "index_system_update_reads_unique"
  end
end
