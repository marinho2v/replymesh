import { useState } from 'react'
import { useCustomers } from '../../hooks/useCustomers'
import { exportCustomersToCsv } from '../../services/customers'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Download, Phone, MapPin, ShoppingCart, DollarSign, Star, Users, RefreshCw } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/formatDate'
import { useNavigate } from 'react-router-dom'

const SORT_OPTIONS = [
  { value: 'last_order', label: 'Últimos pedidos' },
  { value: 'total_orders', label: 'Mais pedidos' },
  { value: 'total_spent', label: 'Maior gasto' },
  { value: 'name', label: 'Nome A-Z' },
]

const formatPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return value || '-'
}

const getInitials = (name) => {
  const parts = String(name || '').trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const avatarColors = [
  'bg-blue-600', 'bg-purple-600', 'bg-pink-600',
  'bg-indigo-600', 'bg-teal-600', 'bg-orange-600',
]

const getAvatarColor = (name) => {
  const index = Math.abs(String(name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % avatarColors.length
  return avatarColors[index]
}

const CustomerCard = ({ customer, onClick }) => {
  const initials = getInitials(customer.full_name)
  const avatarColor = getAvatarColor(customer.full_name)
  const isNew = customer.total_orders <= 1

  return (
    <Card
      className="cursor-pointer transition-all hover:border-white/40 hover:shadow-xl"
      onClick={onClick}
    >
      <CardContent className="p-3.5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${avatarColor} text-sm font-bold text-white`}>
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-white">{customer.full_name}</h3>
              {customer.is_recurring && (
                <Badge variant="primary" className="shrink-0 text-[10px] px-1.5 py-0 gap-0.5">
                  <Star size={9} className="mr-0.5" />
                  Recorrente
                </Badge>
              )}
              {isNew && !customer.is_recurring && (
                <Badge variant="success" className="shrink-0 text-[10px] px-1.5 py-0">
                  Novo
                </Badge>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
              {customer.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={11} />
                  {formatPhone(customer.phone)}
                </span>
              )}
              {customer.neighborhood && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {customer.neighborhood}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="flex items-center justify-end gap-1 text-sm font-bold text-green-400">
              <DollarSign size={13} />
              {formatCurrency(customer.total_spent)}
            </div>
            <div className="mt-0.5 flex items-center justify-end gap-1 text-xs text-gray-400">
              <ShoppingCart size={11} />
              {customer.total_orders} ped.
            </div>
            {customer.last_order_at && (
              <p className="mt-0.5 text-[10px] text-gray-500">{formatDate(customer.last_order_at)}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const Customers = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [showRecurringOnly, setShowRecurringOnly] = useState(false)
  const [sortBy, setSortBy] = useState('last_order')
  const { customers, loading } = useCustomers({ sortBy })

  const filteredCustomers = customers?.filter(customer => {
    const name = String(customer.full_name || '')
    const phone = String(customer.phone || customer.whatsapp || '')
    const matchesSearch = !searchTerm ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm)
    const matchesRecurring = !showRecurringOnly || customer.is_recurring
    return matchesSearch && matchesRecurring
  })

  const totalSpent = filteredCustomers?.reduce((sum, c) => sum + Number(c.total_spent || 0), 0) || 0
  const recurringCount = filteredCustomers?.filter(c => c.is_recurring).length || 0

  const handleExport = () => {
    exportCustomersToCsv(filteredCustomers || [])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="mt-0.5 text-sm text-gray-400">Base de clientes da sua loja.</p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download size={16} className="mr-1.5" />
          Exportar
        </Button>
      </div>

      {customers && customers.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-3">
              <Users size={18} className="text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Total de clientes</p>
                <p className="text-lg font-bold text-white">{customers.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-3">
              <Star size={18} className="text-yellow-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Recorrentes</p>
                <p className="text-lg font-bold text-white">{recurringCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-3">
              <DollarSign size={18} className="text-green-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Faturamento total</p>
                <p className="text-lg font-bold text-white">{formatCurrency(totalSpent)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="block shrink-0">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-11 rounded-lg border border-dark-600 bg-dark-900 px-3 text-sm text-white outline-none focus:border-white"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex shrink-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showRecurringOnly}
                  onChange={(e) => setShowRecurringOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-300 whitespace-nowrap">Só recorrentes</span>
              </label>
            </div>
          </div>
          {filteredCustomers && (
            <p className="mt-2 text-xs text-gray-500">
              {filteredCustomers.length} cliente{filteredCustomers.length !== 1 ? 's' : ''} encontrado{filteredCustomers.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw size={18} className="mr-2 animate-spin" />
          Carregando clientes...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {filteredCustomers?.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onClick={() => navigate(`/admin/customers/${customer.id}`)}
            />
          ))}

          {filteredCustomers?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-dark-600 py-16 text-center">
              <Users size={36} className="mb-2 text-gray-600" />
              <p className="text-sm font-medium text-gray-400">Nenhum cliente encontrado</p>
              {searchTerm && (
                <p className="mt-1 text-xs text-gray-500">Tente buscar por outro nome ou telefone.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Customers
