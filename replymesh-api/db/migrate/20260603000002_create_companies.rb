class CreateCompanies < ActiveRecord::Migration[8.1]
  def change
    create_table :companies do |t|
      t.text     :name,              null: false
      t.text     :slug,              null: false
      t.text     :legal_name
      t.text     :document_number
      t.text     :responsible_name,  null: false
      t.text     :responsible_phone
      t.text     :responsible_email, null: false
      t.text     :status,            null: false, default: "trial"
      t.text     :plan_status,       null: false, default: "trial"
      t.datetime :trial_ends_at
      t.text     :timezone,          null: false, default: "America/Sao_Paulo"
      t.text     :default_locale,    null: false, default: "pt-BR"

      t.timestamps null: false
    end

    add_index :companies, :slug,   unique: true
    add_index :companies, :status
  end
end
