class AddDeletedAtToCategories < ActiveRecord::Migration[8.1]
  def change
    add_column :categories, :deleted_at, :datetime unless column_exists?(:categories, :deleted_at)
    add_index :categories, [:company_id, :deleted_at] unless index_exists?(:categories, [:company_id, :deleted_at])
  end
end
