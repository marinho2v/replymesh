class CreateMarketingCampaignRecipients < ActiveRecord::Migration[8.1]
  def change
    create_table :marketing_campaign_recipients do |t|
      t.references :company,            null: false, foreign_key: { on_delete: :cascade }
      t.references :marketing_campaign, null: false, foreign_key: { on_delete: :cascade }
      t.text    :phone,                 null: false
      t.text    :personalized_message
      # status: pending|sent|failed|opted_out
      t.text    :status,                null: false, default: "pending"
      t.text    :error_message
      t.datetime :sent_at
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :marketing_campaign_recipients, %i[company_id marketing_campaign_id]
    add_index :marketing_campaign_recipients, %i[company_id status]
    add_index :marketing_campaign_recipients, :legacy_id
  end
end
