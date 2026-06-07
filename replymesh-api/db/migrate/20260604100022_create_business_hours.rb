class CreateBusinessHours < ActiveRecord::Migration[8.1]
  def change
    create_table :business_hours do |t|
      t.references :company,       null: false, foreign_key: { on_delete: :cascade }
      # day_of_week: 0=domingo, 1=segunda, ..., 6=sábado
      t.integer :day_of_week,      null: false
      t.boolean :is_open,          null: false, default: true
      t.string  :open_time                       # "08:00"
      t.string  :close_time                      # "22:00"
      t.string  :break_start                     # "13:00"
      t.string  :break_end                       # "14:00"
      t.text    :closed_message
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    # CONSTRAINT CRÍTICA: 1 registro por dia por empresa
    add_index :business_hours, %i[company_id day_of_week], unique: true
    add_index :business_hours, :legacy_id
  end
end
