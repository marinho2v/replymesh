# InventoryService
#
# Responsável por entradas, saídas e ajustes de estoque.
# Equivalente às RPCs: apply_inventory_entry, apply_inventory_exit,
#                      apply_order_inventory_deduction, restore_inventory_from_cancelled_order.
#
# Uso:
#   InventoryService.entry(item: item, qty: 10, user: user, notes: "Compra fornecedor")
#   InventoryService.exit(item: item, qty: 2, user: user, reason: "Perda")
#   InventoryService.deduct_for_order(order: order, user: user)
#   InventoryService.restore_for_order(order: order, user: user)
#
class InventoryService
  ServiceError = Class.new(StandardError)

  Result = Struct.new(:success, :data, :error, keyword_init: true) do
    def success? = success
  end

  # ─── Entrada manual de estoque ──────────────────────────────────────────────
  def self.entry(item:, qty:, user: nil, reason: nil, notes: nil, **attrs)
    item.apply_movement!(
      type:        "in",
      qty:         qty.to_d,
      source:      "manual",
      reason:      reason,
      user:        user,
      notes:       notes,
      **attrs
    )
    Result.new(success: true, data: item.reload)
  rescue StandardError => e
    Result.new(success: false, error: e.message)
  end

  # ─── Saída manual de estoque ────────────────────────────────────────────────
  def self.exit(item:, qty:, user: nil, reason: nil, notes: nil)
    if item.current_quantity < qty.to_d
      return Result.new(success: false,
                        error: "Estoque insuficiente: #{item.current_quantity} #{item.unit} disponível")
    end

    item.apply_movement!(type: "out", qty: qty.to_d, source: "manual",
                         reason: reason, user: user, notes: notes)
    Result.new(success: true, data: item.reload)
  rescue StandardError => e
    Result.new(success: false, error: e.message)
  end

  # ─── Deduzir estoque ao aceitar pedido ──────────────────────────────────────
  def self.deduct_for_order(order:, user: nil)
    return Result.new(success: true, data: nil) if order.inventory_deducted?

    errors = []

    ActiveRecord::Base.transaction do
      order.order_items.includes(product: :stock_item).each do |item|
        next unless item.product&.track_inventory? && item.product.stock_item

        inv_item = item.product.stock_item
        qty      = item.quantity

        if inv_item.current_quantity < qty
          errors << "#{inv_item.name}: estoque insuficiente (#{inv_item.current_quantity} disponível, #{qty} necessário)"
          next
        end

        inv_item.apply_movement!(
          type:         "out",
          qty:          qty.to_d,
          source:       "pedido",
          reference_id: order.id,
          user:         user,
          reason:       "Pedido ##{order.order_number}"
        )
      end

      raise ServiceError, errors.join("; ") if errors.any?

      order.update_columns(inventory_deducted: true, inventory_deducted_at: Time.current)
    end

    Result.new(success: true, data: order)
  rescue ServiceError => e
    Result.new(success: false, error: e.message)
  rescue StandardError => e
    Result.new(success: false, error: e.message)
  end

  # ─── Restaurar estoque ao cancelar pedido ───────────────────────────────────
  def self.restore_for_order(order:, user: nil)
    return Result.new(success: true, data: nil) unless order.inventory_deducted?
    return Result.new(success: true, data: nil) if order.inventory_restored?

    ActiveRecord::Base.transaction do
      order.order_items.includes(product: :stock_item).each do |item|
        next unless item.product&.track_inventory? && item.product.stock_item

        item.product.stock_item.apply_movement!(
          type:         "in",
          qty:          item.quantity.to_d,
          source:       "cancelamento",
          reference_id: order.id,
          user:         user,
          reason:       "Cancelamento pedido ##{order.order_number}"
        )
      end

      order.update_columns(inventory_restored: true, inventory_restored_at: Time.current)
    end

    Result.new(success: true, data: order)
  rescue StandardError => e
    Result.new(success: false, error: e.message)
  end
end
