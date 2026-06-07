import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'
import { getOrderStatusLabel, getOrderStatusColor } from '../../utils/orderStatus.jsx'
import { Badge } from '../ui/Badge'

const CustomerOrdersList = ({ orders, loading }) => {
  if (loading) {
    return <div className="text-white text-center py-8">Carregando...</div>
  }

  if (!orders || orders.length === 0) {
    return <div className="text-gray-400 text-center py-8">Nenhum pedido encontrado</div>
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="bg-dark-900 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white font-semibold">Pedido #{order.order_number}</span>
                <Badge className={getOrderStatusColor(order.status)}>
                  {getOrderStatusLabel(order.status)}
                </Badge>
              </div>
              <p className="text-gray-400 text-sm">{formatDateTime(order.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white">{formatCurrency(order.total)}</p>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {order.order_items?.map((item, index) => (
              <p key={index} className="text-gray-300 text-sm">
                {item.quantity}x {item.product_name}
              </p>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-dark-700 flex items-center gap-4 text-sm text-gray-400">
            <span>{order.order_type === 'delivery' ? '🚚 Entrega' : '🏪 Retirada'}</span>
            <span>{order.payment_method === 'pix' ? '💰 Pix' : order.payment_method === 'money' ? '💵 Dinheiro' : '💳 Cartão'}</span>
            {order.coupon_code && <span>🏷️ {order.coupon_code}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default CustomerOrdersList
