import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Search, Filter } from 'lucide-react'

const InventoryFilters = ({ filters, onChange, categories }) => {
  const categoryOptions = [
    { value: '', label: 'Todas' },
    ...(categories || []).map(cat => ({ value: cat, label: cat })),
  ]

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Ativos' },
    { value: 'false', label: 'Inativos' },
  ]

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={20} className="text-gray-400" />
        <h3 className="text-white font-semibold">Filtros</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar nome..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select
          options={categoryOptions}
          value={filters.category || ''}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
        />

        <Select
          options={statusOptions}
          value={filters.is_active || ''}
          onChange={(e) => onChange({ ...filters, is_active: e.target.value })}
        />

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.low_stock || false}
            onChange={(e) => onChange({ ...filters, low_stock: e.target.checked })}
            className="rounded"
          />
          <span className="text-white text-sm">Estoque baixo</span>
        </label>
      </div>
    </div>
  )
}

export default InventoryFilters
