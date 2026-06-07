import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/formatDate'
import { User, ShoppingCart, DollarSign } from 'lucide-react'

const RecentCustomersList = ({ customers, loading, limit = 10 }) => {
  if (loading) {
    return <div className="text-white text-center py-8">Carregando...</div>
  }

  if (!customers || customers.length === 0) {
    return <div className="text-gray-400 text-center py-8">Nenhum cliente encontrado</div>
  }

  return (
    <div className="space-y-3">
      {customers.slice(0, limit).map((customer, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700/20 rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">{customer.full_name}</p>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>{customer.phone}</span>
                {customer.neighborhood && <span>• {customer.neighborhood}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <ShoppingCart size={14} />
              <span>{customer.total_orders}</span>
            </div>
            <p className="text-white font-semibold">{formatCurrency(customer.total_spent)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default RecentCustomersList
