import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useKitchenOrders } from '../../hooks/useKitchenOrders'
import KitchenOrderCard from '../../components/kitchen/KitchenOrderCard'
import KitchenHeader from '../../components/kitchen/KitchenHeader'
import NotificationSoundControl from '../../components/shared/NotificationSoundControl'
import { ORDER_STATUSES } from '../../lib/constants'
import { Clock, ChefHat, Package, CheckCircle, Utensils } from 'lucide-react'
import { toast } from 'sonner'
import { useNotificationSound } from '../../hooks/useNotificationSound'
import { railsGetWhatsappTemplates } from '../../services/storeApi'
import { flowFromWhatsappTemplates } from '../../utils/orderStatus.jsx'

const KitchenBoard = () => {
  const { profile } = useAuth()
  const [statusFlow, setStatusFlow] = useState()
  const notificationSound = useNotificationSound('kitchen')
  const { orders, loading, error, updateOrderLocally } = useKitchenOrders({
    onNewOrder: notificationSound.notifyNewOrder,
  })

  useEffect(() => {
    if (profile && !['admin', 'kitchen'].includes(profile.role)) {
      toast.error('Acesso não autorizado')
    }
  }, [profile])

  const loadStatusFlow = useCallback(async () => {
    try {
      const templates = await railsGetWhatsappTemplates()
      setStatusFlow(flowFromWhatsappTemplates(templates))
    } catch {
      // Cozinha continua com fluxo padrao se templates nao carregarem.
    }
  }, [])

  useEffect(() => {
    loadStatusFlow()
  }, [loadStatusFlow])

  const columns = [
    { status: ORDER_STATUSES.PENDING, title: 'Pendentes', icon: Clock, color: 'border-yellow-500' },
    { status: ORDER_STATUSES.ACCEPTED, title: 'Aceitos', icon: CheckCircle, color: 'border-blue-500' },
    { status: ORDER_STATUSES.PREPARING, title: 'Em Preparo', icon: ChefHat, color: 'border-orange-500' },
    { status: ORDER_STATUSES.READY, title: 'Prontos / Mesa', icon: Utensils, color: 'border-purple-500' },
  ]

  const getOrdersByStatus = (status) => {
    return orders?.filter(order => order.status === status) || []
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark-950">
        <div className="text-white">Carregando...</div>
    </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-dark-950">
      <KitchenHeader />

      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-red-700 bg-red-900/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="px-4 pt-4">
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
        />
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4 h-full min-w-max">
          {columns.map((column) => {
            const Icon = column.icon
            const columnOrders = getOrdersByStatus(column.status)

            return (
              <div key={column.status} className={`w-80 flex-shrink-0 flex flex-col bg-dark-900 rounded-xl border-2 ${column.color}`}>
                <div className="p-4 border-b border-dark-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={20} className="text-gray-400" />
                    <h2 className="text-lg font-bold text-white">{column.title}</h2>
                  </div>
                  <span className="bg-dark-800 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {columnOrders.map((order) => (
                    <KitchenOrderCard 
                      key={order.id} 
                      order={order} 
                      onStatusChange={updateOrderLocally}
                      statusFlow={statusFlow}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default KitchenBoard
