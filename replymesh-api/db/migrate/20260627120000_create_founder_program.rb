class CreateFounderProgram < ActiveRecord::Migration[8.0]
  def change
    add_column :companies, :origin, :string
    add_column :companies, :commercial_status, :string
    add_column :companies, :founder_registered_at, :datetime
    add_index :companies, :origin
    add_index :companies, :commercial_status

    create_table :founder_program_settings do |t|
      t.boolean :enabled, null: false, default: false
      t.boolean :allow_signups, null: false, default: false
      t.integer :signup_limit, null: false, default: 100
      t.datetime :started_at
      t.datetime :ends_at
      t.jsonb :default_modules, null: false, default: []
      t.timestamps
    end

    create_table :founder_signup_attempts do |t|
      t.string :responsible_name, null: false
      t.string :email, null: false
      t.string :phone, null: false
      t.string :password_digest, null: false
      t.string :company_name, null: false
      t.string :business_type, null: false
      t.string :city, null: false
      t.string :state, null: false
      t.string :slug, null: false
      t.string :code_digest, null: false
      t.datetime :expires_at, null: false
      t.integer :attempts_count, null: false, default: 0
      t.datetime :last_sent_at, null: false
      t.datetime :confirmed_at
      t.string :status, null: false, default: "pending"
      t.string :ip_address
      t.string :user_agent
      t.timestamps
    end

    add_index :founder_signup_attempts, :email
    add_index :founder_signup_attempts, :phone
    add_index :founder_signup_attempts, :slug
    add_index :founder_signup_attempts, [:ip_address, :created_at]
  end
end
