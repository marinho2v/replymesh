class ExtendSystemAlertsForAudit < ActiveRecord::Migration[8.1]
  def change
    change_table :system_alerts, bulk: true do |t|
      t.references :resolved_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.jsonb :metadata_json, null: false, default: {}
    end

    add_index :system_alerts, :resolved_at
  end
end
