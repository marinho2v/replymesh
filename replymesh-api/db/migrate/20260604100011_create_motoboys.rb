class CreateMotoboys < ActiveRecord::Migration[8.1]
  def change
    create_table :motoboys do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      # user_id opcional — motoboy pode ser criado sem login ainda
      t.references :user, foreign_key: { on_delete: :nullify }
      t.text    :name,              null: false
      t.text    :phone
      t.text    :fcm_token
      t.boolean :active,            null: false, default: true
      t.boolean :is_available,      null: false, default: true
      t.integer :total_deliveries,  null: false, default: 0
      t.text    :notes
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :motoboys, %i[company_id active]
    add_index :motoboys, %i[company_id user_id]
    add_index :motoboys, :legacy_id
  end
end
