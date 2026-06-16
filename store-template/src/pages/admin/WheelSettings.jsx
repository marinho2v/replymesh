import { useEffect, useMemo, useState } from 'react'
import { Calendar, Gift, Percent, RefreshCw, Save, Search, Ticket, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { createWheelPrize, getAdminWheelSpinHistory, getAdminWheelSummary, updateWheelPrize } from '../../services/wheel'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'

const prizeTypeOptions = [
  { value: 'coupon_percentage', label: 'Desconto em %' },
  { value: 'coupon_fixed', label: 'Valor fixo' },
  { value: 'free_shipping', label: 'Frete gratis' },
  { value: 'no_prize', label: 'Nao ganhou' },
]

const emptyPrize = {
  name: '',
  description: '',
  prize_type: 'coupon_percentage',
  discount_value: 10,
  probability_weight: 10,
  coupon_valid_days: 7,
  minimum_order_amount: 0,
  max_total_wins: '',
  badge: '',
  color: '#eab308',
  sort_order: 100,
  is_active: true,
}

const todayRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const rangeForPreset = (preset) => {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (preset === 'yesterday') {
    start.setDate(now.getDate() - 1)
    end.setDate(now.getDate() - 1)
  } else if (preset === 'week') {
    const day = now.getDay() || 7
    start.setDate(now.getDate() - day + 1)
  } else if (preset === 'month') {
    start.setDate(1)
  } else if (preset !== 'today') {
    return todayRange()
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const toIsoStart = (date) => date ? new Date(`${date}T00:00:00`).toISOString() : null
const toIsoEnd = (date) => date ? new Date(`${date}T23:59:59.999`).toISOString() : null

const toFormPrize = (prize) => ({
  ...emptyPrize,
  ...prize,
  max_total_wins: prize.max_total_wins ?? '',
})

const formatPrizeValue = (prize) => {
  if (prize.prize_type === 'free_shipping') return 'Frete gratis'
  if (prize.prize_type === 'coupon_percentage') return `${Number(prize.discount_value || 0)}%`
  if (prize.prize_type === 'coupon_fixed') return formatCurrency(prize.discount_value || 0)
  return 'Sem premio'
}

const WheelSettings = () => {
  const initialHistoryRange = todayRange()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [editing, setEditing] = useState({})
  const [newPrize, setNewPrize] = useState(emptyPrize)
  const [history, setHistory] = useState([])
  const [historyMeta, setHistoryMeta] = useState({
    page: 1,
    per_page: 20,
    total_count: 0,
    total_pages: 0,
  })
  const [historySummary, setHistorySummary] = useState({})
  const [historyFilters, setHistoryFilters] = useState({
    period: 'custom',
    startDate: initialHistoryRange.startDate,
    endDate: initialHistoryRange.endDate,
    search: '',
    prizeId: '',
    status: '',
  })

  const prizes = summary?.prizes || []
  const totalWeight = useMemo(
    () => prizes.filter(prize => prize.is_active && Number(prize.probability_weight) > 0)
      .reduce((sum, prize) => sum + Number(prize.probability_weight || 0), 0),
    [prizes]
  )

  const loadSummary = async () => {
    setLoading(true)
    try {
      const data = await getAdminWheelSummary()
      setSummary(data)
      const nextEditing = {}
      ;(data.prizes || []).forEach((prize) => {
        nextEditing[prize.id] = toFormPrize(prize)
      })
      setEditing(nextEditing)
    } catch (error) {
      toast.error(error.message || 'Erro ao carregar roleta')
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async (page = historyMeta.page || 1) => {
    setHistoryLoading(true)
    try {
      const data = await getAdminWheelSpinHistory({
        startDate: toIsoStart(historyFilters.startDate),
        endDate: toIsoEnd(historyFilters.endDate),
        search: historyFilters.search,
        prizeId: historyFilters.prizeId || null,
        status: historyFilters.status || null,
        page,
        perPage: historyMeta.per_page || 20,
      })
      setHistory(data.spins || [])
      setHistoryMeta(data.pagination || historyMeta)
      setHistorySummary(data.summary || {})
    } catch (error) {
      toast.error(error.message || 'Erro ao carregar historico da roleta')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
    loadHistory()
  }, [])

  const updateEditing = (id, field, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
        ...(field === 'prize_type' && value === 'free_shipping' ? { discount_value: 0 } : {}),
      },
    }))
  }

  const savePrize = async (id) => {
    setSavingId(id)
    try {
      await updateWheelPrize(id, editing[id])
      toast.success('Premio atualizado')
      await loadSummary()
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar premio')
    } finally {
      setSavingId(null)
    }
  }

  const addPrize = async () => {
    if (!newPrize.name.trim()) {
      toast.error('Informe o nome do premio')
      return
    }

    setSavingId('new')
    try {
      await createWheelPrize(newPrize)
      toast.success('Premio criado')
      setNewPrize(emptyPrize)
      await loadSummary()
    } catch (error) {
      toast.error(error.message || 'Erro ao criar premio')
    } finally {
      setSavingId(null)
    }
  }

  const getChance = (prize) => {
    if (!prize.is_active || totalWeight <= 0) return 0
    return (Number(prize.probability_weight || 0) / totalWeight) * 100
  }

  const refreshAll = async () => {
    await Promise.all([loadSummary(), loadHistory()])
  }

  const applyPeriodPreset = (period) => {
    const range = rangeForPreset(period)
    setHistoryFilters(prev => ({
      ...prev,
      period,
      startDate: range.startDate,
      endDate: range.endDate,
    }))
  }

  const applyFilters = () => loadHistory(1)

  const goToHistoryPage = (page) => {
    const totalPages = Math.max(Number(historyMeta.total_pages || 1), 1)
    loadHistory(Math.min(Math.max(page, 1), totalPages))
  }

  const getSpinStatus = (spin) => {
    if (spin.status === 'available') return { label: 'Giro disponivel', variant: 'info' }
    if (spin.prize_type === 'no_prize' || !spin.coupon_code) return { label: 'Sem premio', variant: 'default' }
    if (Number(spin.coupon_used_count || 0) > 0) return { label: 'Cupom usado', variant: 'success' }
    if (spin.coupon_is_active === false) return { label: 'Cupom inativo', variant: 'danger' }
    return { label: 'Cupom disponivel', variant: 'warning' }
  }

  if (loading) {
    return <div className="py-8 text-center text-white">Carregando roleta...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Roleta</h1>
          <p className="mt-1 text-sm text-gray-400">
            Controle premios, chances e limite de ganhadores para nao pesar no caixa.
          </p>
        </div>
        <Button variant="secondary" onClick={refreshAll}>
          <RefreshCw size={18} className="mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Gift className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Giros disponiveis</p>
              <p className="text-2xl font-bold text-white">{summary?.available_spins || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Giros usados</p>
              <p className="text-2xl font-bold text-white">{summary?.used_spins || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Ticket className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Cupons gerados</p>
              <p className="text-2xl font-bold text-white">{summary?.generated_coupons || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Percent className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-400">Cupons usados</p>
              <p className="text-2xl font-bold text-white">{summary?.used_coupons || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Historico da roleta</h2>
          <p className="mt-1 text-sm text-gray-400">
            Veja quem girou, o que ganhou, cupom gerado e se o cupom ja foi usado.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[180px_160px_160px_1fr_220px_180px_auto]">
            <Select
              label="Periodo"
              value={historyFilters.period}
              onChange={event => applyPeriodPreset(event.target.value)}
              options={[
                { value: 'today', label: 'Hoje' },
                { value: 'yesterday', label: 'Ontem' },
                { value: 'week', label: 'Esta semana' },
                { value: 'month', label: 'Este mes' },
                { value: 'custom', label: 'Personalizado' },
              ]}
            />
            <Input
              label="Inicio"
              type="date"
              value={historyFilters.startDate}
              onChange={event => setHistoryFilters(prev => ({ ...prev, period: 'custom', startDate: event.target.value }))}
            />
            <Input
              label="Fim"
              type="date"
              value={historyFilters.endDate}
              onChange={event => setHistoryFilters(prev => ({ ...prev, period: 'custom', endDate: event.target.value }))}
            />
            <Input
              label="Buscar"
              value={historyFilters.search}
              onChange={event => setHistoryFilters(prev => ({ ...prev, search: event.target.value }))}
              placeholder="Nome, telefone, cupom..."
            />
            <Select
              label="Premio"
              value={historyFilters.prizeId}
              onChange={event => setHistoryFilters(prev => ({ ...prev, prizeId: event.target.value }))}
              options={[
                { value: '', label: 'Todos os premios' },
                ...prizes.map(prize => ({ value: prize.id, label: prize.name })),
              ]}
            />
            <Select
              label="Status"
              value={historyFilters.status}
              onChange={event => setHistoryFilters(prev => ({ ...prev, status: event.target.value }))}
              options={[
                { value: '', label: 'Todos' },
                { value: 'available', label: 'Giro disponivel' },
                { value: 'used', label: 'Giro usado' },
              ]}
            />
            <Button className="self-end" variant="secondary" onClick={applyFilters} loading={historyLoading}>
              <Search size={18} className="mr-2" />
              Filtrar
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-dark-900 p-3">
              <p className="text-xs text-gray-500">Registros filtrados</p>
              <p className="text-xl font-bold text-white">{historySummary.filtered_spins ?? historyMeta.total_count ?? history.length}</p>
            </div>
            <div className="rounded-lg bg-dark-900 p-3">
              <p className="text-xs text-gray-500">Cupons ganhos</p>
              <p className="text-xl font-bold text-white">{historySummary.filtered_coupons ?? history.filter(spin => spin.coupon_code).length}</p>
            </div>
            <div className="rounded-lg bg-dark-900 p-3">
              <p className="text-xs text-gray-500">Cupons usados</p>
              <p className="text-xl font-bold text-white">{historySummary.filtered_used_coupons ?? history.filter(spin => Number(spin.coupon_used_count || 0) > 0).length}</p>
            </div>
            <div className="rounded-lg bg-dark-900 p-3">
              <p className="text-xs text-gray-500">Sem premio</p>
              <p className="text-xl font-bold text-white">{historySummary.filtered_no_prize ?? history.filter(spin => spin.status === 'used' && !spin.coupon_code).length}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-dark-700 bg-dark-900 p-3 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Pagina {Number(historyMeta.page || 1)} de {Math.max(Number(historyMeta.total_pages || 1), 1)}
              {' '}· {Number(historyMeta.total_count || 0)} registros
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" disabled={historyLoading || Number(historyMeta.page || 1) <= 1} onClick={() => goToHistoryPage(Number(historyMeta.page || 1) - 1)}>
                Anterior
              </Button>
              {Array.from({ length: Math.min(Number(historyMeta.total_pages || 1), 5) }, (_, index) => {
                const totalPages = Math.max(Number(historyMeta.total_pages || 1), 1)
                const current = Number(historyMeta.page || 1)
                const start = Math.min(Math.max(current - 2, 1), Math.max(totalPages - 4, 1))
                const page = start + index
                if (page > totalPages) return null
                return (
                  <Button
                    key={page}
                    type="button"
                    size="sm"
                    variant={page === current ? 'primary' : 'outline'}
                    disabled={historyLoading}
                    onClick={() => goToHistoryPage(page)}
                  >
                    {page}
                  </Button>
                )
              })}
              <Button type="button" size="sm" variant="outline" disabled={historyLoading || Number(historyMeta.page || 1) >= Number(historyMeta.total_pages || 1)} onClick={() => goToHistoryPage(Number(historyMeta.page || 1) + 1)}>
                Proxima
              </Button>
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700 text-left text-sm text-gray-400">
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3">Premio</th>
                  <th className="p-3">Cupom</th>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-400">Carregando historico...</td>
                  </tr>
                )}
                {!historyLoading && history.map((spin) => {
                  const status = getSpinStatus(spin)
                  return (
                    <tr key={spin.id} className="border-b border-dark-800 text-sm">
                      <td className="p-3 text-gray-300">{formatDateTime(spin.used_at || spin.created_at)}</td>
                      <td className="p-3 font-semibold text-white">{spin.customer_name || 'Cliente'}</td>
                      <td className="p-3 text-gray-300">{spin.customer_phone || '-'}</td>
                      <td className="p-3 text-gray-300">{spin.prize_name || 'Giro disponivel'}</td>
                      <td className="p-3">
                        {spin.coupon_code ? (
                          <span className="font-semibold text-yellow-300">{spin.coupon_code}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-300">
                        {spin.order_number ? `#${spin.order_number}` : '-'}
                      </td>
                      <td className="p-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
                {!historyLoading && history.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-gray-400">Nenhum giro encontrado com esses filtros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {historyLoading && <p className="py-6 text-center text-gray-400">Carregando historico...</p>}
            {!historyLoading && history.map((spin) => {
              const status = getSpinStatus(spin)
              return (
                <div key={spin.id} className="rounded-lg border border-dark-700 bg-dark-900 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{spin.customer_name || 'Cliente'}</p>
                      <p className="text-sm text-gray-400">{spin.customer_phone || '-'}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded bg-dark-800 p-2">
                      <p className="text-gray-500">Premio</p>
                      <p className="font-semibold text-white">{spin.prize_name || 'Giro disponivel'}</p>
                    </div>
                    <div className="rounded bg-dark-800 p-2">
                      <p className="text-gray-500">Cupom</p>
                      <p className="font-semibold text-yellow-300">{spin.coupon_code || '-'}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={14} />
                    {formatDateTime(spin.used_at || spin.created_at)}
                    {spin.order_number ? ` · Pedido #${spin.order_number}` : ''}
                  </p>
                </div>
              )
            })}
            {!historyLoading && history.length === 0 && (
              <p className="py-6 text-center text-gray-400">Nenhum giro encontrado com esses filtros.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Premios da roleta</h2>
          <p className="mt-1 text-sm text-gray-400">
            A chance e proporcional ao peso. Exemplo: peso 30 aparece mais que peso 5.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {prizes.map((prize) => {
            const form = editing[prize.id] || toFormPrize(prize)
            const exhausted = prize.max_total_wins !== null && Number(prize.current_wins || 0) >= Number(prize.max_total_wins || 0)

            return (
              <div key={prize.id} className="rounded-xl border border-dark-600 bg-dark-900 p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full border border-white/20" style={{ backgroundColor: form.color || '#6b7280' }} />
                    <div>
                      <p className="font-bold text-white">{prize.name}</p>
                      <p className="text-sm text-gray-400">
                        {formatPrizeValue(prize)} · chance aprox. {getChance(prize).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!prize.is_active && <Badge variant="danger">Inativo</Badge>}
                    {exhausted && <Badge variant="warning">Limite atingido</Badge>}
                    {prize.source === 'wheel' && <Badge>Roleta</Badge>}
                  </div>
                </div>

                <div className="grid gap-3 lg:grid-cols-4">
                  <Input label="Nome" value={form.name} onChange={event => updateEditing(prize.id, 'name', event.target.value)} />
                  <Input label="Texto na roleta" value={form.badge || ''} onChange={event => updateEditing(prize.id, 'badge', event.target.value)} />
                  <Select label="Tipo" options={prizeTypeOptions} value={form.prize_type} onChange={event => updateEditing(prize.id, 'prize_type', event.target.value)} />
                  <Input label="Cor" type="color" value={form.color || '#6b7280'} onChange={event => updateEditing(prize.id, 'color', event.target.value)} />
                  <Input label="Valor" type="number" step="0.01" disabled={form.prize_type === 'free_shipping' || form.prize_type === 'no_prize'} value={form.discount_value} onChange={event => updateEditing(prize.id, 'discount_value', event.target.value)} />
                  <Input label="Peso/chance" type="number" min="0" value={form.probability_weight} onChange={event => updateEditing(prize.id, 'probability_weight', event.target.value)} />
                  <Input label="Validade do cupom (dias)" type="number" min="1" value={form.coupon_valid_days} onChange={event => updateEditing(prize.id, 'coupon_valid_days', event.target.value)} />
                  <Input label="Pedido minimo" type="number" step="0.01" value={form.minimum_order_amount} onChange={event => updateEditing(prize.id, 'minimum_order_amount', event.target.value)} />
                  <Input label="Limite total de ganhadores" type="number" min="0" placeholder="Sem limite" value={form.max_total_wins ?? ''} onChange={event => updateEditing(prize.id, 'max_total_wins', event.target.value)} />
                  <Input label="Ja ganhou" type="number" disabled value={prize.current_wins || 0} />
                  <Input label="Ordem" type="number" value={form.sort_order} onChange={event => updateEditing(prize.id, 'sort_order', event.target.value)} />
                  <label className="flex items-end gap-2 pb-2 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={Boolean(form.is_active)}
                      onChange={event => updateEditing(prize.id, 'is_active', event.target.checked)}
                    />
                    Premio ativo
                  </label>
                </div>

                <Textarea
                  className="mt-3"
                  label="Descricao"
                  rows={2}
                  value={form.description || ''}
                  onChange={event => updateEditing(prize.id, 'description', event.target.value)}
                />

                <div className="mt-4 flex justify-end">
                  <Button onClick={() => savePrize(prize.id)} loading={savingId === prize.id}>
                    <Save size={18} className="mr-2" />
                    Salvar premio
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Adicionar novo premio</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-4">
            <Input label="Nome" value={newPrize.name} onChange={event => setNewPrize(prev => ({ ...prev, name: event.target.value }))} />
            <Input label="Texto na roleta" value={newPrize.badge} onChange={event => setNewPrize(prev => ({ ...prev, badge: event.target.value }))} />
            <Select label="Tipo" options={prizeTypeOptions} value={newPrize.prize_type} onChange={event => setNewPrize(prev => ({ ...prev, prize_type: event.target.value, discount_value: event.target.value === 'free_shipping' ? 0 : prev.discount_value }))} />
            <Input label="Cor" type="color" value={newPrize.color} onChange={event => setNewPrize(prev => ({ ...prev, color: event.target.value }))} />
            <Input label="Valor" type="number" step="0.01" disabled={newPrize.prize_type === 'free_shipping' || newPrize.prize_type === 'no_prize'} value={newPrize.discount_value} onChange={event => setNewPrize(prev => ({ ...prev, discount_value: event.target.value }))} />
            <Input label="Peso/chance" type="number" min="0" value={newPrize.probability_weight} onChange={event => setNewPrize(prev => ({ ...prev, probability_weight: event.target.value }))} />
            <Input label="Validade (dias)" type="number" min="1" value={newPrize.coupon_valid_days} onChange={event => setNewPrize(prev => ({ ...prev, coupon_valid_days: event.target.value }))} />
            <Input label="Limite total" type="number" min="0" placeholder="Sem limite" value={newPrize.max_total_wins} onChange={event => setNewPrize(prev => ({ ...prev, max_total_wins: event.target.value }))} />
          </div>
          <Textarea label="Descricao" rows={2} value={newPrize.description} onChange={event => setNewPrize(prev => ({ ...prev, description: event.target.value }))} />
          <Button onClick={addPrize} loading={savingId === 'new'}>
            Criar premio
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Ultimos giros</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {(summary?.recent_spins || []).map(spin => (
            <div key={spin.id} className="flex flex-col gap-1 rounded-lg bg-dark-900 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">{spin.customer_name || 'Cliente'}</p>
                <p className="text-sm text-gray-400">{spin.customer_phone || '-'} · {spin.prize_name || 'Giro disponivel'}</p>
              </div>
              <div className="text-sm text-gray-300">
                {spin.coupon_code || spin.status}
              </div>
            </div>
          ))}
          {!summary?.recent_spins?.length && <p className="text-gray-400">Nenhum giro registrado ainda.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

export default WheelSettings
