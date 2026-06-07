import { Badge } from '../ui/Badge'
import { getMovementTypeBadgeClass, getMovementTypeLabel, getMovementSourceLabel, calculateMovementImpact, formatInventoryQuantity } from '../../utils/inventory'
import { formatDateTime } from '../../utils/formatDate'

const MovementTable = ({ movements, loading }) => {
  if (loading) {
    return <div className="text-white text-center py-8">Carregando...</div>
  }

  if (!movements || movements.length === 0) {
    return <div className="text-gray-400 text-center py-8">Nenhuma movimentação encontrada</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-600">
            <th className="text-left text-gray-400 text-sm py-3 px-4">Data</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Item</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Tipo</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Variação</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Antes</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Depois</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Origem</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Pedido</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Motivo</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Usuário</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id} className="border-b border-dark-700 hover:bg-dark-800 transition-colors">
              <td className="py-3 px-4 text-gray-400 text-sm">
                {formatDateTime(movement.created_at)}
              </td>
              <td className="py-3 px-4 text-white">
                {movement.inventory_item?.name || '-'}
              </td>
              <td className="py-3 px-4">
                <Badge className={getMovementTypeBadgeClass(movement.type)}>
                  {getMovementTypeLabel(movement.type)}
                </Badge>
              </td>
              <td className="py-3 px-4 text-white font-semibold">
                {calculateMovementImpact(movement)}
              </td>
              <td className="py-3 px-4 text-gray-300">
                {formatInventoryQuantity(movement.quantity_before, movement.inventory_item?.unit)}
              </td>
              <td className="py-3 px-4 text-white font-semibold">
                {formatInventoryQuantity(movement.quantity_after, movement.inventory_item?.unit)}
              </td>
              <td className="py-3 px-4 text-gray-400 text-sm">
                {getMovementSourceLabel(movement.source)}
              </td>
              <td className="py-3 px-4 text-gray-400 text-xs">
                {movement.reference_id ? movement.reference_id.slice(0, 8) : '-'}
              </td>
              <td className="py-3 px-4 text-gray-300 text-sm max-w-xs truncate">
                {movement.reason || '-'}
              </td>
              <td className="py-3 px-4 text-gray-400 text-sm">
                {movement.user?.email || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MovementTable
