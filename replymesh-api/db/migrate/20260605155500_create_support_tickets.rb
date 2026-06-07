class CreateSupportTickets < ActiveRecord::Migration[8.1]
  def change
    create_table :support_tickets do |t|
      t.references :company, null: false, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.string :subject, null: false
      t.text :message, null: false
      t.string :priority, null: false, default: "normal"
      t.string :status, null: false, default: "open"
      t.datetime :resolved_at
      t.datetime :closed_at

      t.timestamps
    end

    add_index :support_tickets, [:company_id, :status]
    add_index :support_tickets, [:priority, :status]
    add_index :support_tickets, :created_at
  end
end
