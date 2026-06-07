import { getOrderStatusMeta } from '../../utils/orderStatus.jsx'

const OrderStatusBadge = ({ status, paymentStatus, size = 'sm' }) => {
  const meta = paymentStatus === 'pending_payment'
    ? {
        label: 'Aguardando pagamento',
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-300',
        borderColor: 'border-yellow-500/40',
      }
    : paymentStatus === 'expired'
      ? {
          label: 'Pix expirado',
          bgColor: 'bg-red-500/10',
          textColor: 'text-red-300',
          borderColor: 'border-red-500/40',
        }
      : getOrderStatusMeta(status)

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-sm',
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${meta.bgColor} ${meta.textColor} border ${meta.borderColor} ${sizeClasses[size]}`}>
      {meta.label}
    </span>
  )
}

export default OrderStatusBadge
