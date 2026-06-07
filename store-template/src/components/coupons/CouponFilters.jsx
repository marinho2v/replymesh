import { Select } from '../ui/Input'
import { Input } from '../ui/Input'
import { Filter, Search } from 'lucide-react'

const CouponFilters = ({ filters, onChange }) => {
  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Ativos' },
    { value: 'false', label: 'Inativos' },
  ]

  const typeOptions = [
    { value: '', label: 'Todos' },
    { value: 'percentage', label: 'Porcentagem' },
    { value: 'fixed', label: 'Valor Fixo' },
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
            placeholder="Buscar código ou título..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select
          options={statusOptions}
          value={filters.is_active || ''}
          onChange={(e) => onChange({ ...filters, is_active: e.target.value })}
        />

        <Select
          options={typeOptions}
          value={filters.discount_type || ''}
          onChange={(e) => onChange({ ...filters, discount_type: e.target.value })}
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

export default CouponFilters
