import { useState, useEffect, useCallback } from 'react'
import { getOrders, getOrderById, updateOrderStatus, getOrderStatusLogs } from '../services/orders'
import { canTransitionTo, getTemplateKeyByStatus } from '../utils/orderStatus.jsx'
import { getStoreSettings } from '../services/settings'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export const useOrders = (filters = {}) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getOrders(filters)
      setOrders(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const updateOrderLocally = useCallback((updatedOrder) => {
    if (!updatedOrder?.id) return

    setOrders(prev =>
      prev.map(order =>
        order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
      )
    )
  }, [])

  const refetch = () => fetchOrders()

  return { orders, loading, error, refetch, updateOrderLocally }
}

export const useOrder = (orderId) => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const data = await getOrderById(orderId)
        setOrder(data)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  return { order, loading, error }
}

export const useOrderStatusLogs = (orderId) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const data = await getOrderStatusLogs(orderId)
        setLogs(data)
      } catch (error) {
        console.error('Error fetching order logs:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchLogs()
    }
  }, [orderId])

  return { logs, loading }
}

export const useOrderActions = () => {
  const { profile } = useAuth()

  const handleStatusChange = async (order, newStatus, options = {}) => {
    const shouldPrepareWhatsApp = typeof options === 'boolean'
      ? options
      : options.prepareWhatsApp !== false
    if (!profile) {
      toast.error('UsuÃ¡rio nÃ£o autenticado')
      return { success: false }
    }

    const store = await getStoreSettings().catch(() => ({}))

    if (!canTransitionTo(order.status, newStatus, order.order_type, profile.role, store?.order_status_flow)) {
      toast.error('TransiÃ§Ã£o de status nÃ£o permitida')
      return { success: false }
    }

    try {
      const statusResult = await updateOrderStatus(order.id, newStatus, profile.id)
      const updatedOrder = {
        ...order,
        ...(statusResult?.order || {}),
        status: newStatus,
      }

      if (statusResult?.inventoryError) {
        toast.warning('Status atualizado. Confira o estoque desse pedido depois.')
      }

      if (order.motoboy_id && ['completed', 'cancelled'].includes(newStatus)) {
        try {
          const { updateDeliveryStatus } = await import('../services/motoboys')
          const deliveryStatus = newStatus === 'completed' ? 'delivered' : 'cancelled'
          const deliveryOrder = await updateDeliveryStatus(order.id, deliveryStatus)
          Object.assign(updatedOrder, deliveryOrder)
        } catch (deliveryError) {
          console.error('Error syncing delivery status:', deliveryError)
        }
      }

      const templateKey = shouldPrepareWhatsApp
        ? getTemplateKeyByStatus(newStatus, order.order_type)
        : null
      toast.success(templateKey
        ? 'Status atualizado. O Rails processou o template WhatsApp configurado.'
        : 'Status atualizado')

      return { success: true, order: updatedOrder, whatsapp: null }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Erro ao atualizar status')
      return { success: false }
    }
  }

  return { handleStatusChange }
}
