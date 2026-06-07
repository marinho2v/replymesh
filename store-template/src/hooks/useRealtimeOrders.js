import { useEffect, useState, useCallback, useRef } from 'react'
import { runSupabaseQuery, supabase } from '../services/supabase'

const ORDER_LIST_COLUMNS = 'id, order_number, customer_name, customer_phone, customer_whatsapp, subtotal, delivery_fee, discount_amount, total, status, order_type, payment_method, created_at, delivery_zone_id, neighborhood'
const ORDER_LIST_LIMIT = 80
const ORDER_POLL_INTERVAL = 5000

const getDateBounds = (date) => {
  const start = new Date(`${date}T00:00:00`)
  const end = new Date(`${date}T23:59:59.999`)

  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

const normalizeSearch = (search) => (
  String(search || '')
    .trim()
    .toLowerCase()
)

const applyFiltersToQuery = (query, filters = {}) => {
  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.orderType) {
    query = query.eq('order_type', filters.orderType)
  }

  if (filters.paymentMethod) {
    query = query.eq('payment_method', filters.paymentMethod)
  }

  if (filters.date) {
    const { startIso, endIso } = getDateBounds(filters.date)
    query = query.gte('created_at', startIso).lte('created_at', endIso)
  }

  const search = normalizeSearch(filters.search).replace(/[%,]/g, '')
  if (search) {
    const searchFilters = [
      `customer_name.ilike.%${search}%`,
      `customer_phone.ilike.%${search}%`,
      `customer_whatsapp.ilike.%${search}%`,
    ]

    if (/^\d+$/.test(search)) {
      searchFilters.push(`order_number.eq.${Number(search)}`)
    }

    query = query.or(searchFilters.join(','))
  }

  return query
}

const orderMatchesFilters = (order, filters = {}) => {
  if (filters.status && order.status !== filters.status) return false
  if (filters.orderType && order.order_type !== filters.orderType) return false
  if (filters.paymentMethod && order.payment_method !== filters.paymentMethod) return false

  if (filters.date) {
    const { start, end } = getDateBounds(filters.date)
    const createdAt = new Date(order.created_at)
    if (createdAt < start || createdAt > end) return false
  }

  const search = normalizeSearch(filters.search)
  if (search) {
    const haystack = [
      order.customer_name,
      order.customer_phone,
      order.customer_whatsapp,
      order.order_number,
    ].join(' ').toLowerCase()

    if (!haystack.includes(search)) return false
  }

  return true
}

export const useRealtimeOrders = (filters = {}, options = {}) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const channelRef = useRef(null)
  const onNewOrderRef = useRef(options.onNewOrder)
  const initializedRef = useRef(false)
  const knownOrderIdsRef = useRef(new Set())
  const filtersKey = JSON.stringify(filters)

  useEffect(() => {
    onNewOrderRef.current = options.onNewOrder
  }, [options.onNewOrder])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('orders')
        .select(ORDER_LIST_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(ORDER_LIST_LIMIT)

      query = applyFiltersToQuery(query, filters)

      const { data, error } = await runSupabaseQuery(query, 10000)

      if (error) {
        console.error('Erro ao buscar pedidos:', error)
        throw error
      }

      const nextOrders = data || []
      const nextIds = new Set(nextOrders.map(order => order.id))

      if (initializedRef.current) {
        nextOrders.forEach((order) => {
          if (!knownOrderIdsRef.current.has(order.id)) {
            console.log('[orders-realtime] novo pedido detectado por sincronizacao', order)
            onNewOrderRef.current?.(order)
          }
        })
      } else {
        initializedRef.current = true
      }

      knownOrderIdsRef.current = nextIds
      setOrders(nextOrders)
      setError(null)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [filtersKey])

  useEffect(() => {
    fetchOrders()

    // Limpar canal anterior se existir
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`orders-realtime:${filtersKey}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (orderMatchesFilters(payload.new, filters)) {
              setOrders(prev => [payload.new, ...prev].slice(0, ORDER_LIST_LIMIT))
              knownOrderIdsRef.current.add(payload.new.id)
              console.log('[orders-realtime] novo pedido recebido', payload.new)
              onNewOrderRef.current?.(payload.new)
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => {
              const matches = orderMatchesFilters(payload.new, filters)
              const exists = prev.some(order => order.id === payload.new.id)

              if (!matches) {
                return prev.filter(order => order.id !== payload.new.id)
              }

              if (!exists) {
                return [payload.new, ...prev].slice(0, ORDER_LIST_LIMIT)
              }

              return prev.map(order =>
                order.id === payload.new.id ? { ...order, ...payload.new } : order
              )
            })
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev =>
              prev.filter(order => order.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('[orders-realtime] status do canal', status)
        if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
          fetchOrders()
        }
      })

    channelRef.current = channel
    const pollId = window.setInterval(fetchOrders, ORDER_POLL_INTERVAL)

    return () => {
      window.clearInterval(pollId)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchOrders, filtersKey])

  const updateOrderLocally = useCallback((updatedOrder) => {
    if (!updatedOrder?.id) return

    setOrders(prev => {
      const matches = orderMatchesFilters(updatedOrder, filters)
      const exists = prev.some(order => order.id === updatedOrder.id)

      if (!matches) {
        return prev.filter(order => order.id !== updatedOrder.id)
      }

      if (!exists) {
        return [updatedOrder, ...prev].slice(0, ORDER_LIST_LIMIT)
      }

      return prev.map(order =>
        order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
      )
    })
  }, [filtersKey])

  return { orders, loading, error, refetch: fetchOrders, updateOrderLocally }
}

export const useRealtimeOrderById = (orderId) => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const { data, error } = await runSupabaseQuery(supabase
          .from('orders')
          .select(`
            *,
            order_items (*),
            customers (*),
            delivery_zones (*),
            coupons (*)
          `)
          .eq('id', orderId)
          .single(), 10000)

        if (error) throw error
        setOrder(data)
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }

    const channel = supabase
      .channel(`order-${orderId}-realtime`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  return { order, loading }
}
