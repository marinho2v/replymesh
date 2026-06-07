import { formatCurrency } from '../../utils/currency'
import { Tag, TrendingUp } from 'lucide-react'

const CouponUsageList = ({ coupons, loading, limit = 10 }) => {
  if (loading) {
    return <div className="text-white text-center py-8">Carregando...</div>
  }

  if (!coupons || coupons.length === 0) {
    return <div className="text-gray-400 text-center py-8">Nenhum cupom encontrado</div>
  }

  return (
    <div className="space-y-3">
      {coupons.slice(0, limit).map((coupon, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700/20 rounded-full flex items-center justify-center">
              <Tag size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold uppercase">{coupon.code}</p>
              <p className="text-gray-400 text-sm">{coupon.title || 'Sem título'}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <TrendingUp size={14} />
              <span>{coupon.used_count} usos</span>
            </div>
            <p className="text-white font-semibold">
              {coupon.discount_type === 'percentage' 
                ? `${coupon.discount_value}%` 
                : formatCurrency(coupon.discount_value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CouponUsageList
