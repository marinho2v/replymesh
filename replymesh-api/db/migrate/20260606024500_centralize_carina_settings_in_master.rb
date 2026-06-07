class CentralizeCarinaSettingsInMaster < ActiveRecord::Migration[7.1]
  def change
    add_column :ai_global_settings, :assistant_tone, :string, null: false, default: "simpatico, objetivo e didatico"
    add_column :ai_assistant_logs, :provider, :string
    add_column :ai_assistant_logs, :model, :string

    drop_table :ai_company_settings, if_exists: true do |t|
      t.references :company, null: false, foreign_key: true, index: { unique: true }
      t.boolean :enabled, null: false, default: false
      t.string :assistant_name
      t.string :assistant_avatar_url
      t.text :initial_message
      t.boolean :show_floating_button, null: false, default: true
      t.timestamps
    end
  end
end
