import { useCallback, useEffect, useRef, useState } from 'react'
import { getKitchenOrders } from '../services/storeApi'
import { scheduleAdaptivePoll } from '../utils/adaptivePolling'

const KITCHEN_STATUSES = ['pending', 'accepted', 'preparing', 'ready']
const KITCHEN_ORDER_LIMIT = 60
const KITCHEN_POLL_INTERVAL = 4000
const KITCHEN_HIDDEN_POLL_INTERVAL = 30000

const isKitchenStatus = (status) => KITCHEN_STATUSES.includes(status)

const normalizeOrder = (order) => ({
  ...order,
  total: order.total ?? order.total_brl ?? Number(order.total_cents || 0) / 100,
  subtotal: order.subtotal ?? Number(order.subtotal_cents || 0) / 100,
  delivery_fee: order.delivery_fee ?? Number(order.delivery_fee_cents || 0) / 100,
  discount_amount: order.discount_amount ?? Number(order.discount_cents || 0) / 100,
  order_items: order.order_items || order.items || [],
})

export const useKitchenOrders = (options = {}) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const onNewOrderRef = useRef(options.onNewOrder)
  const initializedRef = useRef(false)
  const knownOrderIdsRef = useRef(new Set())

  useEffect(() => {
    onNewOrderRef.current = options.onNewOrder
  }, [options.onNewOrder])

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)

      const nextOrders = (await getKitchenOrders({ params: { limit: KITCHEN_ORDER_LIMIT } }))
        .map(normalizeOrder)
        .filter(order => isKitchenStatus(order.status))
      const nextIds = new Set(nextOrders.map(order => order.id))

      if (initializedRef.current) {
        nextOrders.forEach((order) => {
          if (!knownOrderIdsRef.current.has(order.id)) {
            onNewOrderRef.current?.(order)
          }
        })
      } else {
        initializedRef.current = true
      }

      knownOrderIdsRef.current = nextIds
      setOrders(nextOrders)
      setError(null)
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar pedidos da cozinha')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    const stopPolling = scheduleAdaptivePoll({
      run: () => fetchOrders({ silent: true }),
      visibleMs: KITCHEN_POLL_INTERVAL,
      hiddenMs: KITCHEN_HIDDEN_POLL_INTERVAL,
      maxMs: 60000,
    })

    return () => stopPolling()
  }, [fetchOrders])

  const updateOrderLocally = useCallback((updatedOrder) => {
    if (!updatedOrder?.id) return

    const normalizedOrder = normalizeOrder(updatedOrder)

    setOrders(prev => {
      if (!isKitchenStatus(normalizedOrder.status)) {
        return prev.filter(order => order.id !== normalizedOrder.id)
      }

      return prev.some(order => order.id === normalizedOrder.id)
        ? prev.map(order => order.id === normalizedOrder.id ? { ...order, ...normalizedOrder } : order)
        : [normalizedOrder, ...prev].slice(0, KITCHEN_ORDER_LIMIT)
    })
  }, [])

  return { orders, loading, error, refetch: fetchOrders, updateOrderLocally }
}
