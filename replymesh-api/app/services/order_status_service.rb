# OrderStatusService
#
# Gerencia transicoes validas de status de pedidos e aciona efeitos colaterais
# operacionais como estoque e caixa.
class OrderStatusService
  ServiceError = Class.new(StandardError)

  VALID_TRANSITIONS = {
    "pending" => %w[accepted cancelled],
    "accepted" => %w[preparing cancelled],
    "preparing" => %w[ready cancelled],
    "ready" => %w[out_for_delivery completed cancelled],
    "out_for_delivery" => %w[completed cancelled],
    "completed" => [],
    "cancelled" => []
  }.freeze

  CANONICAL_SEQUENCE = %w[pending accepted preparing ready out_for_delivery completed].freeze

  TIMESTAMP_FIELDS = {
    "accepted" => :accepted_at,
    "preparing" => :preparing_at,
    "ready" => :ready_at,
    "out_for_delivery" => :out_for_delivery_at,
    "completed" => :completed_at,
    "cancelled" => :cancelled_at
  }.freeze

  Result = Struct.new(:success, :order, :error, keyword_init: true) do
    def success? = success
  end

  def self.call(order:, new_status:, user: nil, notes: nil, skip_side_effects: false)
    new(
      order: order,
      new_status: new_status,
      user: user,
      notes: notes,
      skip_side_effects: skip_side_effects
    ).call
  end

  def initialize(order:, new_status:, user: nil, notes: nil, skip_side_effects: false)
    @order = order
    @new_status = new_status
    @user = user
    @notes = notes
    @skip_side_effects = skip_side_effects
  end

  def call
    return Result.new(success: false, error: "Pedido nao encontrado") unless @order
    return Result.new(success: false, error: transition_error) unless valid_transition?

    ActiveRecord::Base.transaction do
      previous_status = @order.status

      attrs = { status: @new_status }
      attrs[TIMESTAMP_FIELDS[@new_status]] = Time.current if TIMESTAMP_FIELDS[@new_status]

      @order.update!(attrs)

      @order.order_status_logs.create!(
        company_id: @order.company_id,
        previous_status: previous_status,
        new_status: @new_status,
        changed_by: @user
      )

      prepare_whatsapp_update
      after_transition
    end

    Result.new(success: true, order: @order.reload)
  rescue ServiceError => e
    Result.new(success: false, error: e.message)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, error: e.record.errors.full_messages.join(", "))
  rescue StandardError => e
    Rails.logger.error("OrderStatusService error: #{e.class} #{e.message}")
    Result.new(success: false, error: "Erro interno ao atualizar status")
  end

  private

  def valid_transition?
    return false if @order.status.in?(%w[completed cancelled])
    return VALID_TRANSITIONS[@order.status]&.include?(@new_status) if @new_status == "cancelled"

    dynamic_next_status == @new_status
  end

  def transition_error
    allowed = ([dynamic_next_status] + Array(VALID_TRANSITIONS[@order.status]&.include?("cancelled") ? "cancelled" : nil)).compact.join(", ")
    allowed = "nenhuma" if allowed.blank?
    "Transicao invalida: #{@order.status} -> #{@new_status}. Permitidas: #{allowed}"
  end

  def dynamic_next_status
    active_sequence = active_status_sequence
    current_index = active_sequence.index(@order.status)
    return active_sequence[current_index + 1] if current_index

    canonical_index = CANONICAL_SEQUENCE.index(@order.status)
    return unless canonical_index

    active_sequence.find { |status| CANONICAL_SEQUENCE.index(status).to_i > canonical_index }
  end

  def active_status_sequence
    statuses = ["pending"]
    statuses << "accepted" if template_enabled_for_status?("accepted", default: true)
    statuses << "preparing" if template_enabled_for_status?("preparing")
    statuses << "ready" if template_enabled_for_status?("ready")
    statuses << "out_for_delivery" if @order.order_type == "delivery" && template_enabled_for_status?("out_for_delivery", default: true)
    statuses << "completed" if template_enabled_for_status?("completed", default: true)
    statuses
  end

  def template_enabled_for_status?(status, default: false)
    template_key = WhatsappTemplate.template_key_for_status(status)
    return default unless template_key

    template = WhatsappTemplate.find_by(company_id: @order.company_id, template_key: template_key)
    template.nil? ? default : template.enabled?
  end

  def after_transition
    return if @skip_side_effects

    case @new_status
    when "accepted"
      result = InventoryService.deduct_for_order(order: @order, user: @user)
      raise ServiceError, result.error unless result.success?
    when "completed"
      result = CashService.record_payment(order: @order, user: @user)
      if !result.success? && result.error != "Nenhum caixa aberto"
        raise ServiceError, result.error
      elsif !result.success?
        Rails.logger.warn("Cash record skipped for order #{@order.id}: #{result.error}")
      end

      @order.customer&.increment_stats!(@order.total_cents)
      WheelService.grant_for_order(@order)
    when "cancelled"
      return unless @order.inventory_deducted?

      result = InventoryService.restore_for_order(order: @order, user: @user)
      raise ServiceError, result.error unless result.success?
    end
  end

  def prepare_whatsapp_update
    WhatsappStatusDispatcher.call(order: @order, status: @new_status, user: @user)
  rescue StandardError => e
    Rails.logger.warn("WhatsApp status dispatch skipped: #{e.class} #{e.message}")
  end
end
