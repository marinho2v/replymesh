import {
  getStoreOrder,
  getStoreOrders,
  updateStoreOrderStatus,
} from './storeApi'
import { createPublicOrder as createRailsPublicOrder } from './publicApi'

const orderParams = (filters = {}) => ({
  status: filters.status,
  type: filters.orderType,
  date_from: filters.startDate || filters.date,
  date_to: filters.endDate || filters.date,
  q: filters.search,
  limit: filters.limit || filters.pageSize || 80,
  page: filters.page || 0,
})

export const createPublicOrder = ({ formData, items, totals, couponCode }) =>
  createRailsPublicOrder({
    order_type: formData.orderType,
    payment_method: formData.paymentMethod,
    delivery_zone_id: formData.delivery_zone_id,
    subtotal_cents: Math.round(Number(totals.subtotal || 0) * 100),
    delivery_fee_cents: Math.round(Number(totals.deliveryFee || 0) * 100),
    discount_cents: Math.round(Number(totals.discount || 0) * 100),
    total_cents: Math.round(Number(totals.total || 0) * 100),
    change_for_cents: formData.needsChange
      ? Math.round(Number(String(formData.changeFor || 0).replace(',', '.')) * 100)
      : null,
    needs_change: Boolean(formData.needsChange),
    coupon_code: couponCode || null,
    notes: formData.notes || '',
    customer: {
      full_name: formData.fullName,
      phone: formData.whatsapp,
      whatsapp: formData.whatsapp,
      email: formData.email || null,
    },
    address: {
      zip_code: formData.zipCode || formData.cep,
      street: formData.street,
      number: formData.number,
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      reference: formData.reference,
    },
    items: items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_cents: Math.round(Number(item.unit_price || 0) * 100),
      selected_options: item.selected_options || [],
      notes: item.notes || '',
    })),
  })

export const getOrders = (filters = {}) =>
  getStoreOrders({ params: orderParams(filters) }).then((payload) => payload.orders || [])

export const getOrderById = (orderId) => getStoreOrder(orderId)

export const updateOrderStatus = (orderId, newStatus, _userId) =>
  updateStoreOrderStatus(orderId, newStatus).then((order) => ({
    order,
    inventoryHandled: true,
    inventoryError: null,
  }))

export const getOrderStatusLogs = (orderId) =>
  getStoreOrder(orderId).then((order) => order.status_history || [])

export const createOrder = () => {
  throw new Error('Criacao administrativa deve usar a API Rails da loja.')
}

export const createOrderFlow = createOrder

export const getPublicOrderById = () => {
  throw new Error('Use publicApi.getPublicOrder para pedidos publicos.')
}

export const cancelOrderWithInventoryRestore = (orderId, userId) =>
  updateOrderStatus(orderId, 'cancelled', userId)

export const createInitialOrderLog = async () => true
