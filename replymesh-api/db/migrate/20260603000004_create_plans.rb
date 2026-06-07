class CreatePlans < ActiveRecord::Migration[8.1]
  def change
    create_table :plans do |t|
      t.text    :name,          null: false
      t.text    :slug,          null: false
      t.integer :price_cents,   null: false, default: 0
      t.text    :billing_cycle, null: false, default: "monthly"
      t.text    :description
      t.jsonb   :features_json, null: false, default: []
      t.text    :status,        null: false, default: "active"

      t.timestamps null: false
    end

    add_index :plans, :slug, unique: true
  end
end
