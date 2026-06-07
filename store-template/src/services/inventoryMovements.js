import { request } from './replymeshApi'

const normalizeMovement = (movement = {}) => ({
  ...movement,
  type: movement.movement_type || movement.type,
  inventory_item: movement.inventory_item || {
    name: movement.item_name,
    unit: movement.unit,
  },
})

export const listInventoryMovements = async (filters = {}) => {
  const payload = await request('/store/inventory_movements', {
    params: {
      inventory_item_id: filters.inventory_item_id,
      type: filters.type,
      source: filters.source,
      limit: filters.limit || 100,
    },
  })
  let movements = (payload.movements || []).map(normalizeMovement)

  if (filters.search) {
    const search = String(filters.search).trim().toLowerCase()
    movements = movements.filter(movement => movement.inventory_item?.name?.toLowerCase().includes(search))
  }

  return movements
}

export const getMovementById = async (id) => {
  const movements = await listInventoryMovements({ limit: 200 })
  return movements.find(movement => String(movement.id) === String(id)) || null
}

export const createInventoryMovement = async (movementData) => {
  if (movementData.type === 'in') {
    return applyInventoryEntry(movementData.inventory_item_id, movementData.quantity, movementData)
  }
  if (movementData.type === 'out') {
    return applyInventoryExit(movementData.inventory_item_id, movementData.quantity, movementData)
  }
  return applyInventoryAdjustment(movementData.inventory_item_id, movementData.final_quantity || movementData.quantity_after, movementData)
}

export const applyInventoryEntry = async (stockItemId, quantity, metadata = {}) => {
  const payload = await request(`/store/inventory_items/${stockItemId}/entry`, {
    method: 'POST',
    body: {
      quantity,
      reason: metadata.reason || 'Entrada manual',
      notes: metadata.notes,
    },
  })
  return payload.inventory_item
}

export const applyInventoryExit = async (stockItemId, quantity, metadata = {}) => {
  const itemPayload = await request(`/store/inventory_items/${stockItemId}`)
  const current = Number(itemPayload.inventory_item?.current_quantity || metadata.quantity_before || 0)
  const nextQuantity = Math.max(current - Number(quantity || 0), 0)
  return applyInventoryAdjustment(stockItemId, nextQuantity, {
    ...metadata,
    reason: metadata.reason || 'Saida manual',
  })
}

export const applyInventoryAdjustment = async (stockItemId, finalQuantity, metadata = {}) => {
  const payload = await request(`/store/inventory_items/${stockItemId}/adjust`, {
    method: 'POST',
    body: {
      quantity: finalQuantity,
      reason: metadata.reason || 'Ajuste manual',
      notes: metadata.notes,
    },
  })
  return payload.inventory_item
}

export const applyOrderInventoryDeduction = async () => true

export const restoreInventoryFromCancelledOrder = async () => true

export const getMovementsByItem = async (stockItemId, limit = 50) => listInventoryMovements({
  inventory_item_id: stockItemId,
  limit,
})

export const getMovementsByOrder = async (orderId, limit = 50) => listInventoryMovements({
  reference_id: orderId,
  limit,
})
