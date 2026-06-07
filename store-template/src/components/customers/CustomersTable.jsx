import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/formatDate'
import { Badge } from '../ui/Badge'
import { Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CustomersTable = ({ customers, loading }) => {
  const navigate = useNavigate()

  if (loading) {
    return <div className="text-white text-center py-8">Carregando...</div>
  }

  if (!customers || customers.length === 0) {
    return <div className="text-gray-400 text-center py-8">Nenhum cliente encontrado</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-600">
            <th className="text-left text-gray-400 text-sm py-3 px-4">Nome</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Telefone</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Bairro</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Cidade</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Pedidos</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Total Gasto</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Último Pedido</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr 
              key={customer.id} 
              className="border-b border-dark-700 hover:bg-dark-800 transition-colors cursor-pointer"
              onClick={() => navigate(`/admin/customers/${customer.id}`)}
            >
              <td className="py-3 px-4 text-white font-semibold">{customer.full_name}</td>
              <td className="py-3 px-4 text-gray-300">{customer.phone}</td>
              <td className="py-3 px-4 text-gray-300">{customer.neighborhood || '-'}</td>
              <td className="py-3 px-4 text-gray-300">{customer.city || '-'}</td>
              <td className="py-3 px-4 text-white">{customer.total_orders}</td>
              <td className="py-3 px-4 text-white font-semibold">{formatCurrency(customer.total_spent)}</td>
              <td className="py-3 px-4 text-gray-400 text-sm">
                {customer.last_order_at ? formatDate(customer.last_order_at) : '-'}
              </td>
              <td className="py-3 px-4">
                {customer.is_recurring && (
                  <Badge variant="primary">
                    <Star size={12} className="mr-1" />
                    Recorrente
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CustomersTable
