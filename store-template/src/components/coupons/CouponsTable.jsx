import { formatCurrency } from '../../utils/currency'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Tag, Percent, DollarSign, Edit, Trash2 } from 'lucide-react'
import { DISCOUNT_TYPES } from '../../lib/constants'

const CouponsTable = ({ coupons, loading, onEdit, onDelete }) => {
  if (loading) {
    return <div className="text-white text-center py-8">Carregando...</div>
  }

  if (!coupons || coupons.length === 0) {
    return <div className="text-gray-400 text-center py-8">Nenhum cupom encontrado</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-600">
            <th className="text-left text-gray-400 text-sm py-3 px-4">Código</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Título</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Tipo</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Valor</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Mínimo</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Usos</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Expira</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Status</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => (
            <tr key={coupon.id} className="border-b border-dark-700 hover:bg-dark-800 transition-colors">
              <td className="py-3 px-4">
                <span className="text-white font-bold uppercase">{coupon.code}</span>
              </td>
              <td className="py-3 px-4 text-white">{coupon.title || '-'}</td>
              <td className="py-3 px-4 text-gray-300">
                {coupon.discount_type === DISCOUNT_TYPES.PERCENTAGE ? (
                  <span className="flex items-center gap-2">
                    <Percent size={16} className="text-gray-400" />
                    Porcentagem
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <DollarSign size={16} className="text-gray-400" />
                    Valor Fixo
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-white font-semibold">
                {coupon.discount_type === DISCOUNT_TYPES.PERCENTAGE
                  ? `${coupon.discount_value}%`
                  : formatCurrency(coupon.discount_value)}
              </td>
              <td className="py-3 px-4 text-gray-300">
                {coupon.minimum_order_amount > 0 ? formatCurrency(coupon.minimum_order_amount) : '-'}
              </td>
              <td className="py-3 px-4 text-gray-300">
                {coupon.max_uses ? `${coupon.used_count}/${coupon.max_uses}` : `${coupon.used_count}`}
              </td>
              <td className="py-3 px-4 text-gray-400 text-sm">
                {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="py-3 px-4">
                {coupon.is_active ? (
                  <Badge variant="success">Ativo</Badge>
                ) : (
                  <Badge variant="danger">Inativo</Badge>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(coupon)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(coupon.id)}>
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CouponsTable
