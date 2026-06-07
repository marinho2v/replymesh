import { Button } from '../ui/Button'
import { useOrderActions } from '../../hooks/useOrders'
import { getNextStatuses } from '../../utils/orderStatus.jsx'
import { ORDER_STATUSES } from '../../lib/constants'
import { CheckCircle, X, ChefHat, Package, Truck, CircleCheck, Bike } from 'lucide-react'
import { useState } from 'react'

const OrderActions = ({ order, onStatusChange, onRailsStatusChange, onAssignMotoboy, motoboys = [], statusFlow }) => {
  const { handleStatusChange } = useOrderActions()
  const [loadingStatus, setLoadingStatus] = useState(null)
  const [selectedMotoboyId, setSelectedMotoboyId] = useState(order.motoboy?.id || '')
  const [assigningMotoboy, setAssigningMotoboy] = useState(false)
  const railsMode = Boolean(onRailsStatusChange)

  if (order.payment_status === 'pending_payment') {
    return (
      <span className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs font-semibold text-yellow-200">
        Aguardando pagamento
      </span>
    )
  }

  const baseNextStatuses = getNextStatuses(order.status, order.order_type, 'admin', statusFlow)

  const allowedNextStatuses = railsMode &&
    order.order_type === 'delivery' &&
    baseNextStatuses.includes(ORDER_STATUSES.OUT_FOR_DELIVERY) &&
    !order.motoboy
    ? baseNextStatuses.filter(status => status !== ORDER_STATUSES.OUT_FOR_DELIVERY)
    : baseNextStatuses

  const nextStatuses = [
    ...allowedNextStatuses,
    ...(![ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(order.status) &&
      !allowedNextStatuses.includes(ORDER_STATUSES.CANCELLED)
      ? [ORDER_STATUSES.CANCELLED]
      : []),
  ]

  const getStatusButton = (status) => {
    const buttons = {
      [ORDER_STATUSES.ACCEPTED]: {
        label: 'Aceitar',
        icon: CheckCircle,
        variant: 'primary',
      },
      [ORDER_STATUSES.PREPARING]: {
        label: 'Marcar preparo',
        icon: ChefHat,
        variant: 'warning',
      },
      [ORDER_STATUSES.READY]: {
        label: 'Marcar pronto',
        icon: Package,
        variant: 'info',
      },
      [ORDER_STATUSES.OUT_FOR_DELIVERY]: {
        label: 'Saiu para entrega',
        icon: Truck,
        variant: 'primary',
      },
      [ORDER_STATUSES.COMPLETED]: {
        label: 'Finalizar',
        icon: CircleCheck,
        variant: 'success',
      },
      [ORDER_STATUSES.CANCELLED]: {
        label: 'Cancelar',
        icon: X,
        variant: 'danger',
      },
    }

    return buttons[status] || { label: status, icon: CircleCheck, variant: 'outline' }
  }

  const handleAction = async (status) => {
    if (loadingStatus) return

    setLoadingStatus(status)
    const result = railsMode
      ? await onRailsStatusChange(order, status)
      : await handleStatusChange(order, status, { prepareWhatsApp: true })
    setLoadingStatus(null)

    if (result.success && onStatusChange) {
      onStatusChange(result.order)
    }
  }

  const canAssignMotoboy = railsMode &&
    order.order_type === 'delivery' &&
    baseNextStatuses.includes(ORDER_STATUSES.OUT_FOR_DELIVERY) &&
    !order.motoboy &&
    onAssignMotoboy

  const handleAssign = async () => {
    if (!selectedMotoboyId || assigningMotoboy) return

    setAssigningMotoboy(true)
    const result = await onAssignMotoboy(order, selectedMotoboyId)
    setAssigningMotoboy(false)

    if (result.success && onStatusChange) {
      onStatusChange(result.order)
    }
  }

  if (nextStatuses.length === 0) {
    if (!canAssignMotoboy) return null
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canAssignMotoboy && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dark-600 bg-dark-900 p-2">
            {order.motoboy ? (
              <span className="text-xs font-semibold text-green-400">
                Motoboy: {order.motoboy.name}
              </span>
            ) : (
              <>
                <select
                  value={selectedMotoboyId}
                  onChange={(event) => setSelectedMotoboyId(event.target.value)}
                  className="min-h-9 rounded-lg border border-dark-600 bg-dark-800 px-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Selecionar motoboy</option>
                  {motoboys.map(motoboy => (
                    <option key={motoboy.id} value={motoboy.id}>
                      {motoboy.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="warning"
                  onClick={handleAssign}
                  disabled={!selectedMotoboyId || assigningMotoboy}
                  loading={assigningMotoboy}
                >
                  <Bike size={16} className="mr-1" />
                  Atribuir motoboy
                </Button>
              </>
            )}
          </div>
        )}

        {nextStatuses.map(status => {
          const button = getStatusButton(status)
          const Icon = button.icon

          return (
            <Button
              key={status}
              size="sm"
              variant={button.variant}
              onClick={() => handleAction(status)}
              disabled={Boolean(loadingStatus)}
              loading={loadingStatus === status}
            >
              <Icon size={16} className="mr-1" />
              {button.label}
            </Button>
          )
        })}
      </div>

    </>
  )
}

export default OrderActions
