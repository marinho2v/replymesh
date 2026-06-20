# DeliveryService
#
# Responsável por atribuir motoboys a pedidos e gerenciar o status de entrega.
# Equivalente às RPCs: assign_motoboy_to_order, update_delivery_status,
#                      complete_my_motoboy_delivery.
#
# Uso:
#   DeliveryService.assign(order: order, motoboy: motoboy, user: user)
#   DeliveryService.update_status(order: order, status: "on_the_way", motoboy: motoboy)
#   DeliveryService.complete(order: order, motoboy: motoboy, notes: nil)
#
class DeliveryService
  Result = Struct.new(:success, :data, :error, keyword_init: true) do
    def success? = success
  end

  # ─── Atribuir motoboy ao pedido ─────────────────────────────────────────────
  def self.assign(order:, motoboy:, user: nil, notes: nil)
    return Result.new(success: false, error: "Pedido não é de entrega") unless order.delivery?
    return Result.new(success: false, error: "Motoboy inativo") unless motoboy.active?

    ActiveRecord::Base.transaction do
      # out_for_delivery_at NÃO é definido aqui.
      # Será preenchido pelo OrderStatusService quando o status do pedido
      # mudar para :out_for_delivery via TIMESTAMP_FIELDS do serviço.
      order.update!(motoboy: motoboy, delivery_status: "assigned")

      DeliveryHistory.find_or_initialize_by(order: order).tap do |dh|
        dh.company  = order.company
        dh.motoboy  = motoboy
        dh.status   = "assigned"
        dh.assigned_at = Time.current
        dh.notes    = notes
        dh.save!
      end
    end

    # TODO (FASE 11): Enviar WhatsApp ao motoboy — WhatsappDispatcher.send(...)
    Result.new(success: true, data: order)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, error: e.record.errors.full_messages.join(", "))
  end

  # ─── Atualizar status da entrega ────────────────────────────────────────────
  def self.update_status(order:, new_delivery_status:, motoboy: nil)
    valid = %w[assigned on_the_way delivered cancelled]
    return Result.new(success: false, error: "Status inválido") unless valid.include?(new_delivery_status)

    ActiveRecord::Base.transaction do
      order.update!(delivery_status: new_delivery_status)
      order.delivery_history&.update!(status: new_delivery_status)
    end

    Result.new(success: true, data: order)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, error: e.record.errors.full_messages.join(", "))
  end

  # ─── Confirmar entrega (pelo motoboy) ───────────────────────────────────────
  def self.cancel(order:, user: nil, notes: nil)
    ActiveRecord::Base.transaction do
      order.update!(delivery_status: "cancelled")
      order.delivery_history&.update!(
        status: "cancelled",
        notes: notes.presence || "Pedido cancelado"
      )
    end

    Result.new(success: true, data: order.reload)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, error: e.record.errors.full_messages.join(", "))
  end

  def self.complete(order:, motoboy:, notes: nil, user: nil)
    unless order.motoboy_id == motoboy.id
      return Result.new(success: false, error: "Pedido não pertence a este motoboy")
    end

    # Variável local para capturar o erro do OrderStatusService dentro da transaction.
    # Necessário porque ActiveRecord::Rollback não propaga para fora do bloco transaction
    # (é capturado internamente pelo Rails para disparar rollback), portanto não pode
    # ser rescatado com rescue fora do bloco.
    rollback_reason = nil

    ActiveRecord::Base.transaction do
      order.delivery_history&.update!(status: "delivered", delivered_at: Time.current, notes: notes)
      order.update!(delivery_status: "delivered")
      motoboy.increment_deliveries!

      if order.reload.status != "out_for_delivery"
        previous_status = order.status
        order.update!(status: "out_for_delivery", out_for_delivery_at: Time.current)
        order.order_status_logs.create!(
          company_id: order.company_id,
          previous_status: previous_status,
          new_status: "out_for_delivery",
          changed_by: user
        )
      end

      # Completar o pedido via OrderStatusService — resultado OBRIGATORIAMENTE verificado.
      # Se falhar, toda a transação faz rollback para evitar inconsistência entre
      # delivery_status="delivered" e order.status ainda em estado anterior.
      status_result = OrderStatusService.call(
        order: order.reload,
        new_status: "completed",
        user: user,
        skip_side_effects: true
      )
      unless status_result.success?
        rollback_reason = "Não foi possível completar o pedido: #{status_result.error}"
        raise ActiveRecord::Rollback
      end
    end

    # Se houve rollback dentro da transaction, retornar erro
    return Result.new(success: false, error: rollback_reason) if rollback_reason

    Result.new(success: true, data: order.reload)
  rescue ActiveRecord::RecordInvalid => e
    Result.new(success: false, error: e.record.errors.full_messages.join(", "))
  end
end
