class CreateCompanyMembers < ActiveRecord::Migration[8.1]
  def change
    create_table :company_members do |t|
      t.references :company, null: false, foreign_key: { on_delete: :cascade }
      t.references :user,    null: false, foreign_key: { on_delete: :cascade }
      t.text       :role,    null: false, default: "employee"
      t.text       :status,  null: false, default: "active"

      t.timestamps null: false
    end

    add_index :company_members, %i[company_id user_id], unique: true
  end
end
