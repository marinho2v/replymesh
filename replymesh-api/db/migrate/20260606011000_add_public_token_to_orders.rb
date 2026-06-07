require "securerandom"

class AddPublicTokenToOrders < ActiveRecord::Migration[8.1]
  class MigrationOrder < ActiveRecord::Base
    self.table_name = "orders"
  end

  def up
    add_column :orders, :public_token, :string

    MigrationOrder.reset_column_information
    MigrationOrder.where(public_token: [nil, ""]).find_each do |order|
      order.update_columns(public_token: generate_unique_token)
    end

    change_column_null :orders, :public_token, false
    add_index :orders, :public_token, unique: true
    add_index :orders, [:company_id, :public_token], unique: true
  end

  def down
    remove_index :orders, [:company_id, :public_token] if index_exists?(:orders, [:company_id, :public_token])
    remove_index :orders, :public_token if index_exists?(:orders, :public_token)
    remove_column :orders, :public_token
  end

  private

  def generate_unique_token
    loop do
      token = SecureRandom.urlsafe_base64(18)
      return token unless MigrationOrder.exists?(public_token: token)
    end
  end
end
