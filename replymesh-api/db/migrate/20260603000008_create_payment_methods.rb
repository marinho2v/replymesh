class CreatePaymentMethods < ActiveRecord::Migration[8.1]
  def change
    create_table :payment_methods do |t|
      t.references :company,  null: false, foreign_key: { on_delete: :cascade }
      t.text    :name,        null: false
      t.text    :method_type, null: false
      t.boolean :enabled,         null: false, default: true
      t.boolean :requires_change, null: false, default: false
      t.text    :pix_key
      t.text    :instructions

      t.timestamps null: false
    end
  end
end
