import { formatCurrency } from '../../utils/currency'
import { TrendingUp } from 'lucide-react'

const TopProductsList = ({ products, loading, limit = 10 }) => {
  if (loading) {
    return <div className="text-white text-center py-8">Carregando...</div>
  }

  if (!products || products.length === 0) {
    return <div className="text-gray-400 text-center py-8">Nenhum produto encontrado</div>
  }

  return (
    <div className="space-y-3">
      {products.slice(0, limit).map((product, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm w-6">{index + 1}</span>
            <div>
              <p className="text-white font-semibold">{product.name}</p>
              <p className="text-gray-400 text-sm">{product.quantity} vendidos</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-bold">{formatCurrency(product.revenue)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TopProductsList
