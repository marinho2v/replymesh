class CreateSubscriptions < ActiveRecord::Migration[8.1]
  def change
    create_table :subscriptions do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.references :plan,    null: false, foreign_key: true
      t.text       :status,               null: false, default: "trial"
      t.integer    :price_cents,          null: false, default: 0
      t.datetime   :started_at,           null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.datetime   :trial_ends_at
      t.datetime   :current_period_start
      t.datetime   :current_period_end
      t.datetime   :canceled_at

      t.timestamps null: false
    end

    add_index :subscriptions, :status
  end
end
