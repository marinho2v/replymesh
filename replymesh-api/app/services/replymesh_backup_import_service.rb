class ReplymeshBackupImportService
  LEGACY_SOURCE = "replymesh_backup".freeze
  IMPORTABLE_KEYS = %w[
    store categories products product_option_groups product_option_items app_banners
    delivery_zones business_hours customers customer_addresses motoboys coupons
    wheel_prizes wheel_spins orders order_items order_status_history deliveries
    inventory_items dining_tables
  ].freeze
  COUNT_ONLY_KEYS = %w[
    product_images whatsapp_message_logs
    cash_sessions cash_movements table_sessions
  ].freeze

  Result = Struct.new(:success?, :payload, :errors, keyword_init: true)

  def self.call(...) = new(...).call

  def initialize(company:, payload:, import: false)
    @company = company
    @payload = payload.is_a?(ActionController::Parameters) ? payload.to_unsafe_h : payload.to_h
    @import = import
    @summary = { imported: Hash.new(0), updated: Hash.new(0), skipped: Hash.new(0), count_only: {}, warnings: [] }
    @maps = Hash.new { |hash, key| hash[key] = {} }
  end

  def call
    validate_payload!
    return Result.new(success?: true, payload: dry_run_payload, errors: []) unless @import

    ActiveRecord::Base.transaction do
      import_store_settings
      import_categories
      import_products
      import_product_option_groups
      import_product_option_items
      import_app_banners
      import_delivery_zones
      import_business_hours
      import_customers
      import_customer_addresses
      import_motoboys
      import_coupons
      import_wheel_prizes
      import_wheel_spins
      ensure_order_counter!
      import_orders
      import_order_items
      import_order_status_history
      import_deliveries
      import_inventory_items
      import_dining_tables
    end

    Result.new(success?: true, payload: response_payload(mode: "import"), errors: [])
  rescue StandardError => e
    Result.new(success?: false, payload: {}, errors: [e.message])
  end

  private

  def validate_payload!
    raise "Backup invalido: JSON vazio" if @payload.blank?
    raise "Backup invalido: produtos/categorias nao encontrados" unless @payload.key?("products") || @payload.key?(:products)
  end

  def dry_run_payload
    image_urls = array("products").map { |item| item["image_url"] } +
      array("product_images").map { |item| item["url"] || item["image_url"] } +
      array("app_banners").map { |item| item["imagem"] || item["image_url"] || item["url"] }

    relative_images = image_urls.compact.count { |url| url.present? && url.to_s !~ %r{\Ahttps?://}i }
    @summary[:warnings] << "#{relative_images} imagens usam caminho relativo e podem precisar dos arquivos na VPS." if relative_images.positive?

    response_payload(mode: "dry_run")
  end

  def response_payload(mode:)
    importable_counts = IMPORTABLE_KEYS.index_with { |key| key == "store" ? (@payload["store"].present? ? 1 : 0) : array(key).size }
    count_only_counts = COUNT_ONLY_KEYS.index_with { |key| array(key).size }
    {
      success: true,
      mode: mode,
      company: { id: @company.id, name: @company.name, slug: @company.slug },
      importable_counts: importable_counts,
      count_only_counts: count_only_counts,
      imported: @summary[:imported],
      updated: @summary[:updated],
      skipped: @summary[:skipped],
      warnings: @summary[:warnings].uniq
    }
  end

  def array(key)
    value = @payload[key] || @payload[key.to_sym]
    value.is_a?(Array) ? value : []
  end

  def object(key)
    value = @payload[key] || @payload[key.to_sym]
    value.is_a?(Hash) ? value : {}
  end

  def import_store_settings
    data = object("store")
    settings = data["settings"].is_a?(Hash) ? data["settings"] : {}
    return skip!("store") if data.blank? && settings.blank?

    record = @company.store_setting || @company.build_store_setting
    assign_if_column(record, {
      store_name: data["name"] || settings["store_name"],
      trade_name: data["trade_name"] || data["name"],
      company_name: data["name"],
      logo_url: data["logo_url"] || settings["logo_url"],
      banner_url: data["banner_url"] || settings["banner_url"],
      cover_url: data["banner_url"] || settings["cover_url"],
      whatsapp: data["whatsapp"] || settings["whatsapp"] || settings["whatsapp_number"],
      whatsapp_number: data["whatsapp"] || settings["whatsapp_number"],
      phone: data["phone"] || settings["phone"],
      email: data["email"] || settings["email"],
      address: data["address"] || settings["address"],
      city: data["city"] || settings["city"],
      state: data["state"] || settings["state"],
      zip_code: data["zip_code"] || settings["zip_code"],
      store_status: settings["store_status"],
      primary_color: settings["primary_color"],
      theme_primary_color: settings["primary_color"],
      default_delivery_fee_cents: cents(settings["delivery_fee_default"] || settings["default_delivery_fee"]),
      delivery_fee_cents: cents(settings["delivery_fee"] || settings["delivery_fee_default"]),
      pix_enabled: settings["pix_key"].present? || settings["pix_payload"].present?,
      pix_key: settings["pix_key"],
      pix_key_type: settings["pix_key_type"],
      pix_receiver_name: settings["pix_receiver_name"],
      pix_receiver_city: settings["pix_receiver_city"],
      pix_payload: settings["pix_payload"],
      allow_pickup: settings["allow_pickup"],
      block_outside_delivery_area: settings["block_outside_delivery_area"],
      block_orders_when_closed: settings["block_orders_when_closed"]
    })
    save_count!(record, "store")
  end

  def import_categories
    array("categories").each do |item|
      record = legacy_find(Category, "categories", item) ||
        @company.categories.find_or_initialize_by(slug: unique_slug(Category, item["slug"] || item["name"]))
      assign_legacy(record, "categories", item)
      record.assign_attributes(
        name: item["name"].presence || "Categoria importada",
        slug: unique_slug(Category, item["slug"] || item["name"], record),
        sort_order: item["sort_order"].to_i,
        is_active: truthy?(item["is_active"], default: true) && item["deleted_at"].blank?
      )
      save_count!(record, "categories")
      @maps[:categories][item["id"].to_s] = record if item["id"].present?
    end
  end

  def import_products
    fallback = nil
    array("products").each do |item|
      category = @maps[:categories][item["category_id"].to_s]
      fallback ||= ensure_fallback_category if category.blank?
      record = legacy_find(Product, "products", item) ||
        @company.products.find_or_initialize_by(slug: unique_slug(Product, item["slug"] || item["name"]))
      assign_legacy(record, "products", item)
      record.assign_attributes(
        category: category || fallback,
        name: item["name"].presence || "Produto importado",
        slug: unique_slug(Product, item["slug"] || item["name"], record),
        description: item["description"],
        price_cents: cents(item["price"]),
        promotional_price_cents: cents(item["promotional_price"]),
        cost_price_cents: cents(item["cost_price"]),
        image_url: item["image_url"],
        is_featured: truthy?(item["is_featured"]),
        is_promotional: truthy?(item["is_promotional"]),
        is_combo: truthy?(item["is_combo"]),
        is_customizable: truthy?(item["is_customizable"]),
        track_inventory: truthy?(item["track_inventory"]),
        sort_order: item["sort_order"].to_i,
        is_active: truthy?(item["is_active"], default: true) && item["deleted_at"].blank?
      )
      save_count!(record, "products")
      @maps[:products][item["id"].to_s] = record if item["id"].present?
    end
  end

  def import_product_option_groups
    has_top_level_items = array("product_option_items").any?
    groups = array("product_option_groups")
    groups += array("products").flat_map { |product| (product["option_groups"] || []).map { |group| group.merge("product_id" => product["id"]) } }
    groups.each do |item|
      product = @maps[:products][item["product_id"].to_s]
      next skip!("product_option_groups") unless product

      record = legacy_find(ProductOptionGroup, "product_option_groups", item) ||
        product.product_option_groups.find_or_initialize_by(name: item["name"].presence || "Opcionais")
      assign_legacy(record, "product_option_groups", item)
      record.assign_attributes(
        company: @company,
        product: product,
        name: item["name"].presence || "Opcionais",
        group_type: item["type"].presence || item["group_type"].presence || "multiple",
        required: truthy?(item["required"]),
        min_select: item["min_select"].to_i,
        max_select: item["max_select"].presence || 1,
        sort_order: item["sort_order"].to_i
      )
      save_count!(record, "product_option_groups")
      @maps[:product_option_groups][item["id"].to_s] = record if item["id"].present?
      import_nested_option_items(record, item["items"]) if !has_top_level_items && item["items"].is_a?(Array)
    end
  end

  def import_product_option_items
    array("product_option_items").each do |item|
      import_option_item(item, @maps[:product_option_groups][item["group_id"].to_s])
    end
  end

  def import_nested_option_items(group, items)
    items.each { |item| import_option_item(item, group) }
  end

  def import_option_item(item, group)
    return skip!("product_option_items") unless group

    record = legacy_find(ProductOptionItem, "product_option_items", item) ||
      group.product_option_items.find_or_initialize_by(name: item["name"].presence || "Opcional")
    assign_legacy(record, "product_option_items", item)
    record.assign_attributes(
      company: @company,
      product_option_group: group,
      name: item["name"].presence || "Opcional",
      additional_price_cents: cents(item["additional_price"]),
      is_active: truthy?(item["is_active"], default: true),
      sort_order: item["sort_order"].to_i
    )
    save_count!(record, "product_option_items")
  end

  def import_app_banners
    array("app_banners").each do |item|
      title = item["titulo"] || item["title"] || "Banner importado"
      record = legacy_find(AppBanner, "app_banners", item) || @company.app_banners.find_or_initialize_by(title: title)
      assign_legacy(record, "app_banners", item)
      record.assign_attributes(title: title, image_url: item["imagem"] || item["image_url"] || item["url"], link_url: item["link"] || item["link_url"], is_active: truthy?(item["ativo"], default: truthy?(item["is_active"], default: true)), sort_order: (item["ordem"] || item["sort_order"]).to_i)
      save_count!(record, "app_banners")
    end
  end

  def import_delivery_zones
    array("delivery_zones").each do |item|
      record = legacy_find(DeliveryZone, "delivery_zones", item) || @company.delivery_zones.find_or_initialize_by(slug: unique_slug(DeliveryZone, item["slug"] || item["name"]))
      assign_legacy(record, "delivery_zones", item)
      record.assign_attributes(name: item["name"].presence || "Area importada", slug: unique_slug(DeliveryZone, item["slug"] || item["name"], record), city: item["city"], aliases: item["aliases"], delivery_fee_cents: cents(item["delivery_fee"]), estimated_minutes: minutes(item["estimated_time"]), minimum_order_cents: cents(item["minimum_order_amount"]), match_priority: item["match_priority"].to_i, is_active: truthy?(item["is_active"], default: true))
      save_count!(record, "delivery_zones")
      @maps[:delivery_zones][item["id"].to_s] = record if item["id"].present?
    end
  end

  def import_business_hours
    array("business_hours").each do |item|
      day = item["day_of_week"].to_i
      record = @company.business_hours.find_or_initialize_by(day_of_week: day)
      assign_legacy(record, "business_hours", item)
      record.assign_attributes(is_open: truthy?(item["is_open"], default: true), open_time: item["open_time"], close_time: item["close_time"], break_start: item["break_start"], break_end: item["break_end"], closed_message: item["closed_message"])
      save_count!(record, "business_hours")
    end
  end

  def import_customers
    array("customers").each do |item|
      phone = normalize_phone(item["phone"] || item["whatsapp"] || item["normalized_phone"])
      record = legacy_find(Customer, "customers", item) || @company.customers.where(phone: phone).first || @company.customers.new
      assign_legacy(record, "customers", item)
      record.assign_attributes(full_name: item["full_name"] || item["name"] || "Cliente importado", phone: phone, whatsapp: normalize_phone(item["whatsapp"] || phone), email: item["email"], total_orders: item["total_orders"].to_i, total_spent_cents: cents(item["total_spent"]), is_recurring: truthy?(item["is_recurring"]), first_order_at: item["first_order_at"], last_order_at: item["last_order_at"], last_marketing_sent_at: item["last_marketing_sent_at"], notes: item["notes"])
      save_count!(record, "customers")
      @maps[:customers][item["id"].to_s] = record if item["id"].present?
    end
  end

  def import_customer_addresses
    array("customer_addresses").each do |item|
      customer = @maps[:customers][item["customer_id"].to_s]
      next skip!("customer_addresses") unless customer

      record = legacy_find(CustomerAddress, "customer_addresses", item) || customer.customer_addresses.new
      assign_legacy(record, "customer_addresses", item)
      record.assign_attributes(company: @company, customer: customer, zip_code: item["cep"] || item["zip_code"], street: item["street"], number: item["number"], complement: item["complement"], neighborhood: item["neighborhood"], city: item["city"], state: item["state"], reference: item["reference"], is_default: truthy?(item["is_default"]))
      save_count!(record, "customer_addresses")
    end
  end

  def import_motoboys
    array("motoboys").each do |item|
      record = legacy_find(Motoboy, "motoboys", item) || @company.motoboys.where(phone: normalize_phone(item["phone"])).first || @company.motoboys.new
      assign_legacy(record, "motoboys", item)
      record.assign_attributes(name: item["name"].presence || "Motoboy importado", phone: normalize_phone(item["phone"]), active: truthy?(item["active"], default: true) && item["deleted_at"].blank?, total_deliveries: item["total_deliveries"].to_i, notes: item["notes"])
      save_count!(record, "motoboys")
      @maps[:motoboys][item["id"].to_s] = record if item["id"].present?
    end
  end

  def import_coupons
    array("coupons").each do |item|
      code = item["code"].presence || "IMPORTADO#{item["id"]}"
      record = legacy_find(Coupon, "coupons", item) || @company.coupons.find_or_initialize_by(code: code)
      assign_legacy(record, "coupons", item)
      record.assign_attributes(code: code, title: item["title"].presence || code, description: item["description"], discount_type: item["discount_type"].presence || "fixed", discount_value: item["discount_value"].to_f, minimum_order_cents: cents(item["minimum_order_amount"]), max_uses: item["max_uses"], used_count: item["used_count"].to_i, starts_at: item["starts_at"], expires_at: item["expires_at"], is_active: truthy?(item["is_active"], default: true), is_single_use_per_customer: truthy?(item["is_single_use_per_customer"]), customer: @maps[:customers][item["customer_id"].to_s], source: item["source"].presence || "manual", metadata_json: { imported_source_id: item["source_id"] }.compact)
      save_count!(record, "coupons")
      @maps[:coupons][item["id"].to_s] = record if item["id"].present?
    end
  end

  def import_wheel_prizes
    array("wheel_prizes").each do |item|
      record = @company.wheel_prizes.find_or_initialize_by(name: item["name"].presence || "Premio importado")
      record.assign_attributes(description: item["description"], prize_type: item["prize_type"].presence || "discount", discount_value: item["discount_value"].to_f, probability_weight: item["probability_weight"].to_f, coupon_valid_days: item["coupon_valid_days"].presence || 7, minimum_order_cents: cents(item["minimum_order_amount"]), max_total_wins: item["max_total_wins"], current_wins: item["current_wins"].to_i, badge: item["badge"], color: item["color"], sort_order: item["sort_order"].to_i, is_active: truthy?(item["is_active"], default: true))
      save_count!(record, "wheel_prizes")
      @maps[:wheel_prizes][item["id"].to_s] = record if item["id"].present?
    end
  end

  def import_wheel_spins
    array("wheel_spins").each do |item|
      customer = @maps[:customers][item["customer_id"].to_s]
      next skip!("wheel_spins") unless customer

      source_id = item["id"].to_s
      record = @company.wheel_spins.where("metadata_json ->> 'imported_source_id' = ?", source_id).first ||
        @company.wheel_spins.new
      status = WheelSpin::STATUSES.include?(item["status"].to_s) ? item["status"].to_s : "available"
      metadata = record.metadata_json.to_h.merge(
        "imported_source_id" => source_id,
        "legacy_prize_snapshot" => item["prize_snapshot"]
      ).compact

      record.assign_attributes(
        company: @company,
        customer: customer,
        wheel_prize: @maps[:wheel_prizes][item["prize_id"].to_s],
        coupon: @maps[:coupons][item["coupon_id"].to_s],
        status: status,
        source: item["source"].presence || "imported_backup",
        order_spin_number: item["order_spin_number"],
        used_at: item["used_at"],
        expires_at: item["expires_at"],
        created_at: item["created_at"] || record.created_at || Time.current,
        updated_at: item["updated_at"] || Time.current,
        metadata_json: metadata
      )
      save_count!(record, "wheel_spins")
    end
  end

  def import_orders
    array("orders").each do |item|
      customer = @maps[:customers][item["customer_id"].to_s]
      record = legacy_find(Order, "orders", item) || @company.orders.new
      was_new = record.new_record?
      assign_legacy(record, "orders", item)
      record.assign_attributes(
        company: @company,
        customer: customer,
        delivery_zone: @maps[:delivery_zones][item["delivery_zone_id"].to_s],
        motoboy: @maps[:motoboys][item["motoboy_id"].to_s],
        coupon: @maps[:coupons][item["coupon_id"].to_s],
        customer_name: item["customer_name"].presence || customer&.full_name,
        customer_phone: normalize_phone(item["customer_phone"] || customer&.phone),
        customer_whatsapp: normalize_phone(item["customer_whatsapp"] || item["customer_phone"] || customer&.whatsapp),
        zip_code: item["zip_code"],
        street: item["street"],
        number: item["number"],
        complement: item["complement"],
        neighborhood: item["neighborhood"],
        city: item["city"],
        state: item["state"],
        reference: item["reference"],
        coupon_code: item["coupon_code"],
        order_type: normalized_order_type(item["order_type"]),
        payment_method: normalized_payment_method(item["payment_method"]),
        payment_status: normalized_payment_status(item["payment_status"]),
        delivery_status: normalized_delivery_status(item["delivery_status"]),
        status: normalized_order_status(item["status"]),
        subtotal_cents: cents(item["subtotal"]) || 0,
        delivery_fee_cents: cents(item["delivery_fee"]) || 0,
        discount_cents: cents(item["discount_amount"]) || 0,
        total_cents: cents(item["total"]) || 0,
        needs_change: truthy?(item["needs_change"]),
        change_for_cents: cents(item["change_for"] || item["change_amount"]),
        notes: item["notes"],
        accepted_at: item["accepted_at"],
        preparing_at: item["preparing_at"],
        ready_at: item["ready_at"],
        out_for_delivery_at: item["out_for_delivery_at"],
        completed_at: item["completed_at"],
        cancelled_at: item["cancelled_at"],
        paid_at: item["paid_at"],
        financial_recorded_at: item["financial_recorded_at"],
        inventory_deducted: truthy?(item["inventory_deducted"] || item["stock_deducted"]),
        inventory_deducted_at: item["inventory_deducted_at"],
        inventory_restored: truthy?(item["inventory_restored"] || item["stock_reverted"]),
        inventory_restored_at: item["inventory_restored_at"],
        delivery_latitude: item["delivery_latitude"],
        delivery_longitude: item["delivery_longitude"],
        delivery_location_source: item["delivery_location_source"],
        delivery_location_received_at: item["delivery_location_received_at"],
        google_maps_url: item["google_maps_url"],
        waze_url: item["waze_url"],
        created_at: item["created_at"] || record.created_at || Time.current,
        updated_at: item["updated_at"] || Time.current
      )
      save_count!(record, "orders")
      preserve_order_number(record, item["order_number"]) if was_new
      @maps[:orders][item["id"].to_s] = record if item["id"].present?
    end
  end

  def ensure_order_counter!
    max_order_number = [
      @company.orders.maximum(:order_number).to_i,
      array("orders").map { |item| item["order_number"].to_i }.max.to_i
    ].max
    return if max_order_number <= @company.store_order_counter.to_i

    @company.update_column(:store_order_counter, max_order_number)
  end

  def import_order_items
    array("order_items").each do |item|
      order = @maps[:orders][item["order_id"].to_s]
      next skip!("order_items") unless order

      record = legacy_find(OrderItem, "order_items", item) || order.order_items.new
      assign_legacy(record, "order_items", item)
      status = OrderItem::STATUSES.include?(item["status"].to_s) ? item["status"].to_s : "active"
      record.assign_attributes(
        company: @company,
        order: order,
        product: @maps[:products][item["product_id"].to_s],
        product_name: item["product_name"].presence || "Produto importado",
        quantity: item["quantity"].presence || 1,
        unit_price_cents: cents(item["unit_price"]) || 0,
        total_price_cents: cents(item["total_price"]) || 0,
        unit_cost_cents: cents(item["unit_cost_at_sale"]) || 0,
        total_cost_cents: cents(item["total_cost_at_sale"]) || 0,
        selected_options: item["selected_options"].is_a?(Array) ? item["selected_options"] : [],
        notes: item["notes"],
        status: status,
        sent_to_kitchen_at: item["sent_to_kitchen_at"],
        cancelled_at: item["cancelled_at"],
        created_at: item["created_at"] || record.created_at || Time.current,
        updated_at: item["updated_at"] || Time.current
      )
      save_count!(record, "order_items")
    end
  end

  def import_order_status_history
    array("order_status_history").each do |item|
      order = @maps[:orders][item["order_id"].to_s]
      next skip!("order_status_history") unless order

      record = legacy_find(OrderStatusLog, "order_status_history", item) || order.order_status_logs.new
      assign_legacy(record, "order_status_history", item)
      record.assign_attributes(
        company: @company,
        order: order,
        previous_status: normalized_order_status(item["previous_status"], allow_blank: true),
        new_status: normalized_order_status(item["new_status"]),
        created_at: item["created_at"] || record.created_at || Time.current,
        updated_at: item["created_at"] || record.updated_at || Time.current
      )
      save_count!(record, "order_status_history")
    end
  end

  def import_deliveries
    array("deliveries").each do |item|
      order = @maps[:orders][item["order_id"].to_s]
      motoboy = @maps[:motoboys][item["motoboy_id"].to_s]
      next skip!("deliveries") unless order && motoboy

      record = legacy_find(DeliveryHistory, "deliveries", item) || order.delivery_history || order.build_delivery_history
      assign_legacy(record, "deliveries", item)
      status = DeliveryHistory::STATUSES.include?(item["status"].to_s) ? item["status"].to_s : "assigned"
      record.assign_attributes(
        company: @company,
        order: order,
        motoboy: motoboy,
        status: status,
        notes: item["notes"],
        assigned_at: item["assigned_at"] || item["created_at"] || record.assigned_at || Time.current,
        delivered_at: item["delivered_at"],
        created_at: item["created_at"] || record.created_at || Time.current,
        updated_at: item["updated_at"] || Time.current
      )
      save_count!(record, "deliveries")
    end
  end

  def import_inventory_items
    array("inventory_items").each do |item|
      record = legacy_find(InventoryItem, "inventory_items", item) || @company.inventory_items.find_or_initialize_by(slug: unique_slug(InventoryItem, item["slug"] || item["name"]))
      assign_legacy(record, "inventory_items", item)
      record.assign_attributes(name: item["name"].presence || "Item importado", slug: unique_slug(InventoryItem, item["slug"] || item["name"], record), unit: item["unit"].presence || "un", category: item["category"] || item["stock_category"], current_quantity: item["current_quantity"].to_f, minimum_quantity: item["minimum_quantity"].to_f, cost_price: item["cost_price"].to_f, is_active: truthy?(item["is_active"], default: true), notes: item["notes"])
      save_count!(record, "inventory_items")
    end
  end

  def import_dining_tables
    array("dining_tables").each do |item|
      number = item["number"].presence || item["name"].presence || item["id"].to_s
      record = legacy_find(DiningTable, "dining_tables", item) || @company.dining_tables.find_or_initialize_by(number: number)
      assign_legacy(record, "dining_tables", item)
      status = DiningTable::STATUSES.include?(item["status"].to_s) ? item["status"] : "available"
      record.assign_attributes(number: number, name: item["name"], slug: item["slug"], seats: item["seats"].presence || 4, status: status, is_active: truthy?(item["active"], default: truthy?(item["is_active"], default: true)), sort_order: item["sort_order"].to_i, notes: item["notes"], qr_enabled: truthy?(item["qr_enabled"], default: true), qr_generated_at: item["qr_generated_at"], qr_updated_at: item["qr_updated_at"])
      save_count!(record, "dining_tables")
      @maps[:dining_tables][item["id"].to_s] = record if item["id"].present?
    end
  end

  def legacy_find(klass, table, item)
    return nil if item["id"].blank?
    klass.where(company_id: @company.id, legacy_source: LEGACY_SOURCE, legacy_table: table, legacy_id: item["id"].to_s).first
  end

  def assign_legacy(record, table, item)
    assign_if_column(record, legacy_id: item["id"].to_s, legacy_source: LEGACY_SOURCE, legacy_table: table)
  end

  def assign_if_column(record, attrs)
    attrs.each { |key, value| record.public_send("#{key}=", value) if value != nil && record.has_attribute?(key) }
  end

  def save_count!(record, key)
    was_new = record.new_record?
    record.save!
    @summary[was_new ? :imported : :updated][key] += 1
  end

  def skip!(key)
    @summary[:skipped][key] += 1
    nil
  end

  def cents(value)
    return nil if value.nil?
    (value.to_s.tr(",", ".").to_f * 100).round
  end

  def minutes(value)
    value.to_s[/\d+/].to_i.positive? ? value.to_s[/\d+/].to_i : 30
  end

  def normalize_phone(value)
    digits = value.to_s.gsub(/\D/, "")
    digits = "55#{digits}" if digits.length.between?(10, 11)
    digits
  end

  def truthy?(value, default: false)
    return default if value.nil?
    [true, 1, "1", "true", "t", "yes", "sim", "active", "ativo"].include?(value)
  end

  def unique_slug(klass, raw, record = nil)
    base = raw.to_s.parameterize.presence || "importado"
    slug = base
    count = 2
    scope = klass.where(company_id: @company.id, slug: slug)
    while scope.where.not(id: record&.id).exists?
      slug = "#{base}-#{count}"
      count += 1
      scope = klass.where(company_id: @company.id, slug: slug)
    end
    slug
  end

  def ensure_fallback_category
    category = @company.categories.find_or_initialize_by(slug: "importados")
    category.assign_attributes(name: "Importados", sort_order: 999, is_active: true)
    category.save!
    category
  end

  def normalized_order_type(value)
    map = { "retirada" => "pickup", "pickup" => "pickup", "mesa" => "dine_in", "dine_in" => "dine_in" }
    normalized = map[value.to_s] || value.to_s
    Order::ORDER_TYPES.include?(normalized) ? normalized : "delivery"
  end

  def normalized_order_status(value, allow_blank: false)
    return nil if allow_blank && value.blank?
    normalized = value.to_s == "canceled" ? "cancelled" : value.to_s
    Order::STATUSES.include?(normalized) ? normalized : "pending"
  end

  def normalized_payment_method(value)
    map = {
      "cash" => "money",
      "dinheiro" => "money",
      "card" => "card_on_delivery",
      "cartao" => "card_on_delivery",
      "card_on_delivery" => "card_on_delivery",
      "pix" => "pix"
    }
    normalized = map[value.to_s] || value.to_s
    Order::PAYMENT_METHODS.include?(normalized) ? normalized : "money"
  end

  def normalized_payment_status(value)
    normalized = value.to_s == "approved" ? "paid" : value.to_s
    Order::PAYMENT_STATUSES.include?(normalized) ? normalized : "pending"
  end

  def normalized_delivery_status(value)
    normalized = value.to_s == "completed" ? "delivered" : value.to_s
    DeliveryHistory::STATUSES.include?(normalized) || normalized == "pending" ? normalized : "pending"
  end

  def preserve_order_number(record, legacy_number)
    number = legacy_number.to_i
    return if number <= 0
    return if @company.orders.where(order_number: number).where.not(id: record.id).exists?

    record.update_column(:order_number, number)
  end
end
