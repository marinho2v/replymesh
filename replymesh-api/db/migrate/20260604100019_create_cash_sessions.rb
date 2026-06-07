class CreateCashSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :cash_sessions do |t|
      t.references :company,      null: false, foreign_key: { on_delete: :cascade }
      t.references :opened_by,    null: false, foreign_key: { to_table: :users, on_delete: :restrict }
      t.references :closed_by,    foreign_key: { to_table: :users, on_delete: :nullify }
      t.integer :opening_amount_cents,          null: false, default: 0
      t.integer :closing_expected_cents,        default: 0
      t.integer :closing_counted_cents
      t.integer :difference_cents
      # status: open | closed
      t.text    :status,                        null: false, default: "open"
      t.datetime :opened_at,                    null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.datetime :closed_at
      t.text    :notes
      t.text    :closing_notes
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    # CONSTRAINT CRÍTICA: apenas 1 caixa aberto por empresa
    add_index :cash_sessions, :company_id,
              unique: true,
              where: "status = 'open'",
              name: "unique_open_cash_session_per_company"

    add_index :cash_sessions, %i[company_id opened_at]
    add_index :cash_sessions, :legacy_id
  end
end
