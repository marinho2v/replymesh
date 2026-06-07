class CreateBusinessHourExceptions < ActiveRecord::Migration[8.1]
  def change
    create_table :business_hour_exceptions do |t|
      t.references :company,      null: false, foreign_key: { on_delete: :cascade }
      t.date    :exception_date,  null: false
      t.boolean :is_open,         null: false, default: false
      t.string  :open_time
      t.string  :close_time
      t.string  :break_start
      t.string  :break_end
      t.text    :message
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    add_index :business_hour_exceptions, %i[company_id exception_date], unique: true
    add_index :business_hour_exceptions, :legacy_id
  end
end
