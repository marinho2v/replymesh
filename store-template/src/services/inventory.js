import { request } from './replymeshApi'

const toNumber = (value) => Number(value || 0)

const normalizeItem = (item = {}) => ({
  ...item,
  current_quantity: toNumber(item.current_quantity),
  minimum_quantity: toNumber(item.minimum_quantity),
  cost_price: toNumber(item.cost_price),
  sale_price: item.sale_price === undefined || item.sale_price === null ? null : toNumber(item.sale_price),
  is_active: item.is_active !== false,
})

const itemToRails = (itemData = {}) => ({
  name: itemData.name,
  slug: itemData.slug,
  category: itemData.category,
  unit: itemData.unit,
  minimum_quantity: itemData.minimum_quantity,
  cost_price: itemData.cost_price,
  is_active: itemData.is_active !== false,
  notes: itemData.notes,
})

export const listInventoryItems = async (filters = {}) => {
  const payload = await request('/store/inventory_items', {
    params: {
      category: filters.category,
      is_active: filters.is_active,
      low_stock: filters.low_stock,
      search: filters.search,
    },
  })
  let items = (payload.inventory_items || []).map(normalizeItem)

  if (filters.search) {
    const search = String(filters.search).toLowerCase()
    items = items.filter(item => item.name?.toLowerCase().includes(search))
  }

  return items
}

export const getInventoryItemById = async (id) => {
  const payload = await request(`/store/inventory_items/${id}`)
  return normalizeItem(payload.inventory_item)
}

export const getInventoryItemBySlug = async (slug) => {
  const items = await listInventoryItems({ search: slug })
  return items.find(item => item.slug === slug) || null
}

export const createInventoryItem = async (itemData) => {
  const initialQuantity = toNumber(itemData.current_quantity)
  const payload = await request('/store/inventory_items', {
    method: 'POST',
    body: { inventory_item: itemToRails(itemData) },
  })
  const item = normalizeItem(payload.inventory_item)

  if (initialQuantity > 0) {
    await request(`/store/inventory_items/${item.id}/entry`, {
      method: 'POST',
      body: {
        quantity: initialQuantity,
        reason: 'Saldo inicial',
        notes: itemData.notes,
      },
    })
    return getInventoryItemById(item.id)
  }

  return item
}

export const updateInventoryItem = async (id, itemData) => {
  const payload = await request(`/store/inventory_items/${id}`, {
    method: 'PATCH',
    body: { inventory_item: itemToRails(itemData) },
  })
  return normalizeItem(payload.inventory_item)
}

export const toggleInventoryItemStatus = async (id, isActive) => updateInventoryItem(id, { is_active: isActive })

export const deleteInventoryItem = async (id) => {
  await request(`/store/inventory_items/${id}`, { method: 'DELETE' })
  return true
}

export const getLowStockItems = async () => listInventoryItems({ low_stock: true })

export const getInventoryStats = async () => {
  const [items, lowStockItems, movementsPayload] = await Promise.all([
    listInventoryItems({}),
    getLowStockItems(),
    request('/store/inventory_movements', { params: { limit: 1 } }),
  ])

  return {
    totalItems: items.length,
    activeItems: items.filter(item => item.is_active !== false).length,
    lowStockItems: lowStockItems.length,
    totalMovements: movementsPayload.total || 0,
  }
}

export const getInventoryCategories = async () => {
  const items = await listInventoryItems({})
  return [...new Set(items.map(item => item.category).filter(Boolean))].sort()
}

export const linkProductToInventory = async () => null

export const validateOrderInventory = async () => ({
  valid: true,
  errors: [],
  inventoryRequirements: [],
})

export const getInventoryRequirementsFromOrderItems = async () => []

export const hasOrderInventoryDeduction = async () => false

export const hasOrderInventoryRestoration = async () => false
