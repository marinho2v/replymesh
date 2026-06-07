class AddPixCopyPasteToOrders < ActiveRecord::Migration[7.1]
  def change
    add_column :orders, :pix_copy_paste, :text unless column_exists?(:orders, :pix_copy_paste)
  end
end
