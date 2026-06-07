class CreateMarketingCampaigns < ActiveRecord::Migration[8.1]
  def change
    create_table :marketing_campaigns do |t|
      t.references :company,    null: false, foreign_key: { on_delete: :cascade }
      t.text    :title,         null: false
      # status: draft|active|paused|completed|cancelled
      t.text    :status,        null: false, default: "draft"
      t.integer :daily_limit,   null: false, default: 100
      t.integer :sent_count,    null: false, default: 0
      t.integer :failed_count,  null: false, default: 0
      t.datetime :started_at
      t.datetime :completed_at
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :marketing_campaigns, %i[company_id status]
    add_index :marketing_campaigns, :legacy_id
  end
end
