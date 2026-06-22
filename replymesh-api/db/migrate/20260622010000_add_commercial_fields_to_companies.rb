class AddCommercialFieldsToCompanies < ActiveRecord::Migration[8.1]
  def change
    add_column :companies, :monthly_price_cents, :integer
    add_column :companies, :free_period_days, :integer, default: 0, null: false
    add_column :companies, :internal_note, :text
    add_column :companies, :contract_type, :string, default: "monthly", null: false
  end
end
