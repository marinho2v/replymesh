import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'
import OrderStatusBadge from './OrderStatusBadge'
import OrderActions from './OrderActions'
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../lib/constants'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'

const orderItems = (order) => order.order_items || order.items || []

const formatAddress = (order) => {
  const address = order.address || order
  const parts = [
    address.street && `${address.street}${address.number ? `, ${address.number}` : ''}`,
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
  ].filter(Boolean)

  return parts.join(' | ') || '-'
}

const itemOptionsText = (item) => (
  (item.selected_options || [])
    .map(group => {
      const options = (group.options || []).join(', ')
      return options ? `${group.group_name}: ${options}` : ''
    })
    .filter(Boolean)
    .join(' | ')
)

const PaymentSummary = ({ order }) => (
  <div>
    <p>{PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method || '-'}</p>
    {order.payment_method === 'money' && (
      <p className="mt-1 text-xs text-gray-500">
        Troco: {order.needs_change ? `para ${formatCurrency(order.change_for)}` : 'nao precisa'}
      </p>
    )}
  </div>
)

const OrderItemsSummary = ({ order }) => {
  const items = orderItems(order)
  if (items.length === 0) return <span className="text-gray-500">Sem itens</span>

  return (
    <div className="space-y-1">
      {items.map(item => (
        <div key={item.id || `${item.product_name}-${item.quantity}`} className="text-sm">
          <p className="text-gray-200">{item.quantity}x {item.product_name}</p>
          {itemOptionsText(item) && (
            <p className="text-xs text-gray-500">{itemOptionsText(item)}</p>
          )}
        </div>
      ))}
    </div>
  )
}

const OrdersTable = ({
  orders,
  loading,
  error,
  onOrderUpdated,
  onWhatsappAction,
  onRailsStatusChange,
  onAssignMotoboy,
  motoboys = [],
  statusFlow,
  whatsappMode,
}) => {
  const navigate = useNavigate()
  const basePath = useCompanyBasePath()

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8">
        Carregando pedidos...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        {error}
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        Nenhum pedido encontrado
      </div>
    )
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="bg-dark-900 border border-dark-600 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Pedido</p>
                <p className="text-xl font-bold text-white">#{order.order_number}</p>
              </div>
              <OrderStatusBadge status={order.status} paymentStatus={order.payment_status} />
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Cliente</p>
                <p className="text-white font-medium break-words">{order.customer_name || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500">Telefone</p>
                  <p className="text-gray-300 break-words">{order.customer_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tipo</p>
                  <p className="text-gray-300">{ORDER_TYPE_LABELS[order.order_type] || order.order_type || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500">Pagamento</p>
                  <div className="text-gray-300"><PaymentSummary order={order} /></div>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="text-white font-semibold">{formatCurrency(order.total)}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Data</p>
                <p className="text-gray-400">{formatDateTime(order.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Itens</p>
                <OrderItemsSummary order={order} />
              </div>
              <div>
                <p className="text-gray-500">Endereco</p>
                <p className="text-gray-300 break-words">{formatAddress(order)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dark-700">
              <OrderActions
                order={order}
                onStatusChange={onOrderUpdated}
                onWhatsappAction={onWhatsappAction}
                onRailsStatusChange={onRailsStatusChange}
                onAssignMotoboy={onAssignMotoboy}
                motoboys={motoboys}
                statusFlow={statusFlow}
                whatsappMode={whatsappMode}
              />
              <button
                onClick={() => navigate(`${basePath}/admin/orders/${order.id}`)}
                className="min-h-10 px-3 rounded-lg border border-dark-600 text-gray-300 hover:text-white hover:bg-dark-800 transition-colors"
              >
                Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[1120px]">
        <thead>
          <tr className="border-b border-dark-600">
            <th className="text-left text-gray-400 text-sm py-3 px-4">Pedido</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Cliente</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Telefone</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Itens</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Endereco</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Tipo</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Pagamento</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Total</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Status</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Data</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-dark-700 hover:bg-dark-800 transition-colors">
              <td className="py-3 px-4">
                <span className="text-white font-semibold">#{order.order_number}</span>
              </td>
              <td className="py-3 px-4 text-white">{order.customer_name}</td>
              <td className="py-3 px-4 text-gray-300">{order.customer_phone}</td>
              <td className="py-3 px-4 text-gray-300">
                <OrderItemsSummary order={order} />
              </td>
              <td className="py-3 px-4 text-gray-300 max-w-[260px]">{formatAddress(order)}</td>
              <td className="py-3 px-4 text-gray-300">{ORDER_TYPE_LABELS[order.order_type]}</td>
              <td className="py-3 px-4 text-gray-300"><PaymentSummary order={order} /></td>
              <td className="py-3 px-4 text-white font-semibold">{formatCurrency(order.total)}</td>
              <td className="py-3 px-4">
                <OrderStatusBadge status={order.status} paymentStatus={order.payment_status} />
              </td>
              <td className="py-3 px-4 text-gray-400 text-sm">{formatDateTime(order.created_at)}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <OrderActions
                    order={order}
                    onStatusChange={onOrderUpdated}
                    onWhatsappAction={onWhatsappAction}
                    onRailsStatusChange={onRailsStatusChange}
                    onAssignMotoboy={onAssignMotoboy}
                    motoboys={motoboys}
                    statusFlow={statusFlow}
                    whatsappMode={whatsappMode}
                  />
                  <button
                    onClick={() => navigate(`${basePath}/admin/orders/${order.id}`)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  )
}

export default OrdersTable
