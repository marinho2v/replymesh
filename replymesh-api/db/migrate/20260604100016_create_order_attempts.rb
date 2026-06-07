class CreateOrderAttempts < ActiveRecord::Migration[8.1]
  def change
    create_table :order_attempts do |t|
      t.references :company,        null: false, foreign_key: { on_delete: :cascade }
      t.text    :customer_phone
      t.text    :ip_address
      t.text    :user_agent
      t.text    :order_signature   # hash para detectar duplicata
      # status: created | blocked | duplicate | rate_limited
      t.text    :status,           null: false, default: "created"
      t.text    :reason
      t.references :order, foreign_key: { on_delete: :nullify }
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :order_attempts, %i[company_id customer_phone created_at]
    add_index :order_attempts, %i[company_id ip_address created_at]
    add_index :order_attempts, :legacy_id
  end
end
