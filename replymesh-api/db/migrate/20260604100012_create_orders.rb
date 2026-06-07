class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :company,       null: false, foreign_key: { on_delete: :cascade }
      t.bigint  :order_number,     null: false  # sequencial por empresa (via store_order_counter)

      # Cliente
      t.references :customer,      foreign_key: { on_delete: :nullify }
      t.text    :customer_name
      t.text    :customer_phone
      t.text    :customer_whatsapp

      # Tipo e status
      # order_type: delivery | pickup | dine_in
      t.text    :order_type,        null: false, default: "delivery"
      # status: pending|accepted|preparing|ready|out_for_delivery|completed|cancelled
      t.text    :status,            null: false, default: "pending"
      # payment_method: money | pix | card_on_delivery
      t.text    :payment_method,    null: false, default: "money"
      # payment_status: pending | paid | refunded | cancelled
      t.text    :payment_status,    null: false, default: "pending"

      # Valores (centavos)
      t.integer :subtotal_cents,    null: false, default: 0
      t.integer :delivery_fee_cents, null: false, default: 0
      t.integer :discount_cents,    null: false, default: 0
      t.integer :total_cents,       null: false, default: 0
      t.integer :change_for_cents
      t.boolean :needs_change,      null: false, default: false

      # Entrega
      t.references :delivery_zone,  foreign_key: { on_delete: :nullify }
      t.references :motoboy,        foreign_key: { on_delete: :nullify }
      # delivery_status: pending|assigned|on_the_way|delivered|cancelled
      t.text    :delivery_status,   null: false, default: "pending"

      # Endereço de entrega (desnormalizado para histórico)
      t.text    :zip_code
      t.text    :street
      t.text    :number
      t.text    :complement
      t.text    :neighborhood
      t.text    :city
      t.text    :state
      t.text    :reference

      # Mesa (dine_in)
      t.references :dining_table,   foreign_key: { on_delete: :nullify }

      # Cupom
      t.references :coupon,         foreign_key: { on_delete: :nullify }
      t.text    :coupon_code

      # Controle de inventário
      t.boolean :inventory_deducted,    null: false, default: false
      t.datetime :inventory_deducted_at
      t.boolean :inventory_restored,    null: false, default: false
      t.datetime :inventory_restored_at

      # Controle financeiro
      t.datetime :financial_recorded_at
      t.datetime :paid_at

      # Timestamps de status
      t.datetime :accepted_at
      t.datetime :preparing_at
      t.datetime :ready_at
      t.datetime :out_for_delivery_at
      t.datetime :completed_at
      t.datetime :cancelled_at

      # Atendente que criou
      t.references :attendant, foreign_key: { to_table: :users, on_delete: :nullify }

      t.text    :notes
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :orders, %i[company_id order_number], unique: true
    add_index :orders, %i[company_id status]
    add_index :orders, %i[company_id created_at]
    add_index :orders, %i[company_id customer_id]
    add_index :orders, %i[company_id motoboy_id]
    add_index :orders, %i[company_id delivery_status]
    add_index :orders, %i[company_id payment_status]
    add_index :orders, :legacy_id
  end
end
