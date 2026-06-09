class CreateFeatureGates < ActiveRecord::Migration[8.1]
  def change
    create_table :plan_features do |t|
      t.references :plan, null: false, foreign_key: true
      t.string :feature_key, null: false
      t.boolean :enabled, null: false, default: true
      t.text :notes
      t.timestamps
    end

    add_index :plan_features, [:plan_id, :feature_key], unique: true
    add_index :plan_features, :feature_key

    create_table :company_feature_overrides do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.string :feature_key, null: false
      t.string :mode, null: false, default: "allow"
      t.text :internal_note
      t.references :created_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.timestamps
    end

    add_index :company_feature_overrides, [:company_id, :feature_key], unique: true, name: "idx_company_feature_overrides_unique"
    add_index :company_feature_overrides, :feature_key
    add_index :company_feature_overrides, :mode
  end
end
