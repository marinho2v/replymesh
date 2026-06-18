require 'net/http'
require 'json'
require 'securerandom'

class MercadoPagoPixService
  MP_BASE_URL = 'https://api.mercadopago.com'.freeze

  class MercadoPagoError < StandardError
    attr_reader :code, :details
    def initialize(message, code: nil, details: nil)
      super(message)
      @code    = code
      @details = details
    end
  end

  Result = Struct.new(:success?, :payment_id, :qr_code, :qr_code_base64, :ticket_url, :status, :error, keyword_init: true)

  def initialize(access_token)
    @access_token = access_token
  end

  # ─── Cria pagamento Pix ────────────────────────────────────────────────────
  def create_pix_payment(order:, payer_email: nil)
    return dev_mock_payment(order) if Rails.env.development? && dev_token?

    idempotency_key = "replymesh-order-#{order.id}-#{order.company_id}"
    amount          = order_amount(order).round(2)
    email           = payer_email.presence || "cliente-#{order.id}@replymesh.app"
    description     = "Pedido ##{order.order_number} — #{order.company&.name}"

    payload = {
      transaction_amount: amount,
      payment_method_id:  'pix',
      description:        description,
      payer:              { email: email },
      external_reference: external_reference_for(order),
      notification_url:   notification_url,
      metadata:           payment_metadata(order)
    }

    response = post('/v1/payments', payload, { 'X-Idempotency-Key' => idempotency_key })

    extract_result(response)
  rescue MercadoPagoError => e
    Result.new(success?: false, error: e.message)
  rescue => e
    Rails.logger.error("[MercadoPagoPixService] Unexpected error: #{e.class} — #{e.message}")
    Result.new(success?: false, error: 'Erro ao se comunicar com o Mercado Pago')
  end

  # ─── Consulta status do pagamento ─────────────────────────────────────────
  def check_payment(payment_id)
    return dev_mock_check(payment_id) if Rails.env.development? && dev_token?

    response = get("/v1/payments/#{payment_id}")
    {
      id:                 response['id'],
      status:             response['status'],
      detail:             response['status_detail'],
      external_reference: response['external_reference'],
      metadata:           response['metadata'] || {},
    }
  rescue => e
    Rails.logger.error("[MercadoPagoPixService] check_payment error: #{e.message}")
    { id: payment_id, status: 'error', detail: e.message }
  end

  # ─── Verifica token de conexão ────────────────────────────────────────────
  def self.test_connection(access_token)
    svc  = new(access_token)
    resp = svc.send(:get, '/users/me')
    { success: true, email: resp['email'], id: resp['id'] }
  rescue => e
    { success: false, error: e.message }
  end

  private

  # ─── Helpers HTTP ──────────────────────────────────────────────────────────
  def post(path, body, extra_headers = {})
    uri  = URI("#{MP_BASE_URL}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl     = true
    http.read_timeout = 15
    http.open_timeout = 10

    request = Net::HTTP::Post.new(uri)
    request['Authorization']  = "Bearer #{@access_token}"
    request['Content-Type']   = 'application/json'
    request['Accept']         = 'application/json'
    extra_headers.each { |k, v| request[k] = v }
    request.body = body.to_json

    response = http.request(request)
    parse_response(response)
  end

  def get(path)
    uri  = URI("#{MP_BASE_URL}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl     = true
    http.read_timeout = 15
    http.open_timeout = 10

    request = Net::HTTP::Get.new(uri)
    request['Authorization'] = "Bearer #{@access_token}"
    request['Accept']        = 'application/json'

    response = http.request(request)
    parse_response(response)
  end

  def parse_response(response)
    body = JSON.parse(response.body)

    unless response.code.to_i.between?(200, 299)
      code    = body['error']
      message = body.dig('message') || body.dig('cause', 0, 'description') || "HTTP #{response.code}"
      raise MercadoPagoError.new(message, code: code, details: body)
    end

    body
  end

  def extract_result(response)
    tx = response.dig('point_of_interaction', 'transaction_data') || {}
    Result.new(
      success?:        true,
      payment_id:      response['id'].to_s,
      qr_code:         tx['qr_code'],
      qr_code_base64:  tx['qr_code_base64'],
      ticket_url:      tx['ticket_url'],
      status:          response['status'],
    )
  end

  def external_reference_for(order)
    [
      "replymesh",
      order.company&.slug,
      order.id,
      order.public_token
    ].compact.join(":")
  end

  def payment_metadata(order)
    {
      order_id: order.id,
      order_number: order.order_number,
      public_token: order.public_token,
      company_id: order.company_id,
      company_slug: order.company&.slug
    }.compact
  end

  def notification_url
    ENV["MERCADOPAGO_NOTIFICATION_URL"].presence ||
      "https://#{ENV.fetch("REPLYMESH_API_HOST", "api.replymesh.cloud")}/api/v1/webhooks/mercadopago"
  end

  def dev_token?
    @access_token.to_s.start_with?('TEST-') || @access_token.to_s.include?('DEV-')
  end

  # ─── Mock para ambiente de desenvolvimento ────────────────────────────────
  def dev_mock_payment(order)
    mock_id = "DEV-#{order.id}-#{SecureRandom.hex(4)}"
    # QR Code genérico (payload BR Code simplificado)
    mock_pix = "00020126360014BR.GOV.BCB.PIX0114replymeshdev5204000053039865406#{format('%.2f', order_amount(order))}5802BR5913Replymesh Dev6008BRASILIA62070503***6304#{SecureRandom.hex(2).upcase}"
    # Base64 minimalista de um QR code em branco (placeholder)
    mock_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    Result.new(
      success?:       true,
      payment_id:     mock_id,
      qr_code:        mock_pix,
      qr_code_base64: mock_base64,
      ticket_url:     nil,
      status:         'pending',
    )
  end

  def dev_mock_check(payment_id)
    # Marcar como aprovado se o payment_id começa com DEV-SIM (simulação confirmada)
    if payment_id.to_s.start_with?('DEV-SIM-')
      { id: payment_id, status: 'approved', detail: 'accredited' }
    else
      { id: payment_id, status: 'pending', detail: 'waiting_payment' }
    end
  end

  def order_amount(order)
    return order.total_brl.to_f if order.respond_to?(:total_brl)
    return order.total_cents.to_i / 100.0 if order.respond_to?(:total_cents)

    order.total.to_f
  end
end
