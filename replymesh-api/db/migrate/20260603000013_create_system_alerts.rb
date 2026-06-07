class CreateSystemAlerts < ActiveRecord::Migration[8.1]
  def change
    create_table :system_alerts do |t|
      t.references :company, foreign_key: { on_delete: :cascade }
      t.text :level, null: false, default: "warning"
      t.text :title, null: false
      t.text :message, null: false
      t.datetime :resolved_at

      t.timestamps null: false
    end

    add_index :system_alerts, :level
  end
end
