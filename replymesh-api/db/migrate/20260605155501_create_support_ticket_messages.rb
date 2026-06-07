class CreateSupportTicketMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :support_ticket_messages do |t|
      t.references :support_ticket, null: false, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.text :message, null: false
      t.boolean :internal, null: false, default: false

      t.timestamps
    end

    add_index :support_ticket_messages, [:support_ticket_id, :created_at]
  end
end
