import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Edit, Trash2, Plus, Minus, RotateCcw, History } from 'lucide-react'
import { getInventoryStatusMeta, formatInventoryQuantity } from '../../utils/inventory'
import { INVENTORY_STATUS } from '../../utils/inventory'

const InventoryTable = ({ items, loading, onEdit, onDelete, onEntry, onExit, onAdjust, onMovements }) => {
  if (loading) {
    return <div className="text-white text-center py-8">Carregando...</div>
  }

  if (!items || items.length === 0) {
    return <div className="text-gray-400 text-center py-8">Nenhum item encontrado</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-600">
            <th className="text-left text-gray-400 text-sm py-3 px-4">Nome</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">SKU</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Categoria</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Unidade</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Quantidade</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Mínimo</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Custo</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Venda</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Margem</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Status</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Ativo</th>
            <th className="text-left text-gray-400 text-sm py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const meta = getInventoryStatusMeta(item)
            const salePrice = Number(item.sale_price || 0)
            const costPrice = Number(item.cost_price || 0)
            const margin = salePrice > 0 ? ((salePrice - costPrice) / salePrice) * 100 : 0
            return (
              <tr key={item.id} className="border-b border-dark-700 hover:bg-dark-800 transition-colors">
                <td className="py-3 px-4 text-white font-semibold">{item.name}</td>
                <td className="py-3 px-4 text-gray-400">{item.sku || '-'}</td>
                <td className="py-3 px-4 text-gray-300">{item.category || '-'}</td>
                <td className="py-3 px-4 text-gray-300">{item.unit}</td>
                <td className="py-3 px-4 text-white">
                  {formatInventoryQuantity(item.current_quantity, item.unit)}
                </td>
                <td className="py-3 px-4 text-gray-400">
                  {formatInventoryQuantity(item.minimum_quantity, item.unit)}
                </td>
                <td className="py-3 px-4 text-gray-300">
                  {item.cost_price ? `R$ ${Number(item.cost_price).toFixed(2)}` : '-'}
                </td>
                <td className="py-3 px-4 text-gray-300">
                  {item.sale_price ? `R$ ${Number(item.sale_price).toFixed(2)}` : '-'}
                </td>
                <td className="py-3 px-4 text-gray-300">
                  {salePrice > 0 ? `${margin.toFixed(1)}%` : '-'}
                </td>
                <td className="py-3 px-4">
                  <Badge className={meta.badgeClass}>{meta.label}</Badge>
                </td>
                <td className="py-3 px-4">
                  {item.is_active ? (
                    <Badge variant="success">Sim</Badge>
                  ) : (
                    <Badge variant="danger">Não</Badge>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEntry(item)}>
                      <Plus size={16} className="text-green-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onExit(item)}>
                      <Minus size={16} className="text-red-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onAdjust(item)}>
                      <RotateCcw size={16} className="text-yellow-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onMovements(item)}>
                      <History size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default InventoryTable
