import { useMemo, useState } from 'react'
import { Bike, Download, Edit, MinusCircle, Plus, PlusCircle, RefreshCw, Save, Search, Trash2, Truck, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { useDeliveryDashboard, useDeliveryHistory, useMotoboyAdjustments, useMotoboys } from '../../hooks/useMotoboys'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'
import { exportToCsv, exportToXlsx } from '../../utils/exportCsv'
import { buildAddress } from '../../utils/whatsappTemplates'

const emptyMotoboy = {
  name: '',
  phone: '',
  password: '',
  active: true,
  notes: '',
}

const emptyAdjustment = {
  motoboy_id: '',
  type: 'advance',
  direction: 'debit',
  amount: '',
  adjustment_date: new Date().toISOString().slice(0, 10),
  description: '',
}

const deliveryStatusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'assigned', label: 'Atribuido' },
  { value: 'on_the_way', label: 'Em rota' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
]

const adjustmentTypeOptions = [
  { value: 'daily_rate', label: 'Diaria' },
  { value: 'advance', label: 'Vale' },
  { value: 'meal', label: 'Lanche' },
  { value: 'discount', label: 'Desconto' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'adjustment', label: 'Ajuste' },
]

const adjustmentDirectionOptions = [
  { value: 'debit', label: 'Descontar do motoboy' },
  { value: 'credit', label: 'Adicionar para o motoboy' },
]

const getAdjustmentTypeLabel = (type) => (
  adjustmentTypeOptions.find(option => option.value === type)?.label || 'Ajuste'
)

const getDeliveryStatusLabel = (status) => ({
  pending: 'Pendente',
  assigned: 'Atribuido',
  on_the_way: 'Em rota',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}[status] || status || 'Pendente')

const getDeliveryStatusVariant = (status) => ({
  assigned: 'info',
  on_the_way: 'warning',
  delivered: 'success',
  cancelled: 'danger',
}[status] || 'default')

const todayRange = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const toIsoStart = (date) => date ? new Date(`${date}T00:00:00`).toISOString() : undefined
const toIsoEnd = (date) => date ? new Date(`${date}T23:59:59.999`).toISOString() : undefined

const Motoboys = () => {
  const initialRange = todayRange()
  const [formOpen, setFormOpen] = useState(false)
  const [editingMotoboy, setEditingMotoboy] = useState(emptyMotoboy)
  const [adjustmentForm, setAdjustmentForm] = useState(emptyAdjustment)
  const [saving, setSaving] = useState(false)
  const [savingAdjustment, setSavingAdjustment] = useState(false)
  const [filters, setFilters] = useState({
    startDate: initialRange.startDate,
    endDate: initialRange.endDate,
    motoboyId: '',
    status: '',
    search: '',
  })

  const { motoboys, loading: motoboysLoading, saveMotoboy, removeMotoboy, refetch: refetchMotoboys } = useMotoboys()

  const serviceFilters = useMemo(() => ({
    startDate: toIsoStart(filters.startDate),
    endDate: toIsoEnd(filters.endDate),
    motoboyId: filters.motoboyId || undefined,
    status: filters.status || undefined,
    search: filters.search,
  }), [filters])

  const {
    summary,
    ranking,
    loading: dashboardLoading,
    refetch: refetchDashboard,
  } = useDeliveryDashboard({
    startDate: serviceFilters.startDate,
    endDate: serviceFilters.endDate,
  })
  const { history, loading: historyLoading, refetch: refetchHistory } = useDeliveryHistory(serviceFilters)
  const {
    adjustments,
    loading: adjustmentsLoading,
    refetch: refetchAdjustments,
    saveAdjustment,
    removeAdjustment,
  } = useMotoboyAdjustments(serviceFilters)

  const motoboyOptions = [
    { value: '', label: 'Todos os motoboys' },
    ...motoboys.map(motoboy => ({ value: motoboy.id, label: motoboy.name })),
  ]

  const selectedMotoboy = filters.motoboyId
    ? motoboys.find(motoboy => motoboy.id === filters.motoboyId)
    : null

  const filteredSummary = useMemo(() => {
    const completed = history.filter(item => item.status === 'delivered')
    const inProgress = history.filter(item => ['assigned', 'on_the_way'].includes(item.status))
    const cancelled = history.filter(item => item.status === 'cancelled')
    const totalDeliveryFees = history.reduce((sum, item) => sum + Number(item.orders?.delivery_fee || 0), 0)
    const totalCustomerPaid = history.reduce((sum, item) => sum + Number(item.orders?.total || 0), 0)
    const totalStoreRevenue = history.reduce((sum, item) => {
      const total = Number(item.orders?.total || 0)
      const deliveryFee = Number(item.orders?.delivery_fee || 0)
      return sum + Math.max(total - deliveryFee, 0)
    }, 0)
    const adjustmentTotals = adjustments.reduce((acc, item) => {
      const amount = Number(item.amount || 0)
      if (item.direction === 'credit') acc.credits += amount
      if (item.direction === 'debit') acc.debits += amount
      return acc
    }, { credits: 0, debits: 0 })

    return {
      totalDeliveries: history.length,
      completedDeliveries: completed.length,
      inProgressDeliveries: inProgress.length,
      cancelledDeliveries: cancelled.length,
      totalDeliveryFees,
      completedDeliveryFees: completed.reduce((sum, item) => sum + Number(item.orders?.delivery_fee || 0), 0),
      totalStoreRevenue,
      totalCustomerPaid,
      totalAdjustmentCredits: adjustmentTotals.credits,
      totalAdjustmentDebits: adjustmentTotals.debits,
      totalMotoboyPayable: totalDeliveryFees + adjustmentTotals.credits - adjustmentTotals.debits,
    }
  }, [history, adjustments])

  const hasDetailFilter = Boolean(filters.motoboyId || filters.status || filters.search)
  const currentSummary = hasDetailFilter ? filteredSummary : summary

  const openNewMotoboy = () => {
    setEditingMotoboy(emptyMotoboy)
    setFormOpen(true)
  }

  const openEditMotoboy = (motoboy) => {
    setEditingMotoboy({
      id: motoboy.id,
      name: motoboy.name || '',
      phone: motoboy.phone || '',
      password: '',
      active: motoboy.active !== false,
      notes: motoboy.notes || '',
    })
    setFormOpen(true)
  }

  const handleSaveMotoboy = async () => {
    if (!editingMotoboy.name.trim() || !editingMotoboy.phone.trim() || saving) return

    setSaving(true)
    const result = await saveMotoboy(editingMotoboy)
    setSaving(false)

    if (result.success) {
      setFormOpen(false)
      refetchDashboard()
      refetchHistory()
    }
  }

  const handleDeleteMotoboy = async (motoboy) => {
    if (!motoboy?.id) return
    const confirmed = window.confirm(`Remover ${motoboy.name} da lista de motoboys? O historico antigo continua preservado para relatorios.`)
    if (!confirmed) return

    const result = await removeMotoboy(motoboy.id)
    if (result.success) {
      refetchDashboard()
      refetchHistory()
    }
  }

  const handleAdjustmentTypeChange = (type) => {
    setAdjustmentForm(prev => ({
      ...prev,
      type,
      direction: ['daily_rate', 'bonus'].includes(type) ? 'credit' : 'debit',
      amount: type === 'daily_rate' ? '40' : prev.amount,
    }))
  }

  const handleSaveAdjustment = async () => {
    if (!adjustmentForm.motoboy_id || !Number(adjustmentForm.amount) || savingAdjustment) return

    setSavingAdjustment(true)
    const result = await saveAdjustment(adjustmentForm)
    setSavingAdjustment(false)

    if (result.success) {
      setAdjustmentForm(prev => ({
        ...emptyAdjustment,
        motoboy_id: prev.motoboy_id,
        adjustment_date: prev.adjustment_date,
      }))
      refetchDashboard()
    }
  }

  const handleDeleteAdjustment = async (adjustment) => {
    if (!adjustment?.id) return
    const confirmed = window.confirm('Remover este lancamento do fechamento do motoboy?')
    if (!confirmed) return

    const result = await removeAdjustment(adjustment.id)
    if (result.success) refetchDashboard()
  }

  const refetchAll = () => {
    refetchMotoboys()
    refetchDashboard()
    refetchHistory()
    refetchAdjustments()
  }

  const exportRows = history.map(item => {
    const order = item.orders || {}
    const motoboy = item.motoboys || {}

    return {
      data: item.assigned_at ? formatDateTime(item.assigned_at) : '',
      pedido: order.order_number ? `#${order.order_number}` : '',
      cliente: order.customer_name || '',
      motoboy: motoboy.name || '',
      telefone_motoboy: motoboy.phone || '',
      endereco: buildAddress(order),
      status: getDeliveryStatusLabel(item.status),
      valor_lanches: Math.max(Number(order.total || 0) - Number(order.delivery_fee || 0), 0).toFixed(2),
      taxa_motoboy: Number(order.delivery_fee || 0).toFixed(2),
      valor_total_cliente: Number(order.total || 0).toFixed(2),
    }
  })

  const exportColumns = [
    { key: 'data', label: 'Data' },
    { key: 'pedido', label: 'Pedido' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'motoboy', label: 'Motoboy' },
    { key: 'telefone_motoboy', label: 'Telefone do motoboy' },
    { key: 'endereco', label: 'Endereco' },
    { key: 'status', label: 'Status' },
    { key: 'valor_lanches', label: 'Valor da loja' },
    { key: 'taxa_motoboy', label: 'Taxa motoboy' },
    { key: 'valor_total_cliente', label: 'Total cliente' },
  ]

  const stats = [
    {
      label: 'Entregas no periodo',
      value: currentSummary.totalDeliveries || 0,
      icon: Truck,
    },
    {
      label: 'Em andamento',
      value: currentSummary.inProgressDeliveries || 0,
      icon: RefreshCw,
    },
    {
      label: 'Concluidas',
      value: currentSummary.completedDeliveries || 0,
      icon: Bike,
    },
    {
      label: 'A pagar motoboy',
      value: formatCurrency(currentSummary.totalMotoboyPayable ?? currentSummary.totalDeliveryFees ?? 0),
      icon: Wallet,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Motoboys e Entregas</h1>
          <p className="text-gray-400 mt-1">
            Cadastro, ranking, historico e exportacao das entregas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={refetchAll}>
            <RefreshCw size={18} className="mr-2" />
            Atualizar
          </Button>
          <Button onClick={openNewMotoboy}>
            <Plus size={18} className="mr-2" />
            Novo motoboy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{dashboardLoading ? '...' : stat.value}</p>
                </div>
                <Icon size={28} className="text-gray-400" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-gray-400 text-sm">Valor da loja no periodo</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {dashboardLoading ? '...' : formatCurrency(currentSummary.totalStoreRevenue || 0)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Total dos pedidos sem taxa de entrega.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-gray-400 text-sm">Taxas dos motoboys</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {dashboardLoading ? '...' : formatCurrency(currentSummary.totalDeliveryFees || 0)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Soma das taxas de entrega atribuídas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-gray-400 text-sm">Diarias e bonus</p>
            <p className="mt-1 text-2xl font-bold text-green-300">
              {dashboardLoading ? '...' : formatCurrency(currentSummary.totalAdjustmentCredits || 0)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Valores adicionados ao repasse.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-gray-400 text-sm">Vales e descontos</p>
            <p className="mt-1 text-2xl font-bold text-red-300">
              {dashboardLoading ? '...' : formatCurrency(currentSummary.totalAdjustmentDebits || 0)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Lanches, vales e descontos.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-gray-400 text-sm">Total pago pelos clientes</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {dashboardLoading ? '...' : formatCurrency(currentSummary.totalCustomerPaid || 0)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Valor da loja + entrega.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[420px_1fr] gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Motoboys</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {motoboysLoading && <p className="text-gray-400">Carregando motoboys...</p>}

              {motoboys.map(motoboy => (
                <div key={motoboy.id} className="p-4 bg-dark-900 border border-dark-600 rounded-lg">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-white font-semibold">{motoboy.name}</p>
                      <p className="text-gray-400 text-sm">{motoboy.phone}</p>
                      {motoboy.notes && <p className="text-gray-500 text-sm mt-1">{motoboy.notes}</p>}
                    </div>
                    <Badge variant={motoboy.active ? 'success' : 'default'}>
                      {motoboy.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-3 mt-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-400 text-sm">
                      Total geral: {motoboy.total_deliveries || 0}
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <Button size="sm" variant="secondary" className="w-full sm:w-auto" onClick={() => openEditMotoboy(motoboy)}>
                        <Edit size={16} className="mr-2" />
                        Editar
                      </Button>
                      <Button size="sm" variant="danger" className="w-full sm:w-auto" onClick={() => handleDeleteMotoboy(motoboy)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Ranking no periodo</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {ranking.length === 0 && (
                <p className="text-gray-400 text-sm">Sem entregas no periodo selecionado.</p>
              )}

              {ranking.map((item, index) => (
                <div key={item.motoboy_id || item.motoboy_name} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                  <div>
                    <p className="text-white font-semibold">
                      {index + 1}. {item.motoboy_name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {item.completed || 0} concluidas de {item.total || 0}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Repasse: {formatCurrency(item.delivery_fees || 0)} · Loja: {formatCurrency(item.store_revenue || 0)}
                    </p>
                  </div>
                  <Badge variant="info">{formatCurrency(item.net_payable ?? item.delivery_fees ?? 0)}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Vales e Diarias</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                O fechamento soma 100% das taxas de entrega, adiciona diarias/bonus e desconta vales ou lanches.
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Select
                  label="Motoboy"
                  value={adjustmentForm.motoboy_id}
                  onChange={(event) => setAdjustmentForm(prev => ({ ...prev, motoboy_id: event.target.value }))}
                  options={[
                    { value: '', label: 'Selecione um motoboy' },
                    ...motoboys.map(motoboy => ({ value: motoboy.id, label: motoboy.name })),
                  ]}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Tipo"
                    value={adjustmentForm.type}
                    onChange={(event) => handleAdjustmentTypeChange(event.target.value)}
                    options={adjustmentTypeOptions}
                  />
                  <Select
                    label="Como entra"
                    value={adjustmentForm.direction}
                    onChange={(event) => setAdjustmentForm(prev => ({ ...prev, direction: event.target.value }))}
                    options={adjustmentDirectionOptions}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Valor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={adjustmentForm.amount}
                    onChange={(event) => setAdjustmentForm(prev => ({ ...prev, amount: event.target.value }))}
                    placeholder="40,00"
                  />
                  <Input
                    label="Data"
                    type="date"
                    value={adjustmentForm.adjustment_date}
                    onChange={(event) => setAdjustmentForm(prev => ({ ...prev, adjustment_date: event.target.value }))}
                  />
                </div>
                <Textarea
                  label="Observacao"
                  rows={3}
                  value={adjustmentForm.description}
                  onChange={(event) => setAdjustmentForm(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="Ex.: diaria de quarta, vale, lanche..."
                />
                <Button onClick={handleSaveAdjustment} loading={savingAdjustment}>
                  {adjustmentForm.direction === 'credit' ? <PlusCircle size={18} className="mr-2" /> : <MinusCircle size={18} className="mr-2" />}
                  Salvar lancamento
                </Button>
              </div>

              <div className="space-y-2">
                {adjustmentsLoading && <p className="text-gray-400 text-sm">Carregando lancamentos...</p>}
                {!adjustmentsLoading && adjustments.length === 0 && (
                  <p className="text-gray-400 text-sm">Nenhum vale, diaria ou desconto no periodo.</p>
                )}
                {!adjustmentsLoading && adjustments.map(item => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-dark-600 bg-dark-900 p-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">
                        {item.motoboys?.name || 'Motoboy'} · {getAdjustmentTypeLabel(item.type)}
                      </p>
                      <p className={item.direction === 'credit' ? 'text-sm text-green-300' : 'text-sm text-red-300'}>
                        {item.direction === 'credit' ? '+' : '-'} {formatCurrency(item.amount || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.adjustment_date ? new Date(`${item.adjustment_date}T00:00:00`).toLocaleDateString('pt-BR') : ''}
                        {item.description ? ` · ${item.description}` : ''}
                      </p>
                    </div>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteAdjustment(item)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-xl font-bold text-white">Historico de Entregas</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => exportToCsv(exportRows, 'entregas_motoboys', exportColumns)}>
                  <Download size={16} className="mr-2" />
                  CSV
                </Button>
                <Button variant="secondary" size="sm" onClick={() => exportToXlsx(exportRows, 'entregas_motoboys', exportColumns, 'Entregas')}>
                  <Download size={16} className="mr-2" />
                  XLSX
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <Input
                label="Inicio"
                type="date"
                value={filters.startDate}
                onChange={(event) => setFilters(prev => ({ ...prev, startDate: event.target.value }))}
              />
              <Input
                label="Fim"
                type="date"
                value={filters.endDate}
                onChange={(event) => setFilters(prev => ({ ...prev, endDate: event.target.value }))}
              />
              <Select
                label="Motoboy"
                value={filters.motoboyId}
                onChange={(event) => setFilters(prev => ({ ...prev, motoboyId: event.target.value }))}
                options={motoboyOptions}
              />
              <Select
                label="Status"
                value={filters.status}
                onChange={(event) => setFilters(prev => ({ ...prev, status: event.target.value }))}
                options={deliveryStatusOptions}
              />
              <Input
                label="Busca"
                value={filters.search}
                onChange={(event) => setFilters(prev => ({ ...prev, search: event.target.value }))}
                placeholder="Pedido, cliente..."
              />
            </div>

            {selectedMotoboy && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-yellow-200">Fechamento do motoboy selecionado</p>
                    <h3 className="text-xl font-bold text-white">{selectedMotoboy.name}</h3>
                    <p className="text-sm text-gray-400">
                      {filters.startDate} ate {filters.endDate}
                    </p>
                  </div>
                  <Badge variant="info">{currentSummary.totalDeliveries || 0} entregas</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <div className="rounded-lg bg-dark-900 p-3">
                    <p className="text-xs text-gray-500">Taxas</p>
                    <p className="text-lg font-bold text-yellow-300">{formatCurrency(currentSummary.totalDeliveryFees || 0)}</p>
                  </div>
                  <div className="rounded-lg bg-dark-900 p-3">
                    <p className="text-xs text-gray-500">Diarias/bonus</p>
                    <p className="text-lg font-bold text-green-300">{formatCurrency(currentSummary.totalAdjustmentCredits || 0)}</p>
                  </div>
                  <div className="rounded-lg bg-dark-900 p-3">
                    <p className="text-xs text-gray-500">Vales/descontos</p>
                    <p className="text-lg font-bold text-red-300">{formatCurrency(currentSummary.totalAdjustmentDebits || 0)}</p>
                  </div>
                  <div className="rounded-lg bg-dark-900 p-3">
                    <p className="text-xs text-gray-500">Loja</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(currentSummary.totalStoreRevenue || 0)}</p>
                  </div>
                  <div className="rounded-lg bg-dark-900 p-3">
                    <p className="text-xs text-gray-500">A pagar</p>
                    <p className="text-xl font-black text-white">{formatCurrency(currentSummary.totalMotoboyPayable || 0)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Pedido</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Cliente</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Motoboy</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Atribuido</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Entregue</th>
                    <th className="text-left text-gray-400 font-medium py-3 px-4">Status</th>
                    <th className="text-right text-gray-400 font-medium py-3 px-4">Loja</th>
                    <th className="text-right text-gray-400 font-medium py-3 px-4">Motoboy</th>
                    <th className="text-right text-gray-400 font-medium py-3 px-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading && (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-gray-400">Carregando entregas...</td>
                    </tr>
                  )}

                  {!historyLoading && history.length === 0 && (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-gray-400">
                        <Search size={24} className="mx-auto mb-2" />
                        Nenhuma entrega encontrada.
                      </td>
                    </tr>
                  )}

                  {!historyLoading && history.map(item => {
                    const order = item.orders || {}
                    const motoboy = item.motoboys || {}
                    const deliveryFee = Number(order.delivery_fee || 0)
                    const customerTotal = Number(order.total || 0)
                    const storeValue = Math.max(customerTotal - deliveryFee, 0)

                    return (
                      <tr key={item.id} className="border-b border-dark-700 hover:bg-dark-700/50">
                        <td className="py-3 px-4 text-white">#{order.order_number}</td>
                        <td className="py-3 px-4">
                          <p className="text-white">{order.customer_name}</p>
                          <p className="text-gray-500 text-xs max-w-xs truncate">{buildAddress(order)}</p>
                        </td>
                        <td className="py-3 px-4 text-white">{motoboy.name}</td>
                        <td className="py-3 px-4 text-gray-300">{formatDateTime(item.assigned_at)}</td>
                        <td className="py-3 px-4 text-gray-300">{item.delivered_at ? formatDateTime(item.delivered_at) : '-'}</td>
                        <td className="py-3 px-4">
                          <Badge variant={getDeliveryStatusVariant(item.status)}>
                            {getDeliveryStatusLabel(item.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-white">{formatCurrency(storeValue)}</td>
                        <td className="py-3 px-4 text-right text-yellow-300">{formatCurrency(deliveryFee)}</td>
                        <td className="py-3 px-4 text-right text-white">{formatCurrency(customerTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {historyLoading && (
                <p className="py-6 text-center text-gray-400">Carregando entregas...</p>
              )}

              {!historyLoading && history.length === 0 && (
                <div className="py-8 text-center text-gray-400">
                  <Search size={24} className="mx-auto mb-2" />
                  Nenhuma entrega encontrada.
                </div>
              )}

              {!historyLoading && history.map(item => {
                const order = item.orders || {}
                const motoboy = item.motoboys || {}
                const deliveryFee = Number(order.delivery_fee || 0)
                const customerTotal = Number(order.total || 0)
                const storeValue = Math.max(customerTotal - deliveryFee, 0)

                return (
                  <div key={item.id} className="rounded-lg border border-dark-600 bg-dark-900 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white">#{order.order_number} · {order.customer_name}</p>
                        <p className="mt-1 text-sm text-gray-400">{motoboy.name}</p>
                        <p className="mt-1 break-words text-xs text-gray-500">{buildAddress(order)}</p>
                      </div>
                      <Badge variant={getDeliveryStatusVariant(item.status)}>
                        {getDeliveryStatusLabel(item.status)}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-md bg-dark-800 p-2">
                        <p className="text-gray-500">Loja</p>
                        <p className="font-semibold text-white">{formatCurrency(storeValue)}</p>
                      </div>
                      <div className="rounded-md bg-dark-800 p-2">
                        <p className="text-gray-500">Motoboy</p>
                        <p className="font-semibold text-yellow-300">{formatCurrency(deliveryFee)}</p>
                      </div>
                      <div className="rounded-md bg-dark-800 p-2">
                        <p className="text-gray-500">Total</p>
                        <p className="font-semibold text-white">{formatCurrency(customerTotal)}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      Atribuido: {formatDateTime(item.assigned_at)} · Entregue: {item.delivered_at ? formatDateTime(item.delivered_at) : '-'}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingMotoboy.id ? 'Editar motoboy' : 'Novo motoboy'}
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={editingMotoboy.name}
            onChange={(event) => setEditingMotoboy(prev => ({ ...prev, name: event.target.value }))}
          />
          <Input
            label="Telefone / WhatsApp"
            value={editingMotoboy.phone}
            onChange={(event) => setEditingMotoboy(prev => ({ ...prev, phone: event.target.value }))}
          />
          <Input
            label={editingMotoboy.id ? 'Nova senha de acesso (opcional)' : 'Senha de acesso do motoboy'}
            type="password"
            value={editingMotoboy.password || ''}
            onChange={(event) => setEditingMotoboy(prev => ({ ...prev, password: event.target.value }))}
            placeholder={editingMotoboy.id ? 'Preencha apenas se quiser trocar' : 'Senha para entrar no /motoboy'}
          />
          <div className="rounded-lg border border-dark-600 bg-dark-900 p-3 text-sm text-gray-300">
            O motoboy entra em <span className="font-semibold text-white">/motoboy</span> usando o telefone acima e esta senha.
          </div>
          <Select
            label="Status"
            value={editingMotoboy.active ? 'active' : 'inactive'}
            onChange={(event) => setEditingMotoboy(prev => ({ ...prev, active: event.target.value === 'active' }))}
            options={[
              { value: 'active', label: 'Ativo' },
              { value: 'inactive', label: 'Inativo' },
            ]}
          />
          <Textarea
            label="Observacao"
            rows={4}
            value={editingMotoboy.notes}
            onChange={(event) => setEditingMotoboy(prev => ({ ...prev, notes: event.target.value }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMotoboy} loading={saving}>
              <Save size={18} className="mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Motoboys
