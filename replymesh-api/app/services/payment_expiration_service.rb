class PaymentExpirationService
  EXPIRATION_WINDOW = 3.minutes

  Result = Struct.new(:checked, :expired, :errors, keyword_init: true)

  def self.expire_pending_pix!(now: Time.current, limit: nil)
    new(now: now, limit: limit).expire_pending_pix!
  end

  def initialize(now:, limit:)
    @now = now
    @limit = limit
  end

  def expire_pending_pix!
    checked = 0
    expired = 0
    errors = []

    scope.find_each do |order|
      checked += 1
      before_status = order.payment_status

      MercadoPagoPaymentProcessor.refresh!(order)
      order.reload

      expired += 1 if before_status == "pending_payment" && order.payment_status == "expired"
    rescue StandardError => e
      errors << { order_id: order.id, error: "#{e.class}: #{e.message}" }
      Rails.logger.warn("[PaymentExpirationService] failed order=#{order.id}: #{e.class} #{e.message}")
    end

    Result.new(checked: checked, expired: expired, errors: errors)
  end

  private

  def scope
    query = Order
      .where(payment_method: "pix", payment_status: "pending_payment")
      .where("created_at <= ?", @now - EXPIRATION_WINDOW)
      .order(:created_at)

    @limit.present? ? query.limit(@limit.to_i) : query
  end
end
