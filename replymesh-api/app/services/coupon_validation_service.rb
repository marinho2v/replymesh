class CouponValidationService
  Result = Struct.new(:valid, :coupon, :discount_cents, :message, keyword_init: true) do
    def valid? = valid
  end

  def self.call(company:, code:, order_total_cents:, customer_phone: nil, customer: nil, delivery_fee_cents: 0)
    new(
      company: company,
      code: code,
      order_total_cents: order_total_cents,
      customer_phone: customer_phone,
      customer: customer,
      delivery_fee_cents: delivery_fee_cents
    ).call
  end

  def initialize(company:, code:, order_total_cents:, customer_phone: nil, customer: nil, delivery_fee_cents: 0)
    @company = company
    @code = code.to_s.strip.upcase
    @order_total_cents = order_total_cents.to_i
    @customer_phone = normalize_phone(customer_phone)
    @customer = customer
    @delivery_fee_cents = delivery_fee_cents.to_i
  end

  def call
    return invalid("Informe o cupom") if @code.blank?

    coupon = Coupon.for_company(@company.id).valid_now.find_by(code: @code)
    return invalid("Cupom nao encontrado") unless coupon
    return invalid("Cupom esgotado") if coupon.exhausted?
    return invalid("Pedido minimo de #{format_brl(coupon.minimum_order_cents)}") if @order_total_cents < coupon.minimum_order_cents.to_i
    return invalid("Cupom vinculado a outro cliente") unless coupon_allowed_for_customer?(coupon)
    return invalid("Cupom ja utilizado por este cliente") if single_use_already_used?(coupon)

    Result.new(
      valid: true,
      coupon: coupon,
      discount_cents: calculate_discount_cents(coupon),
      message: "Cupom valido"
    )
  end

  private

  def invalid(message)
    Result.new(valid: false, coupon: nil, discount_cents: 0, message: message)
  end

  def coupon_allowed_for_customer?(coupon)
    return true unless coupon.customer_id.present?
    return coupon.customer_id == @customer.id if @customer
    return false if @customer_phone.blank?

    customer = @company.customers.find_by(id: coupon.customer_id)
    customer.present? && same_phone?(customer.phone, @customer_phone)
  end

  def single_use_already_used?(coupon)
    return false unless coupon.is_single_use_per_customer?

    scope = @company.orders.where(coupon_id: coupon.id).where.not(status: "cancelled")
    if @customer
      scope.where(customer_id: @customer.id).exists?
    elsif @customer_phone.present?
      scope.where(customer_phone: @customer_phone).exists?
    else
      false
    end
  end

  def calculate_discount_cents(coupon)
    case coupon.discount_type
    when "percentage"
      (@order_total_cents * coupon.discount_value.to_d / 100).round.to_i
    when "fixed"
      [(coupon.discount_value.to_d * 100).round.to_i, @order_total_cents].min
    when "free_shipping"
      @delivery_fee_cents
    else
      0
    end
  end

  def normalize_phone(value)
    value.to_s.gsub(/\D/, "")
  end

  def same_phone?(left, right)
    normalized_left = normalize_phone(left)
    normalized_right = normalize_phone(right)
    return false if normalized_left.blank? || normalized_right.blank?

    normalized_left == normalized_right ||
      normalized_left.last(11) == normalized_right.last(11) ||
      normalized_left.last(10) == normalized_right.last(10)
  end

  def format_brl(cents)
    "R$ #{format('%.2f', cents.to_i / 100.0).tr('.', ',')}"
  end
end
