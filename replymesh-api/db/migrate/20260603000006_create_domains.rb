class CreateDomains < ActiveRecord::Migration[8.1]
  def change
    create_table :domains do |t|
      t.references :company,    null: false, foreign_key: { on_delete: :cascade }
      t.text       :domain,     null: false
      t.text       :domain_type, null: false, default: "subdomain"
      t.text       :status,     null: false, default: "pending"
      t.text       :ssl_status, null: false, default: "pending"
      t.boolean    :is_primary, null: false, default: true
      t.datetime   :last_checked_at

      t.timestamps null: false
    end

    add_index :domains, :domain, unique: true
    add_index :domains, :status
  end
end
