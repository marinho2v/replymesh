class CreateSmtpSettings < ActiveRecord::Migration[7.1]
  def change
    create_table :smtp_settings do |t|
      t.boolean :enabled, null: false, default: false
      t.string :host, null: false, default: "smtp.hostinger.com"
      t.integer :port, null: false, default: 465
      t.string :authentication, null: false, default: "login"
      t.boolean :ssl, null: false, default: true
      t.boolean :enable_starttls_auto, null: false, default: false
      t.string :username
      t.text :password_encrypted
      t.string :from_email
      t.string :from_name, null: false, default: "Replymesh"
      t.string :reply_to
      t.string :test_recipient
      t.datetime :last_tested_at
      t.string :last_test_status
      t.text :last_test_message

      t.timestamps
    end
  end
end
