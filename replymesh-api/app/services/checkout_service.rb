# CheckoutService
#
# Responsável pela criação segura de pedidos públicos com validações de anti-abuso.
# Equivalente à Edge Function `create-public-order` do Supabase.
#
# Uso:
#   result = CheckoutService.call(company: company, params: checkout_params, ip: request.remote_ip)
#   result.success?  # true/false
#   result.order     # Order criado
#   result.errors    # array de erros se falhar
#
# Anti-abuso implementado:
#   - 5 pedidos por telefone a cada 10 minutos
#   - 10 pedidos por IP a cada 10 minutos
#   - Janela de duplicata de 90 segundos (mesmo telefone + mesmo total)
#
class CheckoutService
  PHONE_RATE_LIMIT_COUNT   = 5
  PHONE_RATE_LIMIT_MINUTES = 10
  IP_RATE_LIMIT_COUNT      = 10
  IP_RATE_LIMIT_MINUTES    = 10
  DUPLICATE_WINDOW_SECONDS = 90

  Result = Struct.new(:success, :order, :errors, keyword_init: true) do
    def success? = success
  end

  def self.call(company:, params:, ip: nil)
    new(company: company, params: params, ip: ip).call
  end

  def initialize(company:, params:, ip: nil)
    @company = company
    @params  = params
    @ip      = ip
  end

  def call
    return Result.new(success: false, errors: ["Loja fechada no momento"]) if store_closed_for_orders?

    calculated = calculate_order_totals

    validation_errors = validate_rate_limits(calculated[:total_cents])
    return Result.new(success: false, errors: validation_errors) if validation_errors.any?

    order = nil

    ActiveRecord::Base.transaction do
      customer = upsert_customer
      upsert_customer_address(customer) if delivery_order?
      order    = create_order(customer, calculated)
      create_order_items(order, calculated[:items])
      apply_coupon(order, calculated[:coupon]) if calculated[:coupon]
      order.reload
    end

    record_attempt("created", order)
    dispatch_order_received(order)
    Result.new(success: true, order: order)
  rescue ActiveRecord::RecordInvalid => e
    record_attempt("blocked", nil, reason: e.message)
    Result.new(success: false, errors: [e.record.errors.full_messages.join(", ")])
  rescue StandardError => e
    Rails.logger.error("CheckoutService error: #{e.class} #{e.message}")
    Result.new(success: false, errors: ["Erro interno ao processar pedido"])
  end

  private

  def store_closed_for_orders?
    settings = @company.store_setting
    settings&.block_orders_when_closed? && settings.store_status == "closed"
  end

  # ─── Validações de anti-abuso ────────────────────────────────────────────────

  def validate_rate_limits(total_cents)
    return [] if skip_rate_limits_for_local_tests?

    errors = []
    phone  = @params.dig(:customer, :phone).to_s

    # Rate limit por telefone
    phone_recent = OrderAttempt.recent_by_phone(@company.id, phone, PHONE_RATE_LIMIT_MINUTES).count
    if phone_recent >= PHONE_RATE_LIMIT_COUNT
      errors << "Limite de pedidos atingido. Tente novamente em #{PHONE_RATE_LIMIT_MINUTES} minutos."
      record_attempt("rate_limited", nil, reason: "phone_rate_limit")
    end

    # Rate limit por IP
    if @ip.present?
      ip_recent = OrderAttempt.recent_by_ip(@company.id, @ip, IP_RATE_LIMIT_MINUTES).count
      if ip_recent >= IP_RATE_LIMIT_COUNT
        errors << "Muitas tentativas. Tente novamente em breve."
        record_attempt("rate_limited", nil, reason: "ip_rate_limit")
      end
    end

    # Janela de duplicata
    if duplicate_order_exists?(phone, total_cents)
      errors << "Pedido duplicado detectado. Aguarde #{DUPLICATE_WINDOW_SECONDS} segundos."
      record_attempt("duplicate", nil, reason: "duplicate_window")
    end

    errors
  end

  def calculate_order_totals
    items = Array(@params[:items]).map { |item_params| calculate_item(item_params) }
    raise ActiveRecord::RecordInvalid.new(Order.new.tap { |o| o.errors.add(:base, "Carrinho vazio") }) if items.empty?

    subtotal_cents = items.sum { |item| item[:total_price_cents] }
    delivery_fee_cents = calculate_delivery_fee_cents
    coupon = find_coupon
    discount_cents = calculate_coupon_discount_cents(coupon, subtotal_cents, delivery_fee_cents)

    {
      items: items,
      subtotal_cents: subtotal_cents,
      delivery_fee_cents: delivery_fee_cents,
      discount_cents: discount_cents,
      total_cents: [subtotal_cents + delivery_fee_cents - discount_cents, 0].max,
      coupon: coupon
    }
  end

  def calculate_item(item_params)
    product = Product.for_company(@company.id)
                     .includes(product_option_groups: :product_option_items)
                     .active
                     .find_by(id: item_params[:product_id])

    raise ActiveRecord::RecordInvalid.new(OrderItem.new.tap { |i| i.errors.add(:product, "invalido") }) unless product

    quantity = [item_params[:quantity].to_i, 1].max
    selected_options = normalize_selected_options(item_params[:selected_options])
    additional_cents = calculate_additional_cents(product, selected_options)
    unit_price_cents = product.promotional_price_cents.presence || product.price_cents
    final_unit_price_cents = unit_price_cents.to_i + additional_cents

    {
      product: product,
      product_name: product.name,
      quantity: quantity,
      unit_price_cents: final_unit_price_cents,
      total_price_cents: final_unit_price_cents * quantity,
      selected_options: selected_options,
      notes: item_params[:notes]
    }
  end

  def normalize_selected_options(selected_options)
    Array(selected_options).map do |group|
      {
        group_name: group[:group_name] || group["group_name"] || group[:name] || group["name"],
        options: Array(group[:options] || group["options"]).map { |option|
          option.is_a?(Hash) ? (option[:name] || option["name"]) : option
        }.compact
      }
    end.select { |group| group[:group_name].present? && group[:options].any? }
  end

  def calculate_additional_cents(product, selected_options)
    selected_options.sum do |group|
      option_group = product.product_option_groups.find { |g| g.name == group[:group_name] }
      next 0 unless option_group

      group[:options].sum do |option_name|
        option_group.product_option_items.active.find { |item| item.name == option_name }&.additional_price_cents.to_i
      end
    end
  end

  def calculate_delivery_fee_cents
    return 0 unless delivery_order?

    zone_id = @params[:delivery_zone_id].presence
    zone = @company.delivery_zones.active.find_by(id: zone_id) if zone_id
    return zone.delivery_fee_cents.to_i if zone

    @company.store_setting&.default_delivery_fee_cents.to_i
  end

  def duplicate_order_exists?(phone, total_cents)
    Order.for_company(@company.id)
         .where(customer_phone: phone)
         .where(total_cents: total_cents)
         .where("created_at >= ?", DUPLICATE_WINDOW_SECONDS.seconds.ago)
         .where(status: %w[pending accepted preparing])
         .exists?
  end

  def skip_rate_limits_for_local_tests?
    return false unless Rails.env.development?
    return false if ENV["REPLYMESH_ENFORCE_CHECKOUT_RATE_LIMITS"].to_s == "true"

    @company.slug.in?(%w[demohamburgueria empresa-teste])
  end

  # ─── Criação dos registros ───────────────────────────────────────────────────

  def upsert_customer
    phone = @params.dig(:customer, :phone).to_s.gsub(/\D/, "")
    Customer.find_or_initialize_by(company: @company, phone: phone).tap do |c|
      c.full_name = @params.dig(:customer, :full_name).presence || c.full_name || "Cliente"
      c.whatsapp  = @params.dig(:customer, :whatsapp)  || phone
      c.email     = @params.dig(:customer, :email)
      c.save!
    end
  end

  def upsert_customer_address(customer)
    attrs = {
      zip_code:     @params.dig(:address, :zip_code),
      street:       @params.dig(:address, :street),
      number:       @params.dig(:address, :number),
      complement:   @params.dig(:address, :complement),
      neighborhood: @params.dig(:address, :neighborhood),
      city:         @params.dig(:address, :city),
      state:        @params.dig(:address, :state),
      reference:    @params.dig(:address, :reference)
    }

    return if attrs[:street].blank? && attrs[:number].blank?

    CustomerAddress.find_or_initialize_by(
      company: customer.company,
      customer: customer,
      street: attrs[:street],
      number: attrs[:number]
    ).tap do |address|
      address.assign_attributes(attrs.merge(is_default: customer.customer_addresses.none?))
      address.save!
    end
  end

  def create_order(customer, calculated)
    Order.create!(
      company:          @company,
      customer:         customer,
      customer_name:    customer.full_name,
      customer_phone:   customer.phone,
      customer_whatsapp: customer.whatsapp,
      order_type:       @params[:order_type]     || "delivery",
      payment_method:   @params[:payment_method] || "money",
      delivery_zone_id: @params[:delivery_zone_id],
      subtotal_cents:   calculated[:subtotal_cents],
      delivery_fee_cents: calculated[:delivery_fee_cents],
      discount_cents:   calculated[:discount_cents],
      total_cents:      calculated[:total_cents],
      change_for_cents: @params[:change_for_cents],
      needs_change:     ActiveModel::Type::Boolean.new.cast(@params[:needs_change]),
      zip_code:         @params.dig(:address, :zip_code),
      street:           @params.dig(:address, :street),
      number:           @params.dig(:address, :number),
      complement:       @params.dig(:address, :complement),
      neighborhood:     @params.dig(:address, :neighborhood),
      city:             @params.dig(:address, :city),
      state:            @params.dig(:address, :state),
      reference:        @params.dig(:address, :reference),
      notes:            @params[:notes]
    )
  end

  def create_order_items(order, items)
    items.each do |item|
      order.order_items.create!(
        company:        @company,
        product:        item[:product],
        product_name:   item[:product_name],
        unit_price_cents: item[:unit_price_cents],
        quantity:       item[:quantity],
        total_price_cents: item[:total_price_cents],
        selected_options: item[:selected_options],
        notes:          item[:notes]
      )
    end
  end

  def delivery_order?
    (@params[:order_type].presence || "delivery") == "delivery"
  end

  def find_coupon
    return nil if @params[:coupon_code].blank?

    coupon = Coupon.for_company(@company.id).valid_now.find_by(code: @params[:coupon_code].to_s.upcase)
    return nil if coupon.blank? || coupon.exhausted?
    return nil if coupon.customer_id.present? && !customer_coupon_matches?(coupon)
    return nil if coupon.is_single_use_per_customer? && coupon_already_used_by_phone?(coupon)

    coupon
  end

  def customer_coupon_matches?(coupon)
    phone = @params.dig(:customer, :phone).to_s.gsub(/\D/, "")
    customer = @company.customers.find_by(id: coupon.customer_id)
    return false unless customer

    customer_phone = customer.phone.to_s.gsub(/\D/, "")
    customer_phone == phone ||
      customer_phone.last(11) == phone.last(11) ||
      customer_phone.last(10) == phone.last(10)
  end

  def coupon_already_used_by_phone?(coupon)
    phone = @params.dig(:customer, :phone).to_s.gsub(/\D/, "")
    return false if phone.blank?

    @company.orders.where(coupon_id: coupon.id, customer_phone: phone).where.not(status: "cancelled").exists?
  end

  def calculate_coupon_discount_cents(coupon, subtotal_cents, delivery_fee_cents)
    return 0 unless coupon
    return 0 if subtotal_cents < coupon.minimum_order_cents.to_i

    case coupon.discount_type
    when "percentage"
      (subtotal_cents * coupon.discount_value.to_d / 100).round.to_i
    when "fixed"
      [(coupon.discount_value.to_d * 100).round.to_i, subtotal_cents].min
    when "free_shipping"
      delivery_fee_cents
    when "free_item"
      0
    else
      0
    end
  end

  def apply_coupon(order, coupon)
    order.update!(coupon: coupon, coupon_code: coupon.code)
    coupon.increment_usage!
  end

  def record_attempt(status, order, reason: nil)
    OrderAttempt.create!(
      company:         @company,
      customer_phone:  @params.dig(:customer, :phone).to_s,
      ip_address:      @ip,
      status:          status,
      reason:          reason,
      order:           order
    )
  rescue StandardError
    nil # não quebrar o fluxo por falha de audit log
  end
  def dispatch_order_received(order)
    WhatsappStatusDispatcher.call(order: order, status: "pending")
  rescue StandardError => e
    Rails.logger.warn("CheckoutService WhatsApp pending dispatch failed: #{e.class} #{e.message}")
    nil
  end
end
