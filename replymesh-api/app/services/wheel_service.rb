class WheelService
  CENTS_PER_SPIN = 2_500
  SPIN_TTL_DAYS = 30

  Result = Struct.new(:success, :payload, :message, keyword_init: true) do
    def success? = success
  end

  def self.grant_for_order(order)
    new(company: order.company).grant_for_order(order)
  end

  def self.spin(company:, phone:)
    new(company: company).spin(phone: phone)
  end

  def initialize(company:)
    @company = company
  end

  def grant_for_order(order)
    return Result.new(success: true, payload: { created: 0, eligible_spins: 0 }, message: "Pedido ainda nao finalizado") unless order.completed?
    return Result.new(success: true, payload: { created: 0, eligible_spins: 0 }, message: "Pedido sem cliente") unless order.customer

    eligible_spins = (order.subtotal_cents.to_i / CENTS_PER_SPIN).floor
    return Result.new(success: true, payload: { created: 0, eligible_spins: 0 }, message: "Pedido abaixo do minimo de R$ 25 para giro") if eligible_spins < 1

    created = 0
    (1..eligible_spins).each do |spin_number|
      spin = WheelSpin.find_or_initialize_by(order: order, order_spin_number: spin_number)
      next unless spin.new_record?

      spin.assign_attributes(
        company: @company,
        customer: order.customer,
        status: "available",
        source: "order_completed",
        expires_at: SPIN_TTL_DAYS.days.from_now
      )
      spin.save!
      created += 1
    end

    Result.new(
      success: true,
      payload: { created: created, eligible_spins: eligible_spins },
      message: created.positive? ? "Giros liberados" : "Pedido ja liberou todos os giros"
    )
  end

  def spin(phone:)
    customer = find_customer_by_phone(phone)
    return Result.new(success: false, message: "Cliente nao encontrado", payload: {}) unless customer

    spin = customer.wheel_spins.for_company(@company.id).available.order(:created_at).first
    return Result.new(success: false, message: "Nenhum giro disponivel", payload: {}) unless spin

    prize = pick_prize
    return Result.new(success: false, message: "Nenhum premio ativo na roleta", payload: {}) unless prize

    coupon = nil
    ActiveRecord::Base.transaction do
      prize.lock!
      coupon = create_coupon_for_prize(customer, spin, prize) unless prize.prize_type == "no_prize"
      prize.increment!(:current_wins) unless prize.prize_type == "no_prize"
      spin.update!(
        status: "used",
        used_at: Time.current,
        wheel_prize: prize,
        coupon: coupon,
        metadata_json: spin.metadata_json.merge("prize_name" => prize.name)
      )
    end

    Result.new(
      success: true,
      message: prize.prize_type == "no_prize" ? "Nao foi dessa vez" : "Premio liberado",
      payload: {
        prize: serialize_prize(prize),
        coupon: coupon && serialize_coupon(coupon),
        spin: serialize_spin(spin.reload),
        remaining_spins: customer.wheel_spins.for_company(@company.id).available.count
      }
    )
  end

  def profile(phone:)
    customer = find_customer_by_phone(phone, includes: [:customer_addresses, :orders])
    return { found: false, customer: nil, wheel_spins: { available: 0, used: 0 }, coupons: [] } unless customer

    coupons = @company.coupons.valid_now
                      .where("customer_id IS NULL OR customer_id = ?", customer.id)
                      .order(created_at: :desc)
                      .limit(10)
                      .reject(&:exhausted?)

    {
      found: true,
      customer: serialize_customer(customer),
      wheel_spins: {
        available: customer.wheel_spins.for_company(@company.id).available.count,
        used: customer.wheel_spins.for_company(@company.id).used.count
      },
      addresses: customer.customer_addresses.default_first.limit(10).map { |address| serialize_address(address) },
      orders: customer.orders.for_company(@company.id).recent.limit(10).map { |order| serialize_order(order) },
      coupons: coupons.map { |coupon| serialize_coupon(coupon) }
    }
  end

  def public_prizes
    @company.wheel_prizes.active.canonical_order.map { |prize| serialize_prize(prize) }
  end

  def promotion_active?
    FeatureGate.enabled?(@company, "roulette") &&
      @company.wheel_prizes.available.where("probability_weight > 0").exists?
  end

  def admin_summary
    spins = @company.wheel_spins
    coupon_spins = spins.joins(:coupon)
    {
      available_spins: spins.available.count,
      used_spins: spins.used.count,
      total_spins: spins.count,
      generated_coupons: coupon_spins.count,
      used_coupons: coupon_spins.where("coupons.used_count > 0").count,
      prizes: @company.wheel_prizes.canonical_order.map { |prize| serialize_prize(prize) },
      recent_spins: admin_spin_history(per_page: 10)[:spins]
    }
  end

  def admin_spin_history(filters = {})
    page = [filters[:page].presence.to_i, 1].max
    per_page = filters[:per_page].presence.to_i
    per_page = 20 unless per_page.positive?
    per_page = per_page.clamp(1, 100)

    scope = @company.wheel_spins.includes(:customer, :order, :wheel_prize, :coupon).recent
    scope = scope.where(status: filters[:status]) if filters[:status].present?
    scope = scope.where(wheel_prize_id: filters[:prize_id]) if filters[:prize_id].present?
    scope = scope.where("created_at >= ?", Time.zone.parse(filters[:start_date].to_s)) if filters[:start_date].present?
    scope = scope.where("created_at <= ?", Time.zone.parse(filters[:end_date].to_s).end_of_day) if filters[:end_date].present?
    if filters[:search].present?
      term = "%#{filters[:search]}%"
      scope = scope.joins(:customer).where("customers.full_name ILIKE ? OR customers.phone ILIKE ?", term, term)
    end

    total_count = scope.count
    total_pages = (total_count.to_f / per_page).ceil
    records = scope.offset((page - 1) * per_page).limit(per_page)

    {
      spins: records.map { |spin| serialize_admin_spin(spin) },
      pagination: {
        page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: total_pages
      },
      summary: {
        filtered_spins: total_count,
        filtered_coupons: scope.where.not(coupon_id: nil).count,
        filtered_used_coupons: scope.joins(:coupon).where("coupons.used_count > 0").count,
        filtered_no_prize: scope.where(status: "used", coupon_id: nil).count
      }
    }
  end

  private

  def pick_prize
    prizes = @company.wheel_prizes.available.where("probability_weight > 0").canonical_order.to_a
    total_weight = prizes.sum(&:probability_weight)
    return nil if total_weight <= 0

    pick = rand(total_weight) + 1
    prizes.each do |prize|
      pick -= prize.probability_weight
      return prize if pick <= 0
    end
  end

  def create_coupon_for_prize(customer, spin, prize)
    @company.coupons.create!(
      customer: customer,
      code: unique_coupon_code(customer, spin),
      title: "Premio da roleta - #{prize.name}",
      description: prize.description,
      discount_type: prize.coupon_discount_type,
      discount_value: prize.discount_value,
      minimum_order_cents: prize.minimum_order_cents,
      max_uses: 1,
      starts_at: Time.current,
      expires_at: 7.days.from_now,
      is_active: true,
      is_single_use_per_customer: true,
      source: "wheel",
      metadata_json: { wheel_spin_id: spin.id, wheel_prize_id: prize.id }
    )
  end

  def unique_coupon_code(customer, spin)
    suffix = "#{customer.id.to_s.last(4)}#{spin.id.to_s.last(4)}".upcase
    code = "ROLETA#{suffix}"
    while @company.coupons.exists?(code: code)
      code = "ROLETA#{SecureRandom.alphanumeric(8).upcase}"
    end
    code
  end

  def serialize_customer(customer)
    {
      id: customer.id,
      full_name: customer.full_name,
      name: customer.full_name,
      phone: customer.phone,
      whatsapp: customer.whatsapp.presence || customer.phone,
      total_orders: customer.total_orders,
      total_spent: customer.total_spent_cents.to_i / 100.0,
      total_spent_cents: customer.total_spent_cents,
      last_order_at: customer.last_order_at
    }
  end

  def serialize_address(address)
    address.as_json(
      only: %i[id zip_code street number complement neighborhood city state reference is_default]
    ).merge(cep: address.zip_code)
  end

  def serialize_order(order)
    {
      id: order.public_token.presence || order.id,
      order_number: order.order_number,
      status: order.status,
      total: order.total_cents.to_i / 100.0,
      total_cents: order.total_cents,
      created_at: order.created_at
    }
  end

  def serialize_prize(prize)
    prize.as_json(
      only: %i[id name description prize_type discount_value probability_weight coupon_valid_days
               minimum_order_cents max_total_wins current_wins badge color sort_order is_active]
    ).merge(minimum_order_amount: prize.minimum_order_cents.to_i / 100.0)
  end

  def serialize_coupon(coupon)
    coupon.as_json(
      only: %i[id code title description discount_type discount_value minimum_order_cents
               max_uses used_count starts_at expires_at is_active source customer_id]
    )
  end

  def serialize_spin(spin)
    spin.as_json(only: %i[id status source order_spin_number expires_at used_at created_at])
  end

  def serialize_admin_spin(spin)
    serialize_spin(spin).merge(
      customer: spin.customer && serialize_customer(spin.customer),
      prize: spin.wheel_prize && serialize_prize(spin.wheel_prize),
      coupon: spin.coupon && serialize_coupon(spin.coupon),
      order: spin.order && {
        id: spin.order.id,
        order_number: spin.order.order_number,
        total_cents: spin.order.total_cents,
        total: spin.order.total_cents.to_i / 100.0,
        status: spin.order.status
      }
    )
  end

  def normalize_phone(value)
    value.to_s.gsub(/\D/, "")
  end

  def phone_variants(value)
    digits = normalize_phone(value)
    without_country = digits.sub(/\A55/, "")
    without_leading_zero = digits.sub(/\A0/, "")
    local_number = without_country.sub(/\A0/, "")

    [
      digits,
      without_country,
      without_leading_zero,
      local_number,
      local_number.length >= 10 ? "55#{local_number}" : nil,
      local_number.length >= 10 ? "0#{local_number}" : nil
    ].compact.map { |phone| normalize_phone(phone) }.reject(&:blank?).uniq
  end

  def find_customer_by_phone(phone, includes: nil)
    variants = phone_variants(phone)
    scope = @company.customers
    scope = scope.includes(*includes) if includes.present?
    scope
      .where(
        "regexp_replace(coalesce(phone, ''), '\\D', '', 'g') IN (:phones)
         OR regexp_replace(coalesce(whatsapp, ''), '\\D', '', 'g') IN (:phones)",
        phones: variants
      )
      .order(Arel.sql("total_orders DESC, total_spent_cents DESC, updated_at DESC"))
      .first
  end
end
