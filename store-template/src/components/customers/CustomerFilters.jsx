import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Search, Filter } from 'lucide-react'

const CustomerFilters = ({ filters, onChange }) => {
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Recorrentes' },
    { value: 'false', label: 'Novos' },
  ]

  const sortByOptions = [
    { value: 'recent', label: 'Mais Recentes' },
    { value: 'most_orders', label: 'Mais Pedidos' },
    { value: 'most_spent', label: 'Maior Valor' },
  ]

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-600 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={20} className="text-gray-400" />
        <h3 className="text-white font-semibold">Filtros</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar nome ou telefone..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select
          options={statusOptions}
          value={filters.is_recurring || ''}
          onChange={(e) => onChange({ ...filters, is_recurring: e.target.value })}
        />

        <Select
          options={sortByOptions}
          value={filters.sortBy || 'recent'}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
        />

        <Input
          type="date"
          label="Data Inicial"
          value={filters.startDate || ''}
          onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
        />
      </div>
    </div>
  )
}

export default CustomerFilters
