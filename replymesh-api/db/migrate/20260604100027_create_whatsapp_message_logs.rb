class CreateWhatsappMessageLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :whatsapp_message_logs do |t|
      t.references :company,  null: false, foreign_key: { on_delete: :cascade }
      t.references :order,    foreign_key: { on_delete: :nullify }
      # provider: evolution_go | wasender | zapi | manual
      t.text    :provider,         null: false, default: "evolution_go"
      t.text    :phone,            null: false
      t.text    :order_status_ref               # status do pedido que gerou o envio
      t.text    :template_key
      t.text    :message
      # send_status: sent | error | skipped
      t.text    :send_status,      null: false, default: "sent"
      t.jsonb   :response_data,    default: {}
      t.text    :error_message
      t.references :sent_by, foreign_key: { to_table: :users, on_delete: :nullify }
      t.string  :legacy_id
      t.string  :legacy_source
      t.string  :legacy_table

      t.timestamps null: false
    end

    # Evitar envio duplicado do mesmo template para o mesmo pedido no mesmo status
    add_index :whatsapp_message_logs,
              %i[company_id order_id template_key order_status_ref],
              where: "send_status = 'sent' AND order_id IS NOT NULL",
              name: "no_duplicate_wa_message_per_order_status"
    add_index :whatsapp_message_logs, %i[company_id send_status]
    add_index :whatsapp_message_logs, :legacy_id
  end
end
