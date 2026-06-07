class CreateWheelPrizesAndSpins < ActiveRecord::Migration[8.1]
  def change
    create_table :wheel_prizes do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.text :name, null: false
      t.text :description
      t.text :prize_type, null: false, default: "percentage"
      t.decimal :discount_value, null: false, default: 0, precision: 10, scale: 2
      t.integer :probability_weight, null: false, default: 1
      t.integer :coupon_valid_days, null: false, default: 7
      t.integer :minimum_order_cents, null: false, default: 0
      t.integer :max_total_wins
      t.integer :current_wins, null: false, default: 0
      t.text :badge
      t.text :color
      t.integer :sort_order, null: false, default: 0
      t.boolean :is_active, null: false, default: true

      t.timestamps null: false
    end

    add_index :wheel_prizes, %i[company_id is_active sort_order]

    create_table :wheel_spins do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.references :customer, null: false, foreign_key: { on_delete: :cascade }
      t.references :order, foreign_key: { on_delete: :nullify }
      t.references :wheel_prize, foreign_key: { on_delete: :nullify }
      t.references :coupon, foreign_key: { on_delete: :nullify }
      t.integer :order_spin_number
      t.text :status, null: false, default: "available"
      t.text :source, null: false, default: "order_completed"
      t.datetime :expires_at
      t.datetime :used_at
      t.jsonb :metadata_json, null: false, default: {}

      t.timestamps null: false
    end

    add_index :wheel_spins, %i[company_id customer_id status created_at]
    add_index :wheel_spins, %i[order_id order_spin_number], unique: true, where: "order_id IS NOT NULL AND order_spin_number IS NOT NULL"
  end
end
