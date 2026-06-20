import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '../../components/ui/Card'
import OrderFilters from '../../components/dashboard/OrderFilters'
import OrdersTable from '../../components/dashboard/OrdersTable'
import NotificationSoundControl from '../../components/shared/NotificationSoundControl'
import { useNotificationSound } from '../../hooks/useNotificationSound'
import {
  getStoreOrders,
  railsAssignMotoboyToOrder,
  railsGetMotoboys,
  railsGetWhatsappTemplates,
  updateStoreOrderStatus,
} from '../../services/storeApi'
import { flowFromWhatsappTemplates } from '../../utils/orderStatus.jsx'

const POLL_INTERVAL = 5000
const STATUS_SUMMARY_LABELS = {
  pending: 'Pendentes',
  accepted: 'Aceitos',
  preparing: 'Em preparo',
  ready: 'Prontos',
  out_for_delivery: 'Saiu para entrega',
}

const buildRailsParams = (filters) => ({
  q: filters.search,
  status: filters.status,
  type: filters.orderType,
  date_from: filters.date,
  date_to: filters.date,
  limit: 80,
})

const normalizeOrder = (order) => ({
  ...order,
  total: order.total ?? order.total_brl ?? Number(order.total_cents || 0) / 100,
  subtotal: order.subtotal ?? Number(order.subtotal_cents || 0) / 100,
  delivery_fee: order.delivery_fee ?? Number(order.delivery_fee_cents || 0) / 100,
  discount_amount: order.discount_amount ?? Number(order.discount_cents || 0) / 100,
  order_items: order.order_items || order.items || [],
})

const applyClientFilters = (orders, filters) => (
  orders.filter(order => {
    if (filters.paymentMethod && order.payment_method !== filters.paymentMethod) return false
    return true
  })
)

const Orders = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    orderType: '',
    paymentMethod: '',
    date: '',
  })
  const [orders, setOrders] = useState([])
  const [motoboys, setMotoboys] = useState([])
  const [statusFlow, setStatusFlow] = useState()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const notificationSound = useNotificationSound('admin-orders')
  const notifyNewOrderRef = useRef(notificationSound.notifyNewOrder)

  useEffect(() => {
    notifyNewOrderRef.current = notificationSound.notifyNewOrder
  }, [notificationSound.notifyNewOrder])

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const payload = await getStoreOrders({ params: buildRailsParams(filters) })
      const nextOrders = applyClientFilters((payload.orders || []).map(normalizeOrder), filters)

      setOrders(prev => {
        if (prev.length > 0) {
          const previousIds = new Set(prev.map(order => order.id))
          nextOrders.forEach(order => {
            if (!previousIds.has(order.id)) notifyNewOrderRef.current?.(order)
          })
        }

        return nextOrders
      })
      setError(null)
    } catch (err) {
      setError(err.message || 'Nao foi possivel carregar pedidos Rails')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [filters])

  const loadMotoboys = useCallback(async () => {
    try {
      const data = await railsGetMotoboys({ params: { active: 'true' } })
      setMotoboys(data || [])
    } catch (err) {
      console.error('Erro ao carregar motoboys:', err)
    }
  }, [])

  const loadStatusFlow = useCallback(async () => {
    try {
      const templates = await railsGetWhatsappTemplates()
      setStatusFlow(flowFromWhatsappTemplates(templates))
    } catch (err) {
      console.error('Erro ao carregar templates WhatsApp:', err)
    }
  }, [])

  useEffect(() => {
    loadOrders()
    loadMotoboys()
    loadStatusFlow()
    const pollId = window.setInterval(() => loadOrders({ silent: true }), POLL_INTERVAL)

    return () => window.clearInterval(pollId)
  }, [loadOrders, loadMotoboys, loadStatusFlow])

  const updateOrderLocally = useCallback((updatedOrder) => {
    const normalizedOrder = normalizeOrder(updatedOrder)
    setOrders(prev => prev.map(order => (
      order.id === normalizedOrder.id ? { ...order, ...normalizedOrder } : order
    )))
  }, [])

  const handleRailsStatusChange = async (order, status) => {
    try {
      const updatedOrder = await updateStoreOrderStatus(order.id, status, { skipSideEffects: status !== 'cancelled' })
      updateOrderLocally(updatedOrder)
      toast.success(`Pedido #${order.order_number} atualizado`)
      return { success: true, order: normalizeOrder(updatedOrder) }
    } catch (err) {
      toast.error(err.message || 'Nao foi possivel atualizar o pedido')
      return { success: false, error: err.message }
    }
  }

  const handleAssignMotoboy = async (order, motoboyId) => {
    try {
      const updatedOrder = await railsAssignMotoboyToOrder(order.id, motoboyId)
      updateOrderLocally(updatedOrder)
      toast.success(`Motoboy atribuido ao pedido #${order.order_number}`)
      return { success: true, order: normalizeOrder(updatedOrder) }
    } catch (err) {
      toast.error(err.message || 'Nao foi possivel atribuir motoboy')
      return { success: false, error: err.message }
    }
  }

  const statusSummary = useMemo(() => (
    orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})
  ), [orders])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Pedidos</h1>
          <p className="mt-1 text-sm text-gray-400">
            Listagem conectada ao Rails em modo hibrido. Supabase Auth continua preservado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(STATUS_SUMMARY_LABELS).map(([status, label]) => (
          <div key={status} className="rounded-lg border border-dark-600 bg-dark-800 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-white">{statusSummary[status] || 0}</p>
          </div>
        ))}
      </div>

      <NotificationSoundControl
        enabled={notificationSound.enabled}
        browserNotificationsSupported={notificationSound.browserNotificationsSupported}
        browserNotificationsEnabled={notificationSound.browserNotificationsEnabled}
        lastError={notificationSound.lastError}
        lastBrowserNotificationError={notificationSound.lastBrowserNotificationError}
        onEnable={notificationSound.enableSound}
        onEnableBrowserNotifications={notificationSound.enableBrowserNotifications}
        onDisableBrowserNotifications={notificationSound.disableBrowserNotifications}
        onDisable={notificationSound.disableSound}
        onTest={notificationSound.testSound}
        className="mb-0"
      />

      <OrderFilters filters={filters} onChange={handleFilterChange} />

      <Card>
        <CardContent className="p-3 sm:p-6">
          <OrdersTable
            orders={orders}
            loading={loading}
            error={error}
            onOrderUpdated={updateOrderLocally}
            onRailsStatusChange={handleRailsStatusChange}
            onAssignMotoboy={handleAssignMotoboy}
            motoboys={motoboys}
            statusFlow={statusFlow}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default Orders
