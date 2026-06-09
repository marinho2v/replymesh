class MercadoPagoPaymentProcessor
  ProcessorError = Class.new(StandardError)
  EXPIRATION_WINDOW = 3.minutes
  FINAL_PAYMENT_STATUSES = %w[paid expired cancelled failed refunded].freeze

  def self.refresh!(order)
    new(order).refresh!
  end

  def self.process_result!(order, result, payment_id = nil)
    new(order).process_result!(result, payment_id)
  end

  def self.cancel_pending!(order, reason: "cancelled_by_customer")
    new(order).cancel_pending!(reason: reason)
  end

  def initialize(order)
    @order = order
  end

  def refresh!
    return response unless payable_pending?

    result = check_remote_payment
    process_result!(result, @order.external_payment_id) if result.present?
    expire_if_needed! if payable_pending?

    response
  end

  def process_result!(result, payment_id = nil)
    status = result[:status] || result["status"]
    detail = result[:detail] || result["detail"]

    case status
    when "approved"
      confirm_payment!(payment_id || result[:id] || result["id"])
    when "cancelled", "canceled", "expired"
      cancel_payment!("expired", detail.presence || status)
    when "rejected", "charged_back", "refunded"
      fail_payment!(detail.presence || status)
    end

    response
  end

  def cancel_pending!(reason: "cancelled_by_customer")
    return response.merge(cancelled: false, reason: "not_pending_payment") unless payable_pending?

    result = check_remote_payment
    if (result[:status] || result["status"]) == "approved"
      process_result!(result, @order.external_payment_id)
      return response.merge(cancelled: false, reason: "payment_already_approved")
    end

    cancel_payment!("cancelled", reason)
    response.merge(cancelled: true, reason: reason)
  end

  private

  def payable_pending?
    @order.present? &&
      @order.payment_method == "pix" &&
      @order.payment_status == "pending_payment" &&
      @order.external_payment_id.present? &&
      !@order.status.in?(%w[completed cancelled])
  end

  def check_remote_payment
    settings = @order.company&.store_setting
    return {} unless settings&.mercadopago_enabled? && settings.mercadopago_access_token.present?

    MercadoPagoPixService.new(settings.mercadopago_access_token).check_payment(@order.external_payment_id)
  rescue StandardError => e
    Rails.logger.warn("[MP Pix] status check skipped for order #{@order.id}: #{e.class} #{e.message}")
    {}
  end

  def expire_if_needed!
    return unless @order.created_at <= EXPIRATION_WINDOW.ago

    cancel_payment!("expired", "payment_timeout")
  end

  def confirm_payment!(payment_id)
    return if @order.payment_status == "paid"

    ActiveRecord::Base.transaction do
      @order.update!(
        payment_status: "paid",
        payment_confirmed_at: Time.current,
        external_payment_id: payment_id.to_s.presence || @order.external_payment_id
      )

      if @order.status == "pending"
        result = OrderStatusService.call(
          order: @order,
          new_status: "accepted",
          notes: "Pix Mercado Pago confirmado",
          allow_inactive_status: true
        )
        raise ProcessorError, result.error unless result.success?
      end
    end

    NotificationService.notify_company(
      company: @order.company,
      title: "Pagamento confirmado - Pedido ##{@order.order_number}",
      message: "Pix Mercado Pago aprovado. Pedido aceito automaticamente.",
      type: "billing",
      link_url: "/admin/orders/#{@order.id}"
    ) rescue nil

    Rails.logger.info("[MP Pix] Payment confirmed for order #{@order.id}")
  end

  def cancel_payment!(payment_status, detail)
    return if @order.payment_status == "paid"

    ActiveRecord::Base.transaction do
      @order.update!(payment_status: payment_status)

      if @order.status != "cancelled"
        result = OrderStatusService.call(order: @order, new_status: "cancelled", notes: detail)
        raise ProcessorError, result.error unless result.success?
      end
    end

    NotificationService.notify_company(
      company: @order.company,
      title: "Pix #{payment_status == 'expired' ? 'expirado' : 'cancelado'} - Pedido ##{@order.order_number}",
      message: "Pedido cancelado automaticamente. Motivo: #{detail}.",
      type: "billing",
      link_url: "/admin/orders/#{@order.id}"
    ) rescue nil

    Rails.logger.info("[MP Pix] Payment #{payment_status} for order #{@order.id}: #{detail}")
  end

  def fail_payment!(detail)
    return if FINAL_PAYMENT_STATUSES.include?(@order.payment_status)

    cancel_payment!("failed", detail)
  end

  def response
    @order.reload
    {
      order_id: @order.public_token,
      payment_status: @order.payment_status || "not_required",
      order_status: @order.status,
      confirmed_at: @order.payment_confirmed_at&.iso8601,
      expires_at: (@order.created_at + EXPIRATION_WINDOW).iso8601,
      expired: @order.payment_status == "expired",
      cancelled: @order.status == "cancelled",
      has_pix: @order.pix_qr_code.present?
    }
  end
end
