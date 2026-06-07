class AddPaymentStatusToOrders < ActiveRecord::Migration[7.1]
  def change
    # payment_status ja existe — apenas adicionamos as colunas de MP Pix
    add_column :orders, :external_payment_id,   :string   unless column_exists?(:orders, :external_payment_id)
    add_column :orders, :payment_confirmed_at,  :datetime unless column_exists?(:orders, :payment_confirmed_at)
    add_column :orders, :pix_qr_code,          :text     unless column_exists?(:orders, :pix_qr_code)
    add_column :orders, :pix_qr_code_base64,   :text     unless column_exists?(:orders, :pix_qr_code_base64)
    add_column :orders, :pix_ticket_url,       :string   unless column_exists?(:orders, :pix_ticket_url)

    add_index :orders, :external_payment_id, unique: true, where: "external_payment_id IS NOT NULL",
              name: :idx_orders_external_payment_id unless index_exists?(:orders, :external_payment_id)
  end
end
