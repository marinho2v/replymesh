import { AlertTriangle } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatInventoryQuantity } from '../../utils/inventory'

const LowStockList = ({ items, loading }) => {
  if (loading) {
    return <div className="text-white text-center py-8">Carregando...</div>
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <AlertTriangle size={48} className="mx-auto mb-4 text-gray-600" />
        <p>Nenhum item com estoque baixo</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-4 bg-dark-900 rounded-lg border border-yellow-600/30">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-500" />
            <div>
              <p className="text-white font-semibold">{item.name}</p>
              <p className="text-gray-400 text-sm">{item.category || 'Sem categoria'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-yellow-500">
              {formatInventoryQuantity(item.current_quantity, item.unit)}
            </p>
            <p className="text-gray-400 text-sm">
              Mínimo: {formatInventoryQuantity(item.minimum_quantity, item.unit)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LowStockList
