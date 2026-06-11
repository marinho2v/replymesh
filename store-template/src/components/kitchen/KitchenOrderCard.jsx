import { formatCurrency } from '../../utils/currency'
import { getNextStatuses, getOrderStatusMeta, getElapsedTime, isOrderDelayed } from '../../utils/orderStatus.jsx'
import { ORDER_STATUSES, ORDER_TYPES } from '../../lib/constants'
import { CheckCircle, ChefHat, Package, Clock, Printer, Utensils } from 'lucide-react'
import { Button } from '../ui/Button'
import { useState } from 'react'
import SelectedOptionsSummary from '../shared/SelectedOptionsSummary'
import { formatSelectedOptions } from '../../utils/productOptions'
import { updateStoreOrderStatus } from '../../services/storeApi'
import { toast } from 'sonner'

const actionButtonFor = (status, orderType) => {
  const isDineIn = orderType === ORDER_TYPES.DINE_IN
  const isPickup = orderType === ORDER_TYPES.PICKUP
  const buttons = {
    [ORDER_STATUSES.ACCEPTED]: { label: isDineIn ? 'Aceitar / cozinha' : 'Aceitar', icon: CheckCircle, variant: 'primary' },
    [ORDER_STATUSES.PREPARING]: { label: 'Marcar preparo', icon: ChefHat, variant: 'warning' },
    [ORDER_STATUSES.READY]: {
      label: isDineIn ? 'Pronto para mesa' : isPickup ? 'Pronto para retirada' : 'Marcar pronto',
      icon: Package,
      variant: 'info',
    },
  }

  return buttons[status] || null
}

const KitchenOrderCard = ({ order, onStatusChange, statusFlow }) => {
  const [loadingStatus, setLoadingStatus] = useState(null)
  const meta = getOrderStatusMeta(order.status)
  const elapsedTime = getElapsedTime(order.created_at)
  const isDelayed = isOrderDelayed(order.created_at, 30)
  const isDineIn = order.order_type === ORDER_TYPES.DINE_IN
  const isQrOrder = order.source === 'table_qr'
  const originLabel = isQrOrder
    ? 'Mesa via QR Code'
    : isDineIn
      ? 'Mesa via atendente'
      : order.order_type === ORDER_TYPES.DELIVERY
        ? 'Delivery'
        : 'Retirada'

  const handlePrint = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; font-size: 12px; max-width: 80mm; margin: 0 auto;">
        <h2 style="text-align: center; margin-bottom: 10px;">PEDIDO #${order.order_number}</h2>
        <p><strong>Cliente:</strong> ${order.customer_name || ''}</p>
        <p><strong>Telefone:</strong> ${order.customer_phone || order.customer_whatsapp || ''}</p>
        <p><strong>Tipo:</strong> ${originLabel}</p>
        ${order.order_type === 'delivery' ? `
          <hr style="margin: 10px 0;">
          <h3 style="margin: 10px 0 5px;">Endereco de Entrega:</h3>
          <p>${order.address?.street || order.street || ''}, ${order.address?.number || order.number || ''}</p>
          ${order.address?.complement || order.complement ? `<p>Complemento: ${order.address?.complement || order.complement}</p>` : ''}
          <p>Bairro: ${order.address?.neighborhood || order.neighborhood || ''}</p>
          ${order.address?.reference || order.reference ? `<p>Referencia: ${order.address?.reference || order.reference}</p>` : ''}
        ` : `<hr style="margin: 10px 0;"><p><strong>${order.order_type === 'dine_in' ? 'Consumo no local' : 'Retirada no local'}</strong></p>`}
        <hr style="margin: 10px 0;">
        <h3 style="margin: 10px 0 5px;">Itens:</h3>
        ${order.order_items?.map(item => `
          <p>${item.quantity}x ${item.product_name} - R$ ${(item.total_price || 0).toFixed(2)}</p>
          ${formatSelectedOptions(item.selected_options).map(line => `<p style="font-size: 10px; color: #333; margin-left: 8px;">${line}</p>`).join('')}
          ${item.notes ? `<p style="font-size: 10px; margin-left: 8px;"><strong>Obs item:</strong> ${item.notes}</p>` : ''}
        `).join('') || ''}
        <hr style="margin: 10px 0;">
        <p style="font-size: 14px; font-weight: bold; text-align: right;">Total: R$ ${(order.total || 0).toFixed(2)}</p>
        <p style="font-size: 12px; text-align: right;">Pagamento: ${order.payment_method === 'money' ? 'Dinheiro' : order.payment_method === 'pix' ? 'Pix' : 'Cartao'}</p>
        ${order.payment_method === 'money' ? `<p style="font-size: 12px; text-align: right;">Troco: ${order.needs_change ? `para R$ ${Number(order.change_for || 0).toFixed(2)}` : 'nao precisa'}</p>` : ''}
        ${order.notes ? `<hr style="margin: 10px 0;"><p style="margin-top: 10px;"><strong>Obs:</strong> ${order.notes}</p>` : ''}
        <hr style="margin: 10px 0;">
        <p style="margin-top: 10px; font-size: 10px; text-align: center;">${new Date().toLocaleString('pt-BR')}</p>
      </div>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Pedido #${order.order_number}</title>
          <style>
            body { margin: 0; padding: 10px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleStatusClick = async (status) => {
    if (loadingStatus) return

    setLoadingStatus(status)
    try {
      const updatedOrder = await updateStoreOrderStatus(order.id, status, { skipSideEffects: true })
      onStatusChange?.(updatedOrder)
      toast.success(`Pedido #${order.order_number} atualizado`)
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel atualizar o pedido')
    } finally {
      setLoadingStatus(null)
    }
  }

  const getActionButton = () => {
    const nextStatus = getNextStatuses(order.status, order.order_type, 'kitchen', statusFlow)
      .find(status => status !== ORDER_STATUSES.CANCELLED)
    const button = actionButtonFor(nextStatus, order.order_type)
    if (!nextStatus || !button) return null

    const Icon = button.icon

    return (
      <Button
        size="sm"
        variant={button.variant}
        onClick={() => handleStatusClick(nextStatus)}
        loading={loadingStatus === nextStatus}
        disabled={Boolean(loadingStatus)}
        className="w-full"
      >
        <Icon size={16} className="mr-1" />
        {button.label}
      </Button>
    )
  }

  return (
    <div className={`bg-dark-800 rounded-xl border-2 ${isQrOrder ? 'border-lime-500' : order.order_type === ORDER_TYPES.DINE_IN ? 'border-emerald-500' : isDelayed && order.status !== ORDER_STATUSES.READY ? 'border-red-500' : meta.borderColor} p-4 ${isDelayed && !isDineIn && order.status !== ORDER_STATUSES.READY ? 'animate-pulse' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xl font-bold text-white">#{order.order_number}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
              isDineIn
                ? 'bg-emerald-500/20 text-emerald-300'
                : order.order_type === ORDER_TYPES.DELIVERY
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-amber-500/20 text-amber-300'
            }`}>
              {isDineIn ? 'MESA / SALAO' : order.order_type === ORDER_TYPES.DELIVERY ? 'DELIVERY' : 'RETIRADA'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${meta.bgColor} ${meta.textColor}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-white font-semibold">
            {isDineIn
              ? order.dining_tables?.name || order.customer_name || 'Mesa'
              : order.customer_name}
          </p>
          {order.customer_phone && (
            <p className="text-xs text-gray-400">{order.customer_phone}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock size={16} />
          <span>{elapsedTime}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="text-gray-400">
          {isDineIn
            ? <Utensils size={16} />
            : order.order_type === ORDER_TYPES.DELIVERY ? 'Entrega' : 'Retirada'}
        </span>
        <span className="text-gray-300">
          {isDineIn
            ? originLabel
            : order.order_type === ORDER_TYPES.DELIVERY ? order.address?.neighborhood || order.neighborhood : 'Retirada'}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        {order.order_items?.map((item, index) => (
          <div key={item.id || index} className="text-sm text-gray-300">
            <span className="text-white">{item.quantity}x</span> {item.product_name}
            <SelectedOptionsSummary selectedOptions={item.selected_options} />
            {item.notes && <p className="mt-1 text-xs text-gray-500">Obs item: {item.notes}</p>}
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="bg-dark-900 p-2 rounded mb-3">
          <p className="text-gray-400 text-xs">{order.notes}</p>
        </div>
      )}

      <div className="text-right mb-3">
        <span className="text-lg font-bold text-white">{formatCurrency(order.total)}</span>
        {order.payment_method === 'money' && (
          <p className="mt-1 text-xs text-gray-400">
            Troco: {order.needs_change ? `para ${formatCurrency(order.change_for)}` : 'nao precisa'}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handlePrint}
          className="flex-1"
        >
          <Printer size={16} className="mr-1" />
          Imprimir
        </Button>
        {getActionButton()}
      </div>
    </div>
  )
}

export default KitchenOrderCard
