import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bike,
  CheckCircle2,
  ClipboardList,
  History,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import BrandLogo from '../../components/shared/BrandLogo'
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'
import { motoboySignOut } from '../../services/auth'
import {
  completeMyMotoboyDelivery,
  getMotoboyFinance,
  getMotoboyHistory,
  getMotoboyProfile,
  getMotoboyStoreSettings,
  getMotoboyWhatsappTemplate,
  getMyMotoboyDeliveries,
  uploadMotoboyPhoto,
} from '../../services/motoboyPortal'
import { supabaseMotoboy } from '../../services/supabase'
import { buildTemplateOnlyMessage, buildWhatsAppUrl } from '../../utils/generateWhatsappMessage'
import { buildAddress } from '../../utils/whatsappTemplates'
import { normalizeWhatsAppPhone } from '../../services/whatsappService'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'

// ─── Constants ────────────────────────────────────────────────────────────────

const statusLabels = {
  assigned: 'Atribuido',
  on_the_way: 'Em rota',
  delivered: 'Entregue',
  completed: 'Concluido',
  cancelled: 'Cancelado',
}

const getHistoryStatusVariant = (status) => {
  if (status === 'delivered' || status === 'completed') return 'success'
  if (status === 'cancelled') return 'danger'
  return 'info'
}

const paymentLabels = {
  money: 'Dinheiro',
  pix: 'Pix',
  pix_delivery: 'Pix na entrega',
  pix_online: 'Pix online',
  card_on_delivery: 'Cartao na entrega',
  card_delivery: 'Cartao na entrega',
}

// Tipos reais usados em motoboy_financial_adjustments
const adjustmentLabels = {
  diaria:     'Diária',
  daily_rate: 'Diária',
  vale:       'Vale',
  advance:    'Vale',
  lanche:     'Lanche',
  meal:       'Lanche',
  desconto:   'Desconto',
  discount:   'Desconto',
  bonus:      'Bônus',
  ajuste:     'Ajuste',
  adjustment: 'Ajuste',
}

const DEBIT_TYPES = new Set(['vale', 'desconto', 'advance', 'meal'])
const isAdjustmentCredit = (adj) => {
  if (adj.direction === 'credit') return true
  if (adj.direction === 'debit') return false
  return !DEBIT_TYPES.has(adj.type)
}

const TABS = [
  { id: 'deliveries', label: 'Entregas', Icon: Bike },
  { id: 'history',   label: 'Histórico', Icon: History },
  { id: 'finance',   label: 'Financeiro', Icon: Wallet },
  { id: 'profile',   label: 'Perfil',    Icon: User },
]

const HISTORY_FILTERS = [
  { key: 'today', label: 'Hoje' },
  { key: '7days', label: '7 dias' },
  { key: 'month', label: 'Mês atual' },
]

const FINANCE_FILTERS = [
  { key: 'today', label: 'Hoje' },
  { key: '7days', label: '7 dias' },
  { key: 'month', label: 'Mês' },
  { key: 'custom', label: '📅 Período' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const openExternal = (url) => {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

const hasPreciseLocation = (delivery) => {
  const lat = delivery?.delivery_latitude
  const lng = delivery?.delivery_longitude
  return lat != null && lng != null
    && Number.isFinite(Number(lat))
    && Number.isFinite(Number(lng))
}

const buildPreciseMapsUrls = (delivery, address) => {
  if (delivery.google_maps_url || delivery.waze_url) {
    return {
      mapsUrl: delivery.google_maps_url || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''),
      wazeUrl: delivery.waze_url || (address ? `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes` : ''),
    }
  }

  if (hasPreciseLocation(delivery)) {
    const latitude = Number(delivery.delivery_latitude)
    const longitude = Number(delivery.delivery_longitude)
    return {
      mapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
      wazeUrl: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
    }
  }
  return {
    mapsUrl: delivery.google_maps_url || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''),
    wazeUrl: delivery.waze_url || (address ? `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes` : ''),
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const FilterChips = ({ filters, active, onChange }) => (
  <div className="flex gap-2">
    {filters.map(({ key, label }) => (
      <button
        key={key}
        onClick={() => onChange(key)}
        className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
          active === key
            ? 'bg-yellow-400 text-black'
            : 'bg-dark-800 text-gray-400 border border-dark-600 hover:text-white'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
)

const SummaryCard = ({ icon: Icon, title, value, accent = 'yellow' }) => {
  const accentMap = {
    yellow: 'text-yellow-400',
    white:  'text-white',
  }
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dark-600 bg-dark-900 p-4">
      <div className="flex items-center gap-2">
        <Icon size={15} className={accentMap[accent]} />
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</span>
      </div>
      <p className={`text-xl font-black ${accentMap[accent]}`}>{value}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const MotoboyPortal = () => {
  const { store } = usePublicStoreInfo()
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab] = useState('deliveries')

  // Deliveries
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [finishingId, setFinishingId] = useState(null)

  // History
  const [history, setHistory] = useState([])
  const [historyFilter, setHistoryFilter] = useState('today')
  const [historyLoading, setHistoryLoading] = useState(false)

  // Finance
  const [finance, setFinance] = useState(null)
  const [financeFilter, setFinanceFilter] = useState('month')
  const [financeLoading, setFinanceLoading] = useState(false)
  const todayStr = new Date().toISOString().slice(0, 10)
  const [customFrom, setCustomFrom] = useState(todayStr)
  const [customTo, setCustomTo] = useState(todayStr)

  // Profile
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef(null)

  // Auth check
  useEffect(() => {
    supabaseMotoboy.auth.getSession().then(({ data }) => {
      if (!data?.session) {
        navigate('/motoboy/login', { replace: true })
      } else {
        setAuthChecked(true)
      }
    })
  }, [navigate])

  // Deliveries
  const fetchDeliveries = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      setDeliveries(await getMyMotoboyDeliveries())
    } catch (error) {
      console.error('Erro ao carregar entregas do motoboy:', error)
      if (!silent) toast.error('Nao foi possivel carregar suas entregas')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (!authChecked) return
    fetchDeliveries()
    const t = window.setInterval(() => fetchDeliveries({ silent: true }), 15000)
    return () => window.clearInterval(t)
  }, [authChecked])

  // History
  const fetchHistory = async (filter = historyFilter) => {
    setHistoryLoading(true)
    try {
      setHistory(await getMotoboyHistory(filter))
    } catch (err) {
      console.error(err)
      toast.error('Nao foi possivel carregar o historico')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Finance
  const fetchFinance = async (filter = financeFilter, from = customFrom, to = customTo) => {
    setFinanceLoading(true)
    try {
      const params = filter === 'custom'
        ? { filter: 'custom', fromDate: from, toDate: to }
        : { filter }
      setFinance(await getMotoboyFinance(params))
    } catch (err) {
      console.error(err)
      toast.error('Nao foi possivel carregar o financeiro')
    } finally {
      setFinanceLoading(false)
    }
  }

  // Profile
  const fetchProfile = async () => {
    setProfileLoading(true)
    try {
      setProfile(await getMotoboyProfile())
    } catch (err) {
      console.error(err)
    } finally {
      setProfileLoading(false)
    }
  }

  // Load data when tab becomes active
  useEffect(() => {
    if (!authChecked) return
    if (activeTab === 'history' && history.length === 0 && !historyLoading) fetchHistory()
    if (activeTab === 'finance' && finance === null && !financeLoading) fetchFinance()
    if (activeTab === 'profile' && profile === null && !profileLoading) fetchProfile()
  }, [activeTab, authChecked])

  const handleHistoryFilter = (key) => {
    setHistoryFilter(key)
    fetchHistory(key)
  }

  const handleFinanceFilter = (key) => {
    setFinanceFilter(key)
    if (key !== 'custom') fetchFinance(key)
    // For 'custom', user must pick dates and press the button
  }

  const handleCustomFinanceSearch = () => {
    fetchFinance('custom', customFrom, customTo)
  }

  // Profile photo upload
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !profile?.id) return
    setUploadingPhoto(true)
    try {
      const url = await uploadMotoboyPhoto(profile.id, file)
      setProfile(prev => prev ? { ...prev, photo_url: url } : prev)
      toast.success('Foto atualizada!')
    } catch (err) {
      console.error(err)
      toast.error('Nao foi possivel enviar a foto')
    } finally {
      setUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const activeDeliveries = useMemo(
    () => deliveries.filter(item => ['assigned', 'on_the_way'].includes(item.delivery_status)),
    [deliveries]
  )

  const handleSignOut = async () => {
    try { await motoboySignOut() } catch {}
    navigate('/motoboy/login', { replace: true })
  }

  const handleComplete = async (delivery) => {
    if (!delivery?.id || finishingId) return
    const confirmed = window.confirm('Finalizar esta entrega? O cliente recebera a mensagem de pedido finalizado.')
    if (!confirmed) return

    setFinishingId(delivery.id)
    try {
      const result = await completeMyMotoboyDelivery(delivery.id)
      const completedOrder = result?.order || { ...delivery, status: 'completed' }
      const items = result?.items || delivery.order_items || []

      const store = await getMotoboyStoreSettings() ?? {}
      const template = await getMotoboyWhatsappTemplate('order_completed')
      const templateContent = template?.content || template?.message || [
        'Ola, {cliente}! ✅',
        'Pedido finalizado.',
        '',
        '{aviso_roleta}',
        '',
        'Obrigado pela preferencia!',
        'Obrigado pelo seu pedido!',
      ].join('\n')

      const phone = completedOrder.customer_whatsapp || completedOrder.customer_phone
      if (phone) {
        const normalizedPhone = normalizeWhatsAppPhone(phone)
        const message = buildTemplateOnlyMessage(templateContent, completedOrder, items, store)
        const evolutionBaseUrl = (store?.evolution_base_url || 'https://marinho.replymesh.cloud').replace(/\/+$/, '')

        try {
          const { error: sendError } = await supabaseMotoboy.functions.invoke('evolution-send-text', {
            body: {
              phone: normalizedPhone,
              message,
              baseUrl: evolutionBaseUrl,
              apiKey: store?.evolution_api_key || '',
              instance: store?.evolution_instance || '',
              orderId: completedOrder.id,
              status: 'completed',
            },
          })
          if (sendError) console.warn('[MotoboyPortal] Erro ao enviar WhatsApp:', sendError)
        } catch (err) {
          console.warn('[MotoboyPortal] Falha ao enviar WhatsApp (nao critico):', err)
        }
      }

      toast.success('Entrega finalizada')
      await fetchDeliveries()
    } catch (error) {
      console.error('Erro ao finalizar entrega:', error)
      toast.error(error.message || 'Nao foi possivel finalizar a entrega')
    } finally {
      setFinishingId(null)
    }
  }

  if (!authChecked) return null

  return (
    <div className="min-h-screen bg-dark-950 px-4 py-5">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <BrandLogo size="md" textClassName="text-xl" name={store?.store_name} logoUrl={store?.logo_url} />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut size={18} className="mr-2" />
            Sair
          </Button>
        </header>

        {/* Tab bar */}
        <div className="flex rounded-xl border border-dark-600 bg-dark-900 p-1 gap-1">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${
                activeTab === id
                  ? 'bg-yellow-400 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Entregas ── */}
        {activeTab === 'deliveries' && (
          <>
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-400">Painel do motoboy</p>
                  <h1 className="text-2xl font-bold text-white">Minhas entregas</h1>
                  <p className="mt-1 text-sm text-gray-400">
                    Somente pedidos atribuidos para o seu cadastro aparecem aqui.
                  </p>
                </div>
                <Button variant="secondary" onClick={fetchDeliveries} loading={loading}>
                  <RefreshCw size={18} className="mr-2" />
                  Atualizar
                </Button>
              </CardContent>
            </Card>

            {loading ? (
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 text-center text-white">
                Carregando entregas...
              </div>
            ) : activeDeliveries.length === 0 ? (
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-8 text-center">
                <Bike size={38} className="mx-auto mb-3 text-gray-500" />
                <p className="text-lg font-semibold text-white">Nenhuma entrega em aberto</p>
                <p className="mt-1 text-sm text-gray-400">Quando a loja atribuir um pedido para voce, ele aparece aqui.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeDeliveries.map((delivery) => {
                  const address = buildAddress(delivery)
                  const preciseLocation = hasPreciseLocation(delivery)
                  const { mapsUrl, wazeUrl } = buildPreciseMapsUrls(delivery, address)
                  const whatsappUrl = buildWhatsAppUrl(delivery.customer_whatsapp || delivery.customer_phone, 'Ola! Sou o entregador e estou com o seu pedido.')

                  return (
                    <Card key={delivery.id} className="overflow-hidden">
                      <CardHeader className="flex flex-col gap-2 border-b border-dark-600 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Atribuido em {formatDateTime(delivery.assigned_at)}</p>
                          <h2 className="text-xl font-bold text-white">{delivery.customer_name || 'Cliente'}</h2>
                        </div>
                        <Badge variant="info">{statusLabels[delivery.delivery_status] || delivery.delivery_status}</Badge>
                      </CardHeader>
                      <CardContent className="space-y-4 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-dark-600 bg-dark-900 p-3">
                            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-300">
                              <MapPin size={16} />
                              Endereco
                            </p>
                            <p className="text-white">{address || 'Endereco nao informado'}</p>
                            {delivery.reference && <p className="mt-1 text-sm text-gray-400">Ref.: {delivery.reference}</p>}
                            {preciseLocation && (
                              <div className="mt-3 rounded-lg border border-green-700/60 bg-green-950/30 p-2 text-sm text-green-200">
                                <p className="font-semibold">Localizacao recebida pelo WhatsApp</p>
                                <p className="text-green-100/80">Maps e Waze vao abrir no pin enviado pelo cliente.</p>
                                {delivery.delivery_location_received_at && (
                                  <p className="mt-1 text-xs text-green-100/70">
                                    Recebida em {formatDateTime(delivery.delivery_location_received_at)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="rounded-lg border border-dark-600 bg-dark-900 p-3">
                            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-300">
                              <Wallet size={16} />
                              Pagamento
                            </p>
                            <p className="text-white">{paymentLabels[delivery.payment_method] || delivery.payment_method || '-'}</p>
                            {delivery.payment_method === 'money' && Number(delivery.change_for || 0) > 0 && (
                              <p className="mt-1 text-sm text-yellow-300">Troco para {formatCurrency(delivery.change_for)}</p>
                            )}
                            <p className="mt-2 text-lg font-bold text-white">Total: {formatCurrency(delivery.total)}</p>
                            <p className="text-sm text-gray-400">Taxa: {formatCurrency(delivery.delivery_fee)}</p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-dark-600 bg-dark-900 p-3">
                          <p className="mb-2 text-sm font-semibold text-gray-300">Itens</p>
                          <div className="space-y-1">
                            {(delivery.order_items || []).map(item => (
                              <p key={item.id} className="text-sm text-white">
                                {item.quantity || 1}x {item.product_name}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <Button variant="secondary" onClick={() => openExternal(mapsUrl)}>
                            <Navigation size={17} className="mr-2" />
                            Maps
                          </Button>
                          <Button variant="secondary" onClick={() => openExternal(wazeUrl)}>
                            <Navigation size={17} className="mr-2" />
                            Waze
                          </Button>
                          <Button variant="secondary" onClick={() => openExternal(whatsappUrl)}>
                            <Phone size={17} className="mr-2" />
                            Cliente
                          </Button>
                        </div>

                        <Button
                          size="lg"
                          className="w-full"
                          loading={finishingId === delivery.id}
                          onClick={() => handleComplete(delivery)}
                        >
                          <CheckCircle2 size={20} className="mr-2" />
                          Finalizar entrega
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Histórico ── */}
        {activeTab === 'history' && (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <History size={20} />
                Histórico de entregas
              </h2>
              <Button variant="ghost" size="sm" onClick={() => fetchHistory(historyFilter)} loading={historyLoading}>
                <RefreshCw size={16} className="mr-1" />
                Atualizar
              </Button>
            </div>

            <FilterChips filters={HISTORY_FILTERS} active={historyFilter} onChange={handleHistoryFilter} />

            {historyLoading ? (
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 text-center text-white">
                Carregando histórico...
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-8 text-center">
                <ClipboardList size={38} className="mx-auto mb-3 text-gray-500" />
                <p className="text-lg font-semibold text-white">Nenhuma entrega neste período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((order) => {
                  const address = buildAddress(order)
                  return (
                    <Card key={order.id || order.assigned_at} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div>
                            <p className="text-xs text-gray-400">{formatDateTime(order.assigned_at)}</p>
                            <h3 className="font-bold text-white">
                              #{order.order_number || order.id?.substring(0, 8)} — {order.customer_name || '—'}
                            </h3>
                          </div>
                          <Badge variant={getHistoryStatusVariant(order.delivery_status)}>
                            {statusLabels[order.delivery_status] || order.delivery_status || 'Entregue'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">{address || '—'}</p>
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <span className="text-gray-400">Taxa: <span className="font-semibold text-white">{formatCurrency(order.delivery_fee)}</span></span>
                          <span className="text-gray-400">Total: <span className="font-semibold text-white">{formatCurrency(order.total)}</span></span>
                          {order.payment_method && (
                            <span className="text-green-400 font-semibold">
                              {paymentLabels[order.payment_method] || order.payment_method}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Financeiro ── */}
        {activeTab === 'finance' && (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet size={20} />
                Financeiro
              </h2>
              <Button variant="ghost" size="sm" onClick={() => fetchFinance(financeFilter)} loading={financeLoading}>
                <RefreshCw size={16} className="mr-1" />
                Atualizar
              </Button>
            </div>

            <FilterChips filters={FINANCE_FILTERS} active={financeFilter} onChange={handleFinanceFilter} />

            {/* Custom date range picker */}
            {financeFilter === 'custom' && (
              <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dark-600 bg-dark-900 p-4">
                <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
                  <label className="text-xs font-medium text-gray-400">De</label>
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
                  <label className="text-xs font-medium text-gray-400">Até</label>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    max={todayStr}
                    onChange={e => setCustomTo(e.target.value)}
                    className="rounded-lg border border-dark-600 bg-dark-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <Button onClick={handleCustomFinanceSearch} loading={financeLoading} className="shrink-0">
                  Buscar
                </Button>
              </div>
            )}

            {financeLoading ? (
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 text-center text-white">
                Carregando financeiro...
              </div>
            ) : finance ? (
              <div className="space-y-4">
                {/* Liquid value — highlight card */}
                <div className="rounded-xl border border-dark-600 bg-dark-900 p-5 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-dark-800 border border-dark-600 shrink-0">
                    <Wallet size={28} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Valor líquido a receber</p>
                    <p className="text-3xl font-black text-white mt-0.5">{formatCurrency(finance.netAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="text-green-400">+{formatCurrency(finance.totalCredits)}</span>
                      {' '}créditos{' '}
                      <span className="text-red-400">−{formatCurrency(finance.totalDebits)}</span>
                      {' '}descontos
                    </p>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3">
                  <SummaryCard icon={CheckCircle2} title="Entregas hoje" value={`${finance.todayDeliveries}`} accent="yellow" />
                  <SummaryCard icon={Wallet} title="Taxa hoje" value={formatCurrency(finance.todayFee)} accent="yellow" />
                  <SummaryCard icon={Bike} title="Entregas período" value={`${finance.periodDeliveries}`} accent="white" />
                  <SummaryCard icon={Wallet} title="Taxa período" value={formatCurrency(finance.periodFee)} accent="white" />
                </div>

                {/* Adjustments list */}
                <Card>
                  <CardHeader className="border-b border-dark-600 p-4">
                    <h3 className="font-bold text-white">Extrato financeiro</h3>
                  </CardHeader>
                  <CardContent className="p-4">
                    {finance.adjustments.length === 0 ? (
                      <p className="text-center text-gray-400 py-4">Nenhum lançamento neste período</p>
                    ) : (
                      <div className="space-y-3">
                        {finance.adjustments.map((adj) => {
                          const credit = isAdjustmentCredit(adj)
                          const Icon = credit ? TrendingUp : TrendingDown
                          const colorClass = credit ? 'text-green-400' : 'text-red-400'
                          const bgClass = credit ? 'bg-green-950/30' : 'bg-red-950/30'
                          const label = adjustmentLabels[adj.type] || adj.type || 'Ajuste'
                          const date = adj.adjustment_date || adj.created_at
                          return (
                            <div key={adj.id} className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgClass} shrink-0`}>
                                <Icon size={19} className={colorClass} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white text-sm">{label}</p>
                                {adj.description && (
                                  <p className="text-xs text-gray-400 truncate">{adj.description}</p>
                                )}
                                <p className="text-xs text-gray-500">{date ? formatDateTime(date) : '—'}</p>
                              </div>
                              <p className={`font-bold text-sm shrink-0 ${colorClass}`}>
                                {credit ? '+' : '-'} {formatCurrency(adj.amount)}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-8 text-center">
                <p className="text-gray-400">Nenhum dado disponível</p>
              </div>
            )}
          </>
        )}

        {/* ── Perfil ── */}
        {activeTab === 'profile' && (
          <>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <User size={20} />
              Meu perfil
            </h2>

            {/* Hidden file input for photo upload */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />

            {profileLoading ? (
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 text-center text-white">
                Carregando perfil...
              </div>
            ) : profile ? (
              <Card>
                <CardContent className="p-6 space-y-4">
                  {/* Avatar + name */}
                  <div className="flex flex-col items-center gap-3 pb-5 border-b border-dark-600">
                    <button
                      type="button"
                      title="Trocar foto"
                      disabled={uploadingPhoto}
                      onClick={() => photoInputRef.current?.click()}
                      className="relative group focus:outline-none"
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dark-600 bg-dark-800 overflow-hidden transition-opacity group-hover:opacity-80">
                        {profile.photo_url ? (
                          <img
                            src={profile.photo_url}
                            alt="Foto"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User size={48} className="text-gray-500" />
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-dark-600 bg-dark-700 text-xs text-gray-300 group-hover:bg-dark-600">
                        {uploadingPhoto ? '…' : '📷'}
                      </span>
                    </button>
                    <p className="text-xs text-gray-500">Toque na foto para alterar</p>

                    <div className="text-center">
                      <h3 className="text-2xl font-black text-white">{profile.name || '—'}</h3>
                      {profile.phone && (
                        <p className="text-gray-400 text-sm mt-1">{profile.phone}</p>
                      )}
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${profile.is_active || profile.active ? 'bg-green-400' : 'bg-gray-500'}`} />
                        <span className={`text-sm font-semibold ${profile.is_active || profile.active ? 'text-green-400' : 'text-gray-400'}`}>
                          {profile.is_active || profile.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-3 text-sm">
                    {profile.pix_key && (
                      <div className="flex justify-between gap-2 rounded-lg border border-dark-600 bg-dark-900 px-4 py-3">
                        <span className="text-gray-400">Chave Pix</span>
                        <span className="text-white font-medium text-right">{profile.pix_key}</span>
                      </div>
                    )}
                    {profile.daily_rate != null && (
                      <div className="flex justify-between gap-2 rounded-lg border border-dark-600 bg-dark-900 px-4 py-3">
                        <span className="text-gray-400">Diária</span>
                        <span className="text-white font-medium">{formatCurrency(profile.daily_rate)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-8 text-center">
                <p className="text-gray-400">Nenhum dado disponível</p>
              </div>
            )}

            <Button
              variant="danger"
              size="lg"
              className="w-full mt-2"
              onClick={handleSignOut}
            >
              <LogOut size={18} className="mr-2" />
              SAIR DA CONTA
            </Button>

            <p className="text-center text-xs text-gray-600 pb-2">
              Versão 1.0.0 — Desenvolvido pela ReplyMesh
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default MotoboyPortal
