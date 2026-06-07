class CreateOrderPaymentDetails < ActiveRecord::Migration[8.1]
  def change
    create_table :order_payment_details do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      # UNIQUE por order — 1 registro de pagamento por pedido
      t.references :order,   null: false, foreign_key: { on_delete: :cascade }, index: { unique: true }
      # payment_method: money | pix | card_on_delivery | cash | card
      t.text    :payment_method,      null: false
      t.integer :amount_cents,        null: false, default: 0
      t.boolean :needs_change,        null: false, default: false
      t.integer :change_for_cents
      t.integer :change_amount_cents
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :order_payment_details, %i[company_id], name: "idx_order_payment_details_company"
    add_index :order_payment_details, :legacy_id
  end
end
