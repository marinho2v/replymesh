class CreateActivityLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :activity_logs do |t|
      t.references :company, foreign_key: { on_delete: :cascade }
      t.references :user, foreign_key: { on_delete: :nullify }
      t.text :action, null: false
      t.text :resource_type
      t.bigint :resource_id
      t.jsonb :metadata_json, default: {}

      t.timestamps null: false
    end

    add_index :activity_logs, :action
    add_index :activity_logs, %i[resource_type resource_id]
  end
end
