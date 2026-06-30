# frozen_string_literal: true

class AddPerformanceScalingIndexes < ActiveRecord::Migration[8.0]
  disable_ddl_transaction!

  def change
    add_index :orders, [:company_id, :status, :created_at],
              name: "idx_orders_company_status_created",
              algorithm: :concurrently,
              if_not_exists: true

    add_index :orders, [:company_id, :payment_method, :created_at],
              name: "idx_orders_company_payment_method_created",
              algorithm: :concurrently,
              if_not_exists: true

    add_index :orders, [:company_id, :payment_status, :created_at],
              name: "idx_orders_company_payment_status_created",
              algorithm: :concurrently,
              if_not_exists: true

    add_index :orders, [:company_id, :delivery_zone_id, :created_at],
              name: "idx_orders_company_delivery_zone_created",
              algorithm: :concurrently,
              if_not_exists: true

    add_index :products, [:company_id, :is_active, :category_id, :sort_order],
              name: "idx_products_public_menu_lookup",
              algorithm: :concurrently,
              if_not_exists: true

    add_index :delivery_zones, [:company_id, :is_active, :match_priority],
              name: "idx_delivery_zones_public_lookup",
              algorithm: :concurrently,
              if_not_exists: true

    add_index :customers, [:company_id, :created_at],
              name: "idx_customers_company_created",
              algorithm: :concurrently,
              if_not_exists: true

    add_index :subscriptions, [:company_id, :status, :created_at],
              name: "idx_subscriptions_company_status_created",
              algorithm: :concurrently,
              if_not_exists: true

    add_index :whatsapp_instances, [:company_id, :status, :updated_at],
              name: "idx_whatsapp_instances_company_status_updated",
              algorithm: :concurrently,
              if_not_exists: true
  end
end
