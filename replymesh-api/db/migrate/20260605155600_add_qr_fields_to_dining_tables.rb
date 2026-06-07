class AddQrFieldsToDiningTables < ActiveRecord::Migration[7.1]
  def change
    add_column :dining_tables, :qr_token, :string
    add_column :dining_tables, :qr_enabled, :boolean, null: false, default: true
    add_column :dining_tables, :qr_generated_at, :datetime
    add_column :dining_tables, :qr_updated_at, :datetime

    add_index :dining_tables, :qr_token
    add_index :dining_tables, %i[company_id qr_token], unique: true
  end
end
