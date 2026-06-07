import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_METHODS, ORDER_STATUS_LABELS, ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../lib/constants'

const OrderFilters = ({ filters, onChange }) => {
  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    ...Object.values(ORDER_STATUSES).map(status => ({
      value: status,
      label: ORDER_STATUS_LABELS[status],
    })),
  ]

  const typeOptions = [
    { value: '', label: 'Todos os Tipos' },
    ...Object.values(ORDER_TYPES).map(type => ({
      value: type,
      label: ORDER_TYPE_LABELS[type],
    })),
  ]

  const paymentOptions = [
    { value: '', label: 'Todas as Formas' },
    ...Object.values(PAYMENT_METHODS).map(method => ({
      value: method,
      label: PAYMENT_METHOD_LABELS[method],
    })),
  ]

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600 p-3 sm:p-4 lg:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Input
          placeholder="Buscar cliente, telefone ou pedido..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />

        <Select
          options={statusOptions}
          value={filters.status || ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        />

        <Select
          options={typeOptions}
          value={filters.orderType || ''}
          onChange={(e) => onChange({ ...filters, orderType: e.target.value })}
        />

        <Select
          options={paymentOptions}
          value={filters.paymentMethod || ''}
          onChange={(e) => onChange({ ...filters, paymentMethod: e.target.value })}
        />

        <Input
          type="date"
          value={filters.date || ''}
          onChange={(e) => onChange({ ...filters, date: e.target.value })}
        />
      </div>
    </div>
  )
}

export default OrderFilters
