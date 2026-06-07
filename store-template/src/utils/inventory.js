export const INVENTORY_STATUS = {
  NORMAL: 'normal',
  LOW: 'low',
  OUT: 'out',
}

export const INVENTORY_MOVEMENT_TYPES = {
  IN: 'in',
  OUT: 'out',
  ADJUSTMENT: 'adjustment',
}

export const INVENTORY_MOVEMENT_SOURCES = {
  MANUAL: 'manual',
  ORDER: 'order',
  ADJUSTMENT: 'adjustment',
  RESTOCK: 'restock',
  CANCELLATION: 'cancellation',
}

export const INVENTORY_MOVEMENT_TYPE_LABELS = {
  in: 'Entrada',
  out: 'Saída',
  adjustment: 'Ajuste',
}

export const INVENTORY_MOVEMENT_SOURCE_LABELS = {
  manual: 'Manual',
  order: 'Pedido',
  adjustment: 'Ajuste',
  restock: 'Reposição',
  cancellation: 'Cancelamento',
}

export const getInventoryStatusMeta = (item) => {
  if (!item) {
    return {
      status: INVENTORY_STATUS.NORMAL,
      label: 'Normal',
      colorClass: 'text-gray-400',
      badgeClass: 'bg-gray-700 text-gray-300',
    }
  }

  const currentQuantity = parseFloat(item.current_quantity) || 0
  const minimumQuantity = parseFloat(item.minimum_quantity) || 0

  if (currentQuantity <= 0) {
    return {
      status: INVENTORY_STATUS.OUT,
      label: 'Zerado',
      colorClass: 'text-red-500',
      badgeClass: 'bg-red-600 text-white',
    }
  }

  if (currentQuantity <= minimumQuantity) {
    return {
      status: INVENTORY_STATUS.LOW,
      label: 'Baixo',
      colorClass: 'text-yellow-500',
      badgeClass: 'bg-yellow-600 text-white',
    }
  }

  return {
    status: INVENTORY_STATUS.NORMAL,
    label: 'Normal',
    colorClass: 'text-green-500',
    badgeClass: 'bg-green-600 text-white',
  }
}

export const canDeductInventory = (currentQuantity, requestedQuantity, allowNegative = false) => {
  if (allowNegative) {
    return true
  }

  return currentQuantity >= requestedQuantity
}

export const normalizeInventoryQuantity = (value) => {
  const num = parseFloat(value)
  if (isNaN(num)) return 0
  return Math.max(0, num)
}

export const formatInventoryQuantity = (quantity, unit) => {
  const num = parseFloat(quantity) || 0
  return `${num} ${unit || 'un'}`
}

export const getMovementTypeLabel = (type) => {
  return INVENTORY_MOVEMENT_TYPE_LABELS[type] || type
}

export const getMovementSourceLabel = (source) => {
  return INVENTORY_MOVEMENT_SOURCE_LABELS[source] || source
}

export const getMovementTypeColor = (type) => {
  const colors = {
    in: 'text-green-500',
    out: 'text-red-500',
    adjustment: 'text-yellow-500',
  }
  return colors[type] || 'text-gray-400'
}

export const getMovementTypeBadgeClass = (type) => {
  const classes = {
    in: 'bg-green-600 text-white',
    out: 'bg-red-600 text-white',
    adjustment: 'bg-yellow-600 text-white',
  }
  return classes[type] || 'bg-gray-600 text-white'
}

export const calculateMovementImpact = (movement) => {
  if (movement.type === 'in') {
    return `+${movement.quantity}`
  } else if (movement.type === 'out') {
    return `-${movement.quantity}`
  } else {
    const diff = movement.quantity_after - movement.quantity_before
    return diff > 0 ? `+${diff}` : `${diff}`
  }
}

export const validateInventoryItem = (item) => {
  const errors = []

  if (!item.name || item.name.trim() === '') {
    errors.push('Nome é obrigatório')
  }

  if (!item.slug || item.slug.trim() === '') {
    errors.push('Slug é obrigatório')
  } else {
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(item.slug)) {
      errors.push('Slug deve conter apenas letras minúsculas, números e hífens')
    }
  }

  if (!item.unit || item.unit.trim() === '') {
    errors.push('Unidade de medida é obrigatória')
  }

  const quantity = parseFloat(item.current_quantity)
  if (isNaN(quantity) || quantity < 0) {
    errors.push('Quantidade atual deve ser um número válido e não negativo')
  }

  const minimumQuantity = parseFloat(item.minimum_quantity)
  if (isNaN(minimumQuantity) || minimumQuantity < 0) {
    errors.push('Estoque mínimo deve ser um número válido e não negativo')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const validateInventoryMovement = (movement) => {
  const errors = []

  if (!movement.inventory_item_id) {
    errors.push('Item de estoque é obrigatório')
  }

  if (!movement.type || !['in', 'out', 'adjustment'].includes(movement.type)) {
    errors.push('Tipo de movimentação inválido')
  }

  const quantity = parseFloat(movement.quantity)
  if (isNaN(quantity) || quantity <= 0) {
    errors.push('Quantidade deve ser um número positivo')
  }

  if (!movement.source) {
    errors.push('Origem da movimentação é obrigatória')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export const generateSlugFromName = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export const shouldTrackInventory = (product) => {
  return product?.track_inventory === true && product?.stock_item_id
}

export const canOrderProceedWithInventory = (stockItem, requestedQty, allowNegativeInventory = false) => {
  if (!stockItem) return true
  
  const currentQuantity = parseFloat(stockItem.current_quantity) || 0
  const requestedQuantity = parseFloat(requestedQty) || 0
  
  if (allowNegativeInventory) {
    return true
  }
  
  return currentQuantity >= requestedQuantity
}

export const getInventoryMovementSummaryByOrder = (movements) => {
  if (!movements || movements.length === 0) {
    return {
      totalDeductions: 0,
      totalRestorations: 0,
      netChange: 0,
      itemsAffected: [],
    }
  }
  
  const itemsMap = new Map()
  
  movements.forEach(movement => {
    const itemId = movement.inventory_item_id
    if (!itemsMap.has(itemId)) {
      itemsMap.set(itemId, {
        itemId,
        itemName: movement.inventory_item?.name || 'Desconhecido',
        unit: movement.inventory_item?.unit || 'un',
        deductions: 0,
        restorations: 0,
        netChange: 0,
      })
    }
    
    const item = itemsMap.get(itemId)
    
    if (movement.type === 'out') {
      item.deductions += movement.quantity
      item.netChange -= movement.quantity
    } else if (movement.type === 'in') {
      item.restorations += movement.quantity
      item.netChange += movement.quantity
    }
  })
  
  const itemsAffected = Array.from(itemsMap.values())
  const totalDeductions = itemsAffected.reduce((sum, item) => sum + item.deductions, 0)
  const totalRestorations = itemsAffected.reduce((sum, item) => sum + item.restorations, 0)
  const netChange = totalRestorations - totalDeductions
  
  return {
    totalDeductions,
    totalRestorations,
    netChange,
    itemsAffected,
  }
}
