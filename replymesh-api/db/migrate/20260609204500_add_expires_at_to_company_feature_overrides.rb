class AddExpiresAtToCompanyFeatureOverrides < ActiveRecord::Migration[8.1]
  def change
    add_column :company_feature_overrides, :expires_at, :datetime
    add_index :company_feature_overrides, :expires_at
  end
end
