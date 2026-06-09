# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_09_120000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "activity_logs", force: :cascade do |t|
    t.text "action", null: false
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.jsonb "metadata_json", default: {}
    t.bigint "resource_id"
    t.text "resource_type"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["action"], name: "index_activity_logs_on_action"
    t.index ["company_id"], name: "index_activity_logs_on_company_id"
    t.index ["resource_type", "resource_id"], name: "index_activity_logs_on_resource_type_and_resource_id"
    t.index ["user_id"], name: "index_activity_logs_on_user_id"
  end

  create_table "ai_assistant_logs", force: :cascade do |t|
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.text "error_message"
    t.integer "estimated_tokens", default: 0, null: false
    t.string "model"
    t.string "page"
    t.string "provider"
    t.text "question"
    t.text "response_summary"
    t.integer "response_time_ms", default: 0, null: false
    t.string "status", default: "success", null: false
    t.integer "tokens_used", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["company_id", "created_at"], name: "index_ai_assistant_logs_on_company_id_and_created_at"
    t.index ["company_id", "user_id", "created_at"], name: "index_ai_logs_on_company_user_created_at"
    t.index ["company_id"], name: "index_ai_assistant_logs_on_company_id"
    t.index ["status"], name: "index_ai_assistant_logs_on_status"
    t.index ["user_id", "created_at"], name: "index_ai_assistant_logs_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_ai_assistant_logs_on_user_id"
  end

  create_table "ai_global_settings", force: :cascade do |t|
    t.text "api_key_encrypted"
    t.string "assistant_avatar_url"
    t.string "assistant_name", default: "Carina", null: false
    t.string "assistant_tone", default: "simpatico, objetivo e didatico", null: false
    t.text "base_prompt"
    t.datetime "created_at", null: false
    t.integer "daily_company_limit", default: 100, null: false
    t.boolean "enabled", default: false, null: false
    t.text "initial_message", default: "Oi! Eu sou a Carina, assistente da Replymesh. Posso ajudar voce a usar o sistema.", null: false
    t.string "model", default: "claude-haiku-4-5-20251001", null: false
    t.integer "per_minute_user_limit", default: 8, null: false
    t.string "provider", default: "claude", null: false
    t.datetime "updated_at", null: false
  end

  create_table "ai_usage_logs", force: :cascade do |t|
    t.string "assistant_type", null: false
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.decimal "estimated_cost_usd", precision: 12, scale: 6, default: "0.0", null: false
    t.integer "input_tokens", default: 0, null: false
    t.string "model"
    t.integer "output_tokens", default: 0, null: false
    t.string "provider", default: "claude", null: false
    t.integer "response_time_ms", default: 0, null: false
    t.string "status", default: "success", null: false
    t.integer "total_tokens", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["company_id", "assistant_type", "created_at"], name: "index_ai_usage_company_type_created"
    t.index ["company_id"], name: "index_ai_usage_logs_on_company_id"
    t.index ["user_id"], name: "index_ai_usage_logs_on_user_id"
  end

  create_table "android_app_requests", force: :cascade do |t|
    t.string "app_name", null: false
    t.datetime "approved_at"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "display_name", null: false
    t.text "icon_url"
    t.text "logo_url"
    t.jsonb "metadata", default: {}, null: false
    t.text "notes"
    t.string "primary_color", default: "#f59e0b", null: false
    t.datetime "published_at"
    t.datetime "requested_at"
    t.bigint "responsible_id"
    t.string "secondary_color", default: "#111111", null: false
    t.text "splash_url"
    t.string "status", default: "requested", null: false
    t.string "support_whatsapp"
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_android_app_requests_on_company_id", unique: true
    t.index ["responsible_id"], name: "index_android_app_requests_on_responsible_id"
    t.index ["status"], name: "index_android_app_requests_on_status"
  end

  create_table "app_banners", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "image_url"
    t.boolean "is_active", default: true, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "link_url"
    t.integer "sort_order", default: 0, null: false
    t.text "title", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "is_active", "sort_order"], name: "index_app_banners_on_company_id_and_is_active_and_sort_order"
    t.index ["company_id"], name: "index_app_banners_on_company_id"
    t.index ["legacy_id"], name: "index_app_banners_on_legacy_id"
  end

  create_table "business_hour_exceptions", force: :cascade do |t|
    t.string "break_end"
    t.string "break_start"
    t.string "close_time"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.date "exception_date", null: false
    t.boolean "is_open", default: false, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "message"
    t.string "open_time"
    t.datetime "updated_at", null: false
    t.index ["company_id", "exception_date"], name: "idx_on_company_id_exception_date_591fb9b635", unique: true
    t.index ["company_id"], name: "index_business_hour_exceptions_on_company_id"
    t.index ["legacy_id"], name: "index_business_hour_exceptions_on_legacy_id"
  end

  create_table "business_hours", force: :cascade do |t|
    t.string "break_end"
    t.string "break_start"
    t.string "close_time"
    t.text "closed_message"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.integer "day_of_week", null: false
    t.boolean "is_open", default: true, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.string "open_time"
    t.datetime "updated_at", null: false
    t.index ["company_id", "day_of_week"], name: "index_business_hours_on_company_id_and_day_of_week", unique: true
    t.index ["company_id"], name: "index_business_hours_on_company_id"
    t.index ["legacy_id"], name: "index_business_hours_on_legacy_id"
  end

  create_table "cash_movements", force: :cascade do |t|
    t.boolean "affects_physical_cash", default: true, null: false
    t.integer "amount_cents", default: 0, null: false
    t.bigint "cash_session_id", null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "movement_type", null: false
    t.text "notes"
    t.bigint "order_id"
    t.datetime "updated_at", null: false
    t.index ["cash_session_id"], name: "index_cash_movements_on_cash_session_id"
    t.index ["company_id", "cash_session_id"], name: "index_cash_movements_on_company_id_and_cash_session_id"
    t.index ["company_id", "order_id", "movement_type"], name: "unique_order_cash_movement_type", unique: true, where: "((order_id IS NOT NULL) AND (movement_type = ANY (ARRAY['sale_cash'::text, 'sale_pix'::text, 'sale_card'::text, 'change_given'::text])))"
    t.index ["company_id"], name: "index_cash_movements_on_company_id"
    t.index ["created_by_id"], name: "index_cash_movements_on_created_by_id"
    t.index ["legacy_id"], name: "index_cash_movements_on_legacy_id"
    t.index ["order_id"], name: "index_cash_movements_on_order_id"
  end

  create_table "cash_sessions", force: :cascade do |t|
    t.datetime "closed_at"
    t.bigint "closed_by_id"
    t.integer "closing_counted_cents"
    t.integer "closing_expected_cents", default: 0
    t.text "closing_notes"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.integer "difference_cents"
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "notes"
    t.datetime "opened_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.bigint "opened_by_id", null: false
    t.integer "opening_amount_cents", default: 0, null: false
    t.text "status", default: "open", null: false
    t.datetime "updated_at", null: false
    t.index ["closed_by_id"], name: "index_cash_sessions_on_closed_by_id"
    t.index ["company_id", "opened_at"], name: "index_cash_sessions_on_company_id_and_opened_at"
    t.index ["company_id"], name: "index_cash_sessions_on_company_id"
    t.index ["company_id"], name: "unique_open_cash_session_per_company", unique: true, where: "(status = 'open'::text)"
    t.index ["legacy_id"], name: "index_cash_sessions_on_legacy_id"
    t.index ["opened_by_id"], name: "index_cash_sessions_on_opened_by_id"
  end

  create_table "categories", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "deleted_at"
    t.boolean "is_active", default: true, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "name", null: false
    t.text "slug", null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "deleted_at"], name: "index_categories_on_company_id_and_deleted_at"
    t.index ["company_id", "is_active"], name: "index_categories_on_company_id_and_is_active"
    t.index ["company_id", "slug"], name: "index_categories_on_company_id_and_slug", unique: true
    t.index ["company_id", "sort_order"], name: "index_categories_on_company_id_and_sort_order"
    t.index ["company_id"], name: "index_categories_on_company_id"
    t.index ["legacy_id"], name: "index_categories_on_legacy_id"
  end

  create_table "companies", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "custom_domain"
    t.string "custom_domain_status", default: "pending", null: false
    t.text "default_locale", default: "pt-BR", null: false
    t.datetime "dns_verified_at"
    t.text "document_number"
    t.string "domain_status", default: "pending", null: false
    t.text "legal_name"
    t.text "name", null: false
    t.text "plan_status", default: "trial", null: false
    t.string "primary_domain", null: false
    t.text "responsible_email", null: false
    t.text "responsible_name", null: false
    t.text "responsible_phone"
    t.text "slug", null: false
    t.string "ssl_status", default: "pending", null: false
    t.text "status", default: "trial", null: false
    t.bigint "store_order_counter", default: 0, null: false
    t.string "subdomain", null: false
    t.text "timezone", default: "America/Sao_Paulo", null: false
    t.datetime "trial_ends_at"
    t.datetime "updated_at", null: false
    t.index ["custom_domain"], name: "index_companies_on_custom_domain", unique: true, where: "(custom_domain IS NOT NULL)"
    t.index ["domain_status"], name: "index_companies_on_domain_status"
    t.index ["primary_domain"], name: "index_companies_on_primary_domain", unique: true
    t.index ["slug"], name: "index_companies_on_slug", unique: true
    t.index ["ssl_status"], name: "index_companies_on_ssl_status"
    t.index ["status"], name: "index_companies_on_status"
    t.index ["store_order_counter"], name: "index_companies_on_store_order_counter"
    t.index ["subdomain"], name: "index_companies_on_subdomain", unique: true
  end

  create_table "company_members", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "role", default: "employee", null: false
    t.text "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["company_id", "user_id"], name: "index_company_members_on_company_id_and_user_id", unique: true
    t.index ["company_id"], name: "index_company_members_on_company_id"
    t.index ["user_id"], name: "index_company_members_on_user_id"
  end

  create_table "coupons", force: :cascade do |t|
    t.text "code", null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "customer_id"
    t.text "description"
    t.text "discount_type", default: "percentage", null: false
    t.decimal "discount_value", precision: 10, scale: 2, default: "0.0", null: false
    t.datetime "expires_at"
    t.boolean "is_active", default: true, null: false
    t.boolean "is_single_use_per_customer", default: false, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.integer "max_uses"
    t.jsonb "metadata_json", default: {}, null: false
    t.integer "minimum_order_cents", default: 0, null: false
    t.text "source", default: "manual", null: false
    t.datetime "starts_at"
    t.text "title", null: false
    t.datetime "updated_at", null: false
    t.integer "used_count", default: 0, null: false
    t.index ["company_id", "code"], name: "index_coupons_on_company_id_and_code", unique: true
    t.index ["company_id", "customer_id"], name: "index_coupons_on_company_id_and_customer_id"
    t.index ["company_id", "is_active"], name: "index_coupons_on_company_id_and_is_active"
    t.index ["company_id", "source"], name: "index_coupons_on_company_id_and_source"
    t.index ["company_id"], name: "index_coupons_on_company_id"
    t.index ["customer_id"], name: "index_coupons_on_customer_id"
    t.index ["legacy_id"], name: "index_coupons_on_legacy_id"
  end

  create_table "customer_addresses", force: :cascade do |t|
    t.text "city"
    t.bigint "company_id", null: false
    t.text "complement"
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.boolean "is_default", default: false, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "neighborhood"
    t.text "number"
    t.text "reference"
    t.text "state"
    t.text "street"
    t.datetime "updated_at", null: false
    t.text "zip_code"
    t.index ["company_id", "customer_id"], name: "index_customer_addresses_on_company_id_and_customer_id"
    t.index ["company_id"], name: "index_customer_addresses_on_company_id"
    t.index ["customer_id"], name: "index_customer_addresses_on_customer_id"
    t.index ["legacy_id"], name: "index_customer_addresses_on_legacy_id"
  end

  create_table "customers", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "email"
    t.datetime "first_order_at"
    t.text "full_name", null: false
    t.boolean "is_recurring", default: false, null: false
    t.datetime "last_marketing_sent_at"
    t.datetime "last_order_at"
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "notes"
    t.text "phone", null: false
    t.integer "total_orders", default: 0, null: false
    t.integer "total_spent_cents", default: 0, null: false
    t.datetime "updated_at", null: false
    t.text "whatsapp"
    t.index ["company_id", "is_recurring"], name: "index_customers_on_company_id_and_is_recurring"
    t.index ["company_id", "phone"], name: "index_customers_on_company_id_and_phone", unique: true
    t.index ["company_id"], name: "index_customers_on_company_id"
    t.index ["legacy_id"], name: "index_customers_on_legacy_id"
  end

  create_table "delivery_history", force: :cascade do |t|
    t.datetime "assigned_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "delivered_at"
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.bigint "motoboy_id", null: false
    t.text "notes"
    t.bigint "order_id", null: false
    t.text "status", default: "assigned", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "assigned_at"], name: "index_delivery_history_on_company_id_and_assigned_at"
    t.index ["company_id", "motoboy_id"], name: "index_delivery_history_on_company_id_and_motoboy_id"
    t.index ["company_id"], name: "index_delivery_history_on_company_id"
    t.index ["legacy_id"], name: "index_delivery_history_on_legacy_id"
    t.index ["motoboy_id"], name: "index_delivery_history_on_motoboy_id"
    t.index ["order_id"], name: "index_delivery_history_on_order_id", unique: true
  end

  create_table "delivery_zones", force: :cascade do |t|
    t.text "aliases", default: [], array: true
    t.text "city"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.integer "delivery_fee_cents", default: 0, null: false
    t.integer "estimated_minutes", default: 40, null: false
    t.boolean "is_active", default: true, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.integer "match_priority", default: 0, null: false
    t.integer "minimum_order_cents", default: 0, null: false
    t.text "name", null: false
    t.text "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "is_active"], name: "index_delivery_zones_on_company_id_and_is_active"
    t.index ["company_id", "match_priority"], name: "index_delivery_zones_on_company_id_and_match_priority"
    t.index ["company_id", "slug"], name: "index_delivery_zones_on_company_id_and_slug", unique: true
    t.index ["company_id"], name: "index_delivery_zones_on_company_id"
    t.index ["legacy_id"], name: "index_delivery_zones_on_legacy_id"
  end

  create_table "dining_tables", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.boolean "is_active", default: true, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "name"
    t.text "notes"
    t.integer "number", null: false
    t.boolean "qr_enabled", default: true, null: false
    t.datetime "qr_generated_at"
    t.string "qr_token"
    t.datetime "qr_updated_at"
    t.integer "seats", default: 4, null: false
    t.text "slug", null: false
    t.integer "sort_order", default: 0, null: false
    t.text "status", default: "available", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "number"], name: "index_dining_tables_on_company_id_and_number"
    t.index ["company_id", "qr_token"], name: "index_dining_tables_on_company_id_and_qr_token", unique: true
    t.index ["company_id", "slug"], name: "index_dining_tables_on_company_id_and_slug", unique: true
    t.index ["company_id", "status"], name: "index_dining_tables_on_company_id_and_status"
    t.index ["company_id"], name: "index_dining_tables_on_company_id"
    t.index ["legacy_id"], name: "index_dining_tables_on_legacy_id"
    t.index ["qr_token"], name: "index_dining_tables_on_qr_token"
  end

  create_table "domains", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "domain", null: false
    t.text "domain_type", default: "subdomain", null: false
    t.boolean "is_primary", default: true, null: false
    t.datetime "last_checked_at"
    t.text "ssl_status", default: "pending", null: false
    t.text "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_domains_on_company_id"
    t.index ["domain"], name: "index_domains_on_domain", unique: true
    t.index ["status"], name: "index_domains_on_status"
  end

  create_table "inventory_items", force: :cascade do |t|
    t.text "category"
    t.bigint "company_id", null: false
    t.decimal "cost_price", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.decimal "current_quantity", precision: 10, scale: 3, default: "0.0", null: false
    t.boolean "is_active", default: true, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.decimal "minimum_quantity", precision: 10, scale: 3, default: "0.0", null: false
    t.text "name", null: false
    t.text "notes"
    t.text "slug", null: false
    t.text "unit", default: "un", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "is_active"], name: "index_inventory_items_on_company_id_and_is_active"
    t.index ["company_id", "slug"], name: "index_inventory_items_on_company_id_and_slug", unique: true
    t.index ["company_id"], name: "index_inventory_items_on_company_id"
    t.index ["legacy_id"], name: "index_inventory_items_on_legacy_id"
  end

  create_table "inventory_movements", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "inventory_item_id", null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "movement_type", null: false
    t.text "notes"
    t.date "purchase_date"
    t.decimal "quantity", precision: 10, scale: 3, null: false
    t.decimal "quantity_after", precision: 10, scale: 3, null: false
    t.decimal "quantity_before", precision: 10, scale: 3, null: false
    t.text "reason"
    t.bigint "reference_id"
    t.text "source", default: "manual", null: false
    t.text "supplier_name"
    t.decimal "total_cost", precision: 10, scale: 2
    t.decimal "unit_cost", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["company_id", "inventory_item_id"], name: "index_inventory_movements_on_company_id_and_inventory_item_id"
    t.index ["company_id", "movement_type"], name: "index_inventory_movements_on_company_id_and_movement_type"
    t.index ["company_id", "reference_id"], name: "index_inventory_movements_on_company_id_and_reference_id"
    t.index ["company_id", "source"], name: "index_inventory_movements_on_company_id_and_source"
    t.index ["company_id"], name: "index_inventory_movements_on_company_id"
    t.index ["inventory_item_id"], name: "index_inventory_movements_on_inventory_item_id"
    t.index ["legacy_id"], name: "index_inventory_movements_on_legacy_id"
    t.index ["user_id"], name: "index_inventory_movements_on_user_id"
  end

  create_table "marketing_campaign_recipients", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "customer_id"
    t.text "error_message"
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.bigint "marketing_campaign_id", null: false
    t.text "personalized_message"
    t.text "phone", null: false
    t.datetime "sent_at"
    t.text "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "marketing_campaign_id"], name: "idx_on_company_id_marketing_campaign_id_a11d498579"
    t.index ["company_id", "status"], name: "index_marketing_campaign_recipients_on_company_id_and_status"
    t.index ["company_id"], name: "index_marketing_campaign_recipients_on_company_id"
    t.index ["customer_id"], name: "index_marketing_campaign_recipients_on_customer_id"
    t.index ["legacy_id"], name: "index_marketing_campaign_recipients_on_legacy_id"
    t.index ["marketing_campaign_id"], name: "index_marketing_campaign_recipients_on_marketing_campaign_id"
  end

  create_table "marketing_campaigns", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "completed_at"
    t.string "coupon_code"
    t.datetime "created_at", null: false
    t.integer "daily_limit", default: 100, null: false
    t.integer "failed_count", default: 0, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "message_template"
    t.jsonb "metadata", default: {}, null: false
    t.integer "pause_seconds", default: 45, null: false
    t.integer "sent_count", default: 0, null: false
    t.datetime "started_at"
    t.text "status", default: "draft", null: false
    t.text "title", null: false
    t.integer "total_recipients", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "status"], name: "index_marketing_campaigns_on_company_id_and_status"
    t.index ["company_id"], name: "index_marketing_campaigns_on_company_id"
    t.index ["legacy_id"], name: "index_marketing_campaigns_on_legacy_id"
  end

  create_table "marketing_message_logs", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "customer_id"
    t.text "error_message"
    t.bigint "marketing_campaign_id"
    t.text "message", null: false
    t.jsonb "metadata", default: {}, null: false
    t.string "phone", null: false
    t.string "provider", default: "evolution", null: false
    t.datetime "sent_at"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "status"], name: "index_marketing_message_logs_on_company_id_and_status"
    t.index ["company_id"], name: "index_marketing_message_logs_on_company_id"
    t.index ["customer_id"], name: "index_marketing_message_logs_on_customer_id"
    t.index ["marketing_campaign_id"], name: "index_marketing_message_logs_on_marketing_campaign_id"
  end

  create_table "master_audit_logs", force: :cascade do |t|
    t.string "action", null: false
    t.string "actor_email"
    t.bigint "actor_id"
    t.string "actor_name"
    t.bigint "company_id"
    t.string "company_name"
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.jsonb "metadata", default: {}, null: false
    t.string "module_name", default: "system", null: false
    t.bigint "resource_id"
    t.string "resource_type"
    t.string "status", default: "success", null: false
    t.datetime "updated_at", null: false
    t.text "user_agent"
    t.index ["action"], name: "index_master_audit_logs_on_action"
    t.index ["actor_id"], name: "index_master_audit_logs_on_actor_id"
    t.index ["company_id"], name: "index_master_audit_logs_on_company_id"
    t.index ["created_at"], name: "index_master_audit_logs_on_created_at"
    t.index ["module_name"], name: "index_master_audit_logs_on_module_name"
    t.index ["resource_type", "resource_id"], name: "index_master_audit_logs_on_resource_type_and_resource_id"
    t.index ["status"], name: "index_master_audit_logs_on_status"
  end

  create_table "master_brand_settings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "dark_logo_url"
    t.string "favicon_url"
    t.string "light_logo_url"
    t.string "platform_name", default: "Replymesh", null: false
    t.string "primary_color", default: "#18181b", null: false
    t.string "secondary_color", default: "#16a34a", null: false
    t.string "support_email"
    t.string "support_whatsapp"
    t.datetime "updated_at", null: false
  end

  create_table "master_impersonation_sessions", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "ip_address"
    t.bigint "master_user_id", null: false
    t.text "reason"
    t.datetime "revoked_at"
    t.string "status", default: "active", null: false
    t.string "token_hash", null: false
    t.datetime "updated_at", null: false
    t.text "user_agent"
    t.index ["company_id", "status"], name: "index_master_impersonation_sessions_on_company_id_and_status"
    t.index ["company_id"], name: "index_master_impersonation_sessions_on_company_id"
    t.index ["expires_at"], name: "index_master_impersonation_sessions_on_expires_at"
    t.index ["master_user_id", "status"], name: "idx_on_master_user_id_status_d639e6900c"
    t.index ["master_user_id"], name: "index_master_impersonation_sessions_on_master_user_id"
    t.index ["token_hash"], name: "index_master_impersonation_sessions_on_token_hash", unique: true
  end

  create_table "master_invites", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "expires_at", null: false
    t.bigint "invited_by_id"
    t.datetime "last_sent_at"
    t.bigint "master_role_id", null: false
    t.string "name"
    t.integer "resend_count", default: 0, null: false
    t.string "status", default: "pending", null: false
    t.string "token", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_master_invites_on_email"
    t.index ["expires_at"], name: "index_master_invites_on_expires_at"
    t.index ["invited_by_id"], name: "index_master_invites_on_invited_by_id"
    t.index ["master_role_id"], name: "index_master_invites_on_master_role_id"
    t.index ["status"], name: "index_master_invites_on_status"
    t.index ["token"], name: "index_master_invites_on_token", unique: true
  end

  create_table "master_roles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "key", null: false
    t.string "name", null: false
    t.jsonb "permissions", default: {}, null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["key"], name: "index_master_roles_on_key", unique: true
    t.index ["status"], name: "index_master_roles_on_status"
  end

  create_table "motoboy_financial_adjustments", force: :cascade do |t|
    t.date "adjustment_date", null: false
    t.string "adjustment_type", default: "adjustment", null: false
    t.integer "amount_cents", default: 0, null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.string "description"
    t.string "direction", default: "debit", null: false
    t.bigint "motoboy_id", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "adjustment_date"], name: "idx_motoboy_adjustments_company_date"
    t.index ["company_id"], name: "index_motoboy_financial_adjustments_on_company_id"
    t.index ["created_by_id"], name: "index_motoboy_financial_adjustments_on_created_by_id"
    t.index ["motoboy_id"], name: "index_motoboy_financial_adjustments_on_motoboy_id"
  end

  create_table "motoboys", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "fcm_token"
    t.boolean "is_available", default: true, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "name", null: false
    t.text "notes"
    t.text "phone"
    t.integer "total_deliveries", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["company_id", "active"], name: "index_motoboys_on_company_id_and_active"
    t.index ["company_id", "user_id"], name: "index_motoboys_on_company_id_and_user_id"
    t.index ["company_id"], name: "index_motoboys_on_company_id"
    t.index ["legacy_id"], name: "index_motoboys_on_legacy_id"
    t.index ["user_id"], name: "index_motoboys_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.string "link_url"
    t.text "message"
    t.jsonb "metadata", default: {}
    t.string "notification_type", default: "system", null: false
    t.datetime "read_at"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["company_id", "read_at"], name: "index_notifications_on_company_id_and_read_at"
    t.index ["company_id"], name: "index_notifications_on_company_id"
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["read_at"], name: "index_notifications_on_read_at"
    t.index ["user_id", "read_at"], name: "index_notifications_on_user_id_and_read_at"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "order_attempts", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "customer_phone"
    t.text "ip_address"
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.bigint "order_id"
    t.text "order_signature"
    t.text "reason"
    t.text "status", default: "created", null: false
    t.datetime "updated_at", null: false
    t.text "user_agent"
    t.index ["company_id", "customer_phone", "created_at"], name: "idx_on_company_id_customer_phone_created_at_0efbadb1d0"
    t.index ["company_id", "ip_address", "created_at"], name: "idx_on_company_id_ip_address_created_at_acd9bde64c"
    t.index ["company_id"], name: "index_order_attempts_on_company_id"
    t.index ["legacy_id"], name: "index_order_attempts_on_legacy_id"
    t.index ["order_id"], name: "index_order_attempts_on_order_id"
  end

  create_table "order_items", force: :cascade do |t|
    t.datetime "cancelled_at"
    t.bigint "cancelled_by_id"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "notes"
    t.bigint "order_id", null: false
    t.bigint "product_id"
    t.text "product_name", null: false
    t.integer "quantity", default: 1, null: false
    t.jsonb "selected_options", default: []
    t.datetime "sent_to_kitchen_at"
    t.text "status", default: "active", null: false
    t.integer "total_cost_cents", default: 0
    t.integer "total_price_cents", default: 0, null: false
    t.integer "unit_cost_cents", default: 0
    t.integer "unit_price_cents", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["cancelled_by_id"], name: "index_order_items_on_cancelled_by_id"
    t.index ["company_id", "order_id"], name: "index_order_items_on_company_id_and_order_id"
    t.index ["company_id", "status"], name: "index_order_items_on_company_id_and_status"
    t.index ["company_id"], name: "index_order_items_on_company_id"
    t.index ["legacy_id"], name: "index_order_items_on_legacy_id"
    t.index ["order_id"], name: "index_order_items_on_order_id"
    t.index ["product_id"], name: "index_order_items_on_product_id"
  end

  create_table "order_payment_details", force: :cascade do |t|
    t.integer "amount_cents", default: 0, null: false
    t.integer "change_amount_cents"
    t.integer "change_for_cents"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.boolean "needs_change", default: false, null: false
    t.bigint "order_id", null: false
    t.text "payment_method", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "idx_order_payment_details_company"
    t.index ["company_id"], name: "index_order_payment_details_on_company_id"
    t.index ["legacy_id"], name: "index_order_payment_details_on_legacy_id"
    t.index ["order_id"], name: "index_order_payment_details_on_order_id", unique: true
  end

  create_table "order_status_logs", force: :cascade do |t|
    t.bigint "changed_by_id"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "new_status", null: false
    t.bigint "order_id", null: false
    t.text "previous_status"
    t.datetime "updated_at", null: false
    t.index ["changed_by_id"], name: "index_order_status_logs_on_changed_by_id"
    t.index ["company_id", "order_id"], name: "index_order_status_logs_on_company_id_and_order_id"
    t.index ["company_id"], name: "index_order_status_logs_on_company_id"
    t.index ["legacy_id"], name: "index_order_status_logs_on_legacy_id"
    t.index ["order_id"], name: "index_order_status_logs_on_order_id"
  end

  create_table "orders", force: :cascade do |t|
    t.datetime "accepted_at"
    t.bigint "attendant_id"
    t.datetime "cancelled_at"
    t.integer "change_for_cents"
    t.text "city"
    t.bigint "company_id", null: false
    t.text "complement"
    t.datetime "completed_at"
    t.text "coupon_code"
    t.bigint "coupon_id"
    t.datetime "created_at", null: false
    t.bigint "customer_id"
    t.text "customer_name"
    t.text "customer_phone"
    t.text "customer_whatsapp"
    t.integer "delivery_fee_cents", default: 0, null: false
    t.decimal "delivery_latitude", precision: 10, scale: 7
    t.datetime "delivery_location_received_at"
    t.string "delivery_location_source"
    t.decimal "delivery_longitude", precision: 10, scale: 7
    t.text "delivery_status", default: "pending", null: false
    t.bigint "delivery_zone_id"
    t.bigint "dining_table_id"
    t.integer "discount_cents", default: 0, null: false
    t.string "external_payment_id"
    t.datetime "financial_recorded_at"
    t.string "google_maps_url"
    t.boolean "inventory_deducted", default: false, null: false
    t.datetime "inventory_deducted_at"
    t.boolean "inventory_restored", default: false, null: false
    t.datetime "inventory_restored_at"
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.bigint "motoboy_id"
    t.boolean "needs_change", default: false, null: false
    t.text "neighborhood"
    t.text "notes"
    t.text "number"
    t.bigint "order_number", null: false
    t.text "order_type", default: "delivery", null: false
    t.datetime "out_for_delivery_at"
    t.datetime "paid_at"
    t.datetime "payment_confirmed_at"
    t.text "payment_method", default: "money", null: false
    t.text "payment_status", default: "pending", null: false
    t.text "pix_copy_paste"
    t.text "pix_qr_code"
    t.text "pix_qr_code_base64"
    t.string "pix_ticket_url"
    t.datetime "preparing_at"
    t.string "public_token", null: false
    t.datetime "ready_at"
    t.text "reference"
    t.text "state"
    t.text "status", default: "pending", null: false
    t.text "street"
    t.integer "subtotal_cents", default: 0, null: false
    t.integer "total_cents", default: 0, null: false
    t.datetime "updated_at", null: false
    t.string "waze_url"
    t.text "zip_code"
    t.index ["attendant_id"], name: "index_orders_on_attendant_id"
    t.index ["company_id", "created_at"], name: "index_orders_on_company_id_and_created_at"
    t.index ["company_id", "customer_id"], name: "index_orders_on_company_id_and_customer_id"
    t.index ["company_id", "customer_phone", "status", "created_at"], name: "idx_orders_location_phone_lookup"
    t.index ["company_id", "delivery_status"], name: "index_orders_on_company_id_and_delivery_status"
    t.index ["company_id", "motoboy_id"], name: "index_orders_on_company_id_and_motoboy_id"
    t.index ["company_id", "order_number"], name: "index_orders_on_company_id_and_order_number", unique: true
    t.index ["company_id", "payment_status"], name: "index_orders_on_company_id_and_payment_status"
    t.index ["company_id", "public_token"], name: "index_orders_on_company_id_and_public_token", unique: true
    t.index ["company_id", "status"], name: "index_orders_on_company_id_and_status"
    t.index ["company_id"], name: "index_orders_on_company_id"
    t.index ["coupon_id"], name: "index_orders_on_coupon_id"
    t.index ["customer_id"], name: "index_orders_on_customer_id"
    t.index ["delivery_zone_id"], name: "index_orders_on_delivery_zone_id"
    t.index ["dining_table_id"], name: "index_orders_on_dining_table_id"
    t.index ["external_payment_id"], name: "idx_orders_external_payment_id", unique: true, where: "(external_payment_id IS NOT NULL)"
    t.index ["legacy_id"], name: "index_orders_on_legacy_id"
    t.index ["motoboy_id"], name: "index_orders_on_motoboy_id"
    t.index ["public_token"], name: "index_orders_on_public_token", unique: true
  end

  create_table "payment_methods", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.boolean "enabled", default: true, null: false
    t.text "instructions"
    t.text "method_type", null: false
    t.text "name", null: false
    t.text "pix_key"
    t.boolean "requires_change", default: false, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_payment_methods_on_company_id"
  end

  create_table "plans", force: :cascade do |t|
    t.text "billing_cycle", default: "monthly", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.jsonb "features_json", default: [], null: false
    t.text "name", null: false
    t.integer "price_cents", default: 0, null: false
    t.text "slug", null: false
    t.text "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_plans_on_slug", unique: true
  end

  create_table "product_option_groups", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "group_type", default: "single", null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.integer "max_select", default: 1, null: false
    t.integer "min_select", default: 0, null: false
    t.text "name", null: false
    t.bigint "product_id", null: false
    t.boolean "required", default: false, null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "product_id"], name: "index_product_option_groups_on_company_id_and_product_id"
    t.index ["company_id"], name: "index_product_option_groups_on_company_id"
    t.index ["legacy_id"], name: "index_product_option_groups_on_legacy_id"
    t.index ["product_id"], name: "index_product_option_groups_on_product_id"
  end

  create_table "product_option_items", force: :cascade do |t|
    t.integer "additional_price_cents", default: 0, null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.boolean "is_active", default: true, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "name", null: false
    t.bigint "product_option_group_id", null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "product_option_group_id"], name: "idx_on_company_id_product_option_group_id_52e263d5d3"
    t.index ["company_id"], name: "index_product_option_items_on_company_id"
    t.index ["legacy_id"], name: "index_product_option_items_on_legacy_id"
    t.index ["product_option_group_id"], name: "index_product_option_items_on_product_option_group_id"
  end

  create_table "products", force: :cascade do |t|
    t.bigint "category_id", null: false
    t.bigint "company_id", null: false
    t.integer "cost_price_cents", default: 0
    t.datetime "created_at", null: false
    t.text "description"
    t.text "image_url"
    t.boolean "is_active", default: true, null: false
    t.boolean "is_combo", default: false, null: false
    t.boolean "is_customizable", default: false, null: false
    t.boolean "is_featured", default: false, null: false
    t.boolean "is_promotional", default: false, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "name", null: false
    t.integer "price_cents", default: 0, null: false
    t.integer "promotional_price_cents"
    t.text "slug", null: false
    t.integer "sort_order", default: 0, null: false
    t.bigint "stock_item_id"
    t.boolean "track_inventory", default: false, null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_products_on_category_id"
    t.index ["company_id", "category_id"], name: "index_products_on_company_id_and_category_id"
    t.index ["company_id", "is_active"], name: "index_products_on_company_id_and_is_active"
    t.index ["company_id", "is_featured"], name: "index_products_on_company_id_and_is_featured"
    t.index ["company_id", "slug"], name: "index_products_on_company_id_and_slug", unique: true
    t.index ["company_id"], name: "index_products_on_company_id"
    t.index ["legacy_id"], name: "index_products_on_legacy_id"
    t.index ["stock_item_id"], name: "index_products_on_stock_item_id"
  end

  create_table "store_ai_conversations", force: :cascade do |t|
    t.string "channel", default: "simulator", null: false
    t.bigint "company_id", null: false
    t.jsonb "context", default: {}, null: false
    t.datetime "created_at", null: false
    t.bigint "customer_id"
    t.datetime "last_message_at"
    t.string "phone"
    t.string "status", default: "open", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "phone", "status"], name: "index_store_ai_conversations_lookup"
    t.index ["company_id"], name: "index_store_ai_conversations_on_company_id"
    t.index ["customer_id"], name: "index_store_ai_conversations_on_customer_id"
  end

  create_table "store_ai_messages", force: :cascade do |t|
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.jsonb "rag_chunks", default: [], null: false
    t.integer "response_time_ms", default: 0, null: false
    t.string "role", null: false
    t.bigint "store_ai_conversation_id", null: false
    t.integer "tokens_used", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["store_ai_conversation_id", "created_at"], name: "index_store_ai_messages_conversation_created"
    t.index ["store_ai_conversation_id"], name: "index_store_ai_messages_on_store_ai_conversation_id"
  end

  create_table "store_ai_settings", force: :cascade do |t|
    t.boolean "allow_delivery", default: true, null: false
    t.boolean "allow_hours", default: true, null: false
    t.boolean "allow_order_status", default: true, null: false
    t.boolean "allow_orders", default: true, null: false
    t.boolean "allow_payments", default: true, null: false
    t.boolean "allow_products", default: true, null: false
    t.boolean "allow_promotions", default: true, null: false
    t.string "assistant_name", default: "Assistente da Loja", null: false
    t.boolean "auto_reply_whatsapp", default: false, null: false
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.integer "daily_limit", default: 100, null: false
    t.boolean "enabled", default: false, null: false
    t.text "initial_message", default: "Ola! Como posso ajudar?", null: false
    t.string "model"
    t.string "tone", default: "simpatico, objetivo e natural", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_store_ai_settings_on_company_id", unique: true
    t.index ["enabled", "auto_reply_whatsapp"], name: "index_store_ai_settings_on_enabled_and_auto_reply_whatsapp"
  end

  create_table "store_settings", force: :cascade do |t|
    t.text "accent_color", default: "#2563eb"
    t.jsonb "accepted_payment_methods", default: [], null: false
    t.text "address"
    t.boolean "allow_pickup", default: true, null: false
    t.string "average_delivery_time"
    t.text "banner_url"
    t.boolean "block_orders_when_closed", default: true, null: false
    t.boolean "block_outside_delivery_area", default: true, null: false
    t.text "city"
    t.text "closed_message"
    t.bigint "company_id", null: false
    t.text "company_name"
    t.text "cover_url"
    t.datetime "created_at", null: false
    t.integer "default_delivery_fee_cents", default: 0, null: false
    t.text "default_order_message"
    t.text "default_support_message"
    t.boolean "delivery_enabled", default: true, null: false
    t.integer "delivery_fee_cents", default: 0, null: false
    t.boolean "dine_in_enabled", default: false, null: false
    t.text "email"
    t.integer "estimated_delivery_minutes", default: 40, null: false
    t.text "facebook"
    t.integer "free_delivery_above_cents", default: 0, null: false
    t.integer "hero_height", default: 480, null: false
    t.string "hero_highlight"
    t.string "hero_image_position"
    t.text "hero_image_url"
    t.integer "hero_image_zoom", default: 100, null: false
    t.integer "hero_overlay_opacity", default: 65, null: false
    t.text "hero_subtitle"
    t.string "hero_title"
    t.text "instagram"
    t.text "logo_url"
    t.text "mercadopago_access_token"
    t.boolean "mercadopago_enabled", default: false, null: false
    t.string "mercadopago_public_key"
    t.string "mercadopago_webhook_secret"
    t.integer "min_order_value_cents", default: 0, null: false
    t.jsonb "opening_hours", default: {}, null: false
    t.text "order_message_template"
    t.text "phone"
    t.boolean "pickup_enabled", default: true, null: false
    t.boolean "pix_enabled", default: false, null: false
    t.text "pix_key"
    t.text "pix_key_type"
    t.text "pix_payload"
    t.string "pix_provider", default: "manual", null: false
    t.text "pix_qr_code_url"
    t.string "pix_receiver_city"
    t.string "pix_receiver_name"
    t.text "primary_color", default: "#16a34a"
    t.text "print_footer"
    t.integer "recurring_customer_min_orders", default: 2, null: false
    t.text "secondary_color", default: "#0b0b0d"
    t.text "state"
    t.text "store_name"
    t.text "store_status", default: "open", null: false
    t.string "theme_primary_color"
    t.text "trade_name"
    t.datetime "updated_at", null: false
    t.string "visual_template_id", default: "hamburgueria-classic", null: false
    t.text "whatsapp"
    t.text "whatsapp_number"
    t.text "zip_code"
    t.index ["company_id"], name: "index_store_settings_on_company_id", unique: true
  end

  create_table "subscriptions", force: :cascade do |t|
    t.datetime "canceled_at"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "current_period_end"
    t.datetime "current_period_start"
    t.bigint "plan_id", null: false
    t.integer "price_cents", default: 0, null: false
    t.datetime "started_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.text "status", default: "trial", null: false
    t.datetime "trial_ends_at"
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_subscriptions_on_company_id"
    t.index ["plan_id"], name: "index_subscriptions_on_plan_id"
    t.index ["status"], name: "index_subscriptions_on_status"
  end

  create_table "support_ticket_messages", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "internal", default: false, null: false
    t.text "message", null: false
    t.bigint "support_ticket_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["support_ticket_id", "created_at"], name: "idx_on_support_ticket_id_created_at_0d70c2b287"
    t.index ["support_ticket_id"], name: "index_support_ticket_messages_on_support_ticket_id"
    t.index ["user_id"], name: "index_support_ticket_messages_on_user_id"
  end

  create_table "support_tickets", force: :cascade do |t|
    t.datetime "closed_at"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "message", null: false
    t.string "priority", default: "normal", null: false
    t.datetime "resolved_at"
    t.string "status", default: "open", null: false
    t.string "subject", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["company_id", "status"], name: "index_support_tickets_on_company_id_and_status"
    t.index ["company_id"], name: "index_support_tickets_on_company_id"
    t.index ["created_at"], name: "index_support_tickets_on_created_at"
    t.index ["priority", "status"], name: "index_support_tickets_on_priority_and_status"
    t.index ["user_id"], name: "index_support_tickets_on_user_id"
  end

  create_table "system_alerts", force: :cascade do |t|
    t.bigint "company_id"
    t.datetime "created_at", null: false
    t.text "level", default: "warning", null: false
    t.text "message", null: false
    t.jsonb "metadata_json", default: {}, null: false
    t.datetime "resolved_at"
    t.bigint "resolved_by_id"
    t.text "title", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_system_alerts_on_company_id"
    t.index ["level"], name: "index_system_alerts_on_level"
    t.index ["resolved_at"], name: "index_system_alerts_on_resolved_at"
    t.index ["resolved_by_id"], name: "index_system_alerts_on_resolved_by_id"
  end

  create_table "system_update_reads", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.datetime "read_at", null: false
    t.bigint "system_update_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["company_id"], name: "index_system_update_reads_on_company_id"
    t.index ["system_update_id", "company_id", "user_id"], name: "index_system_update_reads_unique", unique: true
    t.index ["system_update_id"], name: "index_system_update_reads_on_system_update_id"
    t.index ["user_id"], name: "index_system_update_reads_on_user_id"
  end

  create_table "system_updates", force: :cascade do |t|
    t.string "audience_type", default: "all", null: false
    t.string "color"
    t.bigint "company_id"
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.string "icon"
    t.string "image_url"
    t.boolean "is_featured", default: false, null: false
    t.string "link_url"
    t.string "plan_key"
    t.datetime "published_at"
    t.string "short_description", null: false
    t.string "status", default: "draft", null: false
    t.string "title", null: false
    t.string "update_type", default: "improvement", null: false
    t.datetime "updated_at", null: false
    t.string "version", null: false
    t.index ["audience_type"], name: "index_system_updates_on_audience_type"
    t.index ["company_id"], name: "index_system_updates_on_company_id"
    t.index ["published_at"], name: "index_system_updates_on_published_at"
    t.index ["status"], name: "index_system_updates_on_status"
    t.index ["update_type"], name: "index_system_updates_on_update_type"
    t.index ["version"], name: "index_system_updates_on_version"
  end

  create_table "table_sessions", force: :cascade do |t|
    t.bigint "attendant_id"
    t.datetime "closed_at"
    t.bigint "closed_by_id"
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "dining_table_id", null: false
    t.integer "discount_cents", default: 0, null: false
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "notes"
    t.datetime "opened_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.bigint "opened_by_id"
    t.bigint "order_id"
    t.datetime "paid_at"
    t.text "payment_method"
    t.text "payment_status", default: "pending", null: false
    t.datetime "requested_close_at"
    t.datetime "sent_to_kitchen_at"
    t.integer "service_fee_cents", default: 0, null: false
    t.decimal "service_fee_percent", precision: 5, scale: 2, default: "0.0", null: false
    t.text "status", default: "open", null: false
    t.integer "subtotal_cents", default: 0, null: false
    t.integer "total_cents", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["attendant_id"], name: "index_table_sessions_on_attendant_id"
    t.index ["closed_by_id"], name: "index_table_sessions_on_closed_by_id"
    t.index ["company_id", "dining_table_id"], name: "index_table_sessions_on_company_id_and_dining_table_id"
    t.index ["company_id", "opened_at"], name: "index_table_sessions_on_company_id_and_opened_at"
    t.index ["company_id", "status"], name: "index_table_sessions_on_company_id_and_status"
    t.index ["company_id"], name: "index_table_sessions_on_company_id"
    t.index ["dining_table_id"], name: "index_table_sessions_on_dining_table_id"
    t.index ["legacy_id"], name: "index_table_sessions_on_legacy_id"
    t.index ["opened_by_id"], name: "index_table_sessions_on_opened_by_id"
    t.index ["order_id"], name: "index_table_sessions_on_order_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.text "email", null: false
    t.text "global_role", default: "user", null: false
    t.datetime "last_sign_in_at"
    t.bigint "master_role_id"
    t.text "name", null: false
    t.text "password_digest", null: false
    t.text "phone"
    t.text "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["master_role_id", "status"], name: "index_users_on_master_role_id_and_status"
    t.index ["master_role_id"], name: "index_users_on_master_role_id"
    t.index ["status"], name: "index_users_on_status"
  end

  create_table "whatsapp_instances", force: :cascade do |t|
    t.text "base_url"
    t.bigint "company_id", null: false
    t.text "connected_number"
    t.datetime "created_at", null: false
    t.text "instance_name", null: false
    t.string "instance_token"
    t.string "instance_uuid"
    t.datetime "last_connected_at"
    t.datetime "last_disconnected_at"
    t.datetime "last_remote_sync_at"
    t.text "provider", default: "evolution_go", null: false
    t.text "qr_code"
    t.jsonb "remote_data", default: {}, null: false
    t.string "remote_status"
    t.text "status", default: "not_created", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "instance_name"], name: "index_whatsapp_instances_on_company_id_and_instance_name", unique: true
    t.index ["company_id"], name: "index_whatsapp_instances_on_company_id"
    t.index ["instance_uuid"], name: "index_whatsapp_instances_on_instance_uuid"
    t.index ["status"], name: "index_whatsapp_instances_on_status"
  end

  create_table "whatsapp_logs", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "level", default: "info", null: false
    t.text "message", null: false
    t.jsonb "metadata_json", default: {}
    t.datetime "updated_at", null: false
    t.bigint "whatsapp_instance_id"
    t.index ["company_id"], name: "index_whatsapp_logs_on_company_id"
    t.index ["level"], name: "index_whatsapp_logs_on_level"
    t.index ["whatsapp_instance_id"], name: "index_whatsapp_logs_on_whatsapp_instance_id"
  end

  create_table "whatsapp_message_logs", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.text "error_message"
    t.string "legacy_id"
    t.string "legacy_source"
    t.string "legacy_table"
    t.text "message"
    t.bigint "order_id"
    t.text "order_status_ref"
    t.text "phone", null: false
    t.text "provider", default: "evolution_go", null: false
    t.jsonb "response_data", default: {}
    t.text "send_status", default: "sent", null: false
    t.bigint "sent_by_id"
    t.text "template_key"
    t.datetime "updated_at", null: false
    t.index ["company_id", "order_id", "template_key", "order_status_ref"], name: "no_duplicate_wa_message_per_order_status", where: "((send_status = 'sent'::text) AND (order_id IS NOT NULL))"
    t.index ["company_id", "send_status"], name: "index_whatsapp_message_logs_on_company_id_and_send_status"
    t.index ["company_id"], name: "index_whatsapp_message_logs_on_company_id"
    t.index ["legacy_id"], name: "index_whatsapp_message_logs_on_legacy_id"
    t.index ["order_id"], name: "index_whatsapp_message_logs_on_order_id"
    t.index ["sent_by_id"], name: "index_whatsapp_message_logs_on_sent_by_id"
  end

  create_table "whatsapp_remote_instances", force: :cascade do |t|
    t.string "connected_number"
    t.datetime "created_at", null: false
    t.string "instance_name", null: false
    t.string "instance_uuid"
    t.datetime "last_remote_sync_at"
    t.string "profile_name"
    t.jsonb "remote_data", default: {}, null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["instance_name"], name: "index_whatsapp_remote_instances_on_instance_name", unique: true
    t.index ["instance_uuid"], name: "index_whatsapp_remote_instances_on_instance_uuid", unique: true, where: "(instance_uuid IS NOT NULL)"
    t.index ["status"], name: "index_whatsapp_remote_instances_on_status"
  end

  create_table "whatsapp_templates", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.boolean "enabled", default: true, null: false
    t.text "message", null: false
    t.text "template_key", null: false
    t.text "title", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "template_key"], name: "index_whatsapp_templates_on_company_id_and_template_key", unique: true
    t.index ["company_id"], name: "index_whatsapp_templates_on_company_id"
  end

  create_table "wheel_prizes", force: :cascade do |t|
    t.text "badge"
    t.text "color"
    t.bigint "company_id", null: false
    t.integer "coupon_valid_days", default: 7, null: false
    t.datetime "created_at", null: false
    t.integer "current_wins", default: 0, null: false
    t.text "description"
    t.decimal "discount_value", precision: 10, scale: 2, default: "0.0", null: false
    t.boolean "is_active", default: true, null: false
    t.integer "max_total_wins"
    t.integer "minimum_order_cents", default: 0, null: false
    t.text "name", null: false
    t.text "prize_type", default: "percentage", null: false
    t.integer "probability_weight", default: 1, null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "is_active", "sort_order"], name: "index_wheel_prizes_on_company_id_and_is_active_and_sort_order"
    t.index ["company_id"], name: "index_wheel_prizes_on_company_id"
  end

  create_table "wheel_spins", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "coupon_id"
    t.datetime "created_at", null: false
    t.bigint "customer_id", null: false
    t.datetime "expires_at"
    t.jsonb "metadata_json", default: {}, null: false
    t.bigint "order_id"
    t.integer "order_spin_number"
    t.text "source", default: "order_completed", null: false
    t.text "status", default: "available", null: false
    t.datetime "updated_at", null: false
    t.datetime "used_at"
    t.bigint "wheel_prize_id"
    t.index ["company_id", "customer_id", "status", "created_at"], name: "idx_on_company_id_customer_id_status_created_at_989b42aaff"
    t.index ["company_id"], name: "index_wheel_spins_on_company_id"
    t.index ["coupon_id"], name: "index_wheel_spins_on_coupon_id"
    t.index ["customer_id"], name: "index_wheel_spins_on_customer_id"
    t.index ["order_id", "order_spin_number"], name: "index_wheel_spins_on_order_id_and_order_spin_number", unique: true, where: "((order_id IS NOT NULL) AND (order_spin_number IS NOT NULL))"
    t.index ["order_id"], name: "index_wheel_spins_on_order_id"
    t.index ["wheel_prize_id"], name: "index_wheel_spins_on_wheel_prize_id"
  end

  add_foreign_key "activity_logs", "companies", on_delete: :cascade
  add_foreign_key "activity_logs", "users", on_delete: :nullify
  add_foreign_key "ai_assistant_logs", "companies"
  add_foreign_key "ai_assistant_logs", "users"
  add_foreign_key "ai_usage_logs", "companies"
  add_foreign_key "ai_usage_logs", "users"
  add_foreign_key "android_app_requests", "companies", on_delete: :cascade
  add_foreign_key "android_app_requests", "users", column: "responsible_id", on_delete: :nullify
  add_foreign_key "app_banners", "companies", on_delete: :cascade
  add_foreign_key "business_hour_exceptions", "companies", on_delete: :cascade
  add_foreign_key "business_hours", "companies", on_delete: :cascade
  add_foreign_key "cash_movements", "cash_sessions", on_delete: :restrict
  add_foreign_key "cash_movements", "companies", on_delete: :cascade
  add_foreign_key "cash_movements", "orders", on_delete: :nullify
  add_foreign_key "cash_movements", "users", column: "created_by_id", on_delete: :nullify
  add_foreign_key "cash_sessions", "companies", on_delete: :cascade
  add_foreign_key "cash_sessions", "users", column: "closed_by_id", on_delete: :nullify
  add_foreign_key "cash_sessions", "users", column: "opened_by_id", on_delete: :restrict
  add_foreign_key "categories", "companies", on_delete: :cascade
  add_foreign_key "company_members", "companies", on_delete: :cascade
  add_foreign_key "company_members", "users", on_delete: :cascade
  add_foreign_key "coupons", "companies", on_delete: :cascade
  add_foreign_key "coupons", "customers", on_delete: :nullify
  add_foreign_key "customer_addresses", "companies", on_delete: :cascade
  add_foreign_key "customer_addresses", "customers", on_delete: :cascade
  add_foreign_key "customers", "companies", on_delete: :cascade
  add_foreign_key "delivery_history", "companies", on_delete: :cascade
  add_foreign_key "delivery_history", "motoboys", on_delete: :restrict
  add_foreign_key "delivery_history", "orders", on_delete: :cascade
  add_foreign_key "delivery_zones", "companies", on_delete: :cascade
  add_foreign_key "dining_tables", "companies", on_delete: :cascade
  add_foreign_key "domains", "companies", on_delete: :cascade
  add_foreign_key "inventory_items", "companies", on_delete: :cascade
  add_foreign_key "inventory_movements", "companies", on_delete: :cascade
  add_foreign_key "inventory_movements", "inventory_items", on_delete: :cascade
  add_foreign_key "inventory_movements", "users", on_delete: :nullify
  add_foreign_key "marketing_campaign_recipients", "companies", on_delete: :cascade
  add_foreign_key "marketing_campaign_recipients", "customers", on_delete: :nullify
  add_foreign_key "marketing_campaign_recipients", "marketing_campaigns", on_delete: :cascade
  add_foreign_key "marketing_campaigns", "companies", on_delete: :cascade
  add_foreign_key "marketing_message_logs", "companies", on_delete: :cascade
  add_foreign_key "marketing_message_logs", "customers", on_delete: :nullify
  add_foreign_key "marketing_message_logs", "marketing_campaigns", on_delete: :nullify
  add_foreign_key "master_audit_logs", "companies", on_delete: :nullify
  add_foreign_key "master_audit_logs", "users", column: "actor_id", on_delete: :nullify
  add_foreign_key "master_impersonation_sessions", "companies", on_delete: :cascade
  add_foreign_key "master_impersonation_sessions", "users", column: "master_user_id", on_delete: :cascade
  add_foreign_key "master_invites", "master_roles"
  add_foreign_key "master_invites", "users", column: "invited_by_id"
  add_foreign_key "motoboy_financial_adjustments", "companies"
  add_foreign_key "motoboy_financial_adjustments", "motoboys"
  add_foreign_key "motoboy_financial_adjustments", "users", column: "created_by_id"
  add_foreign_key "motoboys", "companies", on_delete: :cascade
  add_foreign_key "motoboys", "users", on_delete: :nullify
  add_foreign_key "notifications", "companies"
  add_foreign_key "notifications", "users"
  add_foreign_key "order_attempts", "companies", on_delete: :cascade
  add_foreign_key "order_attempts", "orders", on_delete: :nullify
  add_foreign_key "order_items", "companies", on_delete: :cascade
  add_foreign_key "order_items", "orders", on_delete: :cascade
  add_foreign_key "order_items", "products", on_delete: :nullify
  add_foreign_key "order_items", "users", column: "cancelled_by_id", on_delete: :nullify
  add_foreign_key "order_payment_details", "companies", on_delete: :cascade
  add_foreign_key "order_payment_details", "orders", on_delete: :cascade
  add_foreign_key "order_status_logs", "companies", on_delete: :cascade
  add_foreign_key "order_status_logs", "orders", on_delete: :cascade
  add_foreign_key "order_status_logs", "users", column: "changed_by_id", on_delete: :nullify
  add_foreign_key "orders", "companies", on_delete: :cascade
  add_foreign_key "orders", "coupons", on_delete: :nullify
  add_foreign_key "orders", "customers", on_delete: :nullify
  add_foreign_key "orders", "delivery_zones", on_delete: :nullify
  add_foreign_key "orders", "dining_tables", on_delete: :nullify
  add_foreign_key "orders", "motoboys", on_delete: :nullify
  add_foreign_key "orders", "users", column: "attendant_id", on_delete: :nullify
  add_foreign_key "payment_methods", "companies", on_delete: :cascade
  add_foreign_key "product_option_groups", "companies", on_delete: :cascade
  add_foreign_key "product_option_groups", "products", on_delete: :cascade
  add_foreign_key "product_option_items", "companies", on_delete: :cascade
  add_foreign_key "product_option_items", "product_option_groups", on_delete: :cascade
  add_foreign_key "products", "categories", on_delete: :restrict
  add_foreign_key "products", "companies", on_delete: :cascade
  add_foreign_key "products", "inventory_items", column: "stock_item_id", on_delete: :nullify
  add_foreign_key "store_ai_conversations", "companies"
  add_foreign_key "store_ai_conversations", "customers"
  add_foreign_key "store_ai_messages", "store_ai_conversations"
  add_foreign_key "store_ai_settings", "companies"
  add_foreign_key "store_settings", "companies", on_delete: :cascade
  add_foreign_key "subscriptions", "companies", on_delete: :cascade
  add_foreign_key "subscriptions", "plans"
  add_foreign_key "support_ticket_messages", "support_tickets"
  add_foreign_key "support_ticket_messages", "users"
  add_foreign_key "support_tickets", "companies"
  add_foreign_key "support_tickets", "users"
  add_foreign_key "system_alerts", "companies", on_delete: :cascade
  add_foreign_key "system_alerts", "users", column: "resolved_by_id", on_delete: :nullify
  add_foreign_key "system_update_reads", "companies"
  add_foreign_key "system_update_reads", "system_updates"
  add_foreign_key "system_update_reads", "users"
  add_foreign_key "system_updates", "companies"
  add_foreign_key "table_sessions", "companies", on_delete: :cascade
  add_foreign_key "table_sessions", "dining_tables", on_delete: :restrict
  add_foreign_key "table_sessions", "orders", on_delete: :nullify
  add_foreign_key "table_sessions", "users", column: "attendant_id", on_delete: :nullify
  add_foreign_key "table_sessions", "users", column: "closed_by_id", on_delete: :nullify
  add_foreign_key "table_sessions", "users", column: "opened_by_id", on_delete: :nullify
  add_foreign_key "users", "master_roles"
  add_foreign_key "whatsapp_instances", "companies", on_delete: :cascade
  add_foreign_key "whatsapp_logs", "companies", on_delete: :cascade
  add_foreign_key "whatsapp_logs", "whatsapp_instances", on_delete: :nullify
  add_foreign_key "whatsapp_message_logs", "companies", on_delete: :cascade
  add_foreign_key "whatsapp_message_logs", "orders", on_delete: :nullify
  add_foreign_key "whatsapp_message_logs", "users", column: "sent_by_id", on_delete: :nullify
  add_foreign_key "whatsapp_templates", "companies", on_delete: :cascade
  add_foreign_key "wheel_prizes", "companies", on_delete: :cascade
  add_foreign_key "wheel_spins", "companies", on_delete: :cascade
  add_foreign_key "wheel_spins", "coupons", on_delete: :nullify
  add_foreign_key "wheel_spins", "customers", on_delete: :cascade
  add_foreign_key "wheel_spins", "orders", on_delete: :nullify
  add_foreign_key "wheel_spins", "wheel_prizes", on_delete: :nullify
end
