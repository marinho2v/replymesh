class CreateDeliveryHistory < ActiveRecord::Migration[8.1]
  def change
    create_table :delivery_history do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      # UNIQUE por order — 1 motoboy ativo por pedido
      t.references :order,   null: false, foreign_key: { on_delete: :cascade }, index: { unique: true }
      t.references :motoboy, null: false, foreign_key: { on_delete: :restrict }
      # status: assigned | on_the_way | delivered | cancelled
      t.text    :status,        null: false, default: "assigned"
      t.datetime :assigned_at,  null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.datetime :delivered_at
      t.text    :notes
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :delivery_history, %i[company_id motoboy_id]
    add_index :delivery_history, %i[company_id assigned_at]
    add_index :delivery_history, :legacy_id
  end
end
