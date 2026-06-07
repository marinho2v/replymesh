class CreateOrderStatusLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :order_status_logs do |t|
      t.references :company,    null: false, foreign_key: { on_delete: :cascade }
      t.references :order,      null: false, foreign_key: { on_delete: :cascade }
      t.text    :previous_status
      t.text    :new_status,    null: false
      t.references :changed_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :order_status_logs, %i[company_id order_id]
    add_index :order_status_logs, :legacy_id
  end
end
