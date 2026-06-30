import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bike,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import {
  completeMotoboyOrder,
  getMotoboyOrders,
  getMotoboyProfile,
  getMotoboyToken,
} from '../../services/motoboyApi'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'
import { scheduleAdaptivePoll } from '../../utils/adaptivePolling'
import MotoboyLayout from './MotoboyLayout'

const statusLabels = {
  assigned: 'Atribuido',
  on_the_way: 'Em rota',
  delivered: 'Entregue',
  completed: 'Concluido',
}

const paymentLabels = {
  money: 'Dinheiro',
  pix: 'Pix',
  card_on_delivery: 'Cartao na entrega',
}

const openExternal = (url) => {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

const buildAddress = (order = {}) => {
  const address = order.address || {}
  const parts = [
    address.street && `${address.street}${address.number ? `, ${address.number}` : ''}`,
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
  ].filter(Boolean)
  return parts.join(' | ')
}

const buildMapsUrls = (order, address) => ({
  mapsUrl: order.google_maps_url || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''),
  wazeUrl: order.waze_url || (address ? `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes` : ''),
})

const hasWhatsappLocation = (order = {}) => (
  Boolean(
    (order.delivery_latitude && order.delivery_longitude) ||
    order.delivery_location_received_at ||
    order.google_maps_url ||
    order.waze_url
  )
)

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '')

const customerUrl = (phone, companyName) => {
  const digits = normalizePhone(phone)
  if (!digits) return ''
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`
  const text = encodeURIComponent(`Ola, sou o motoboy da ${companyName || 'loja'}. Estou com o seu pedido.`)
  return `https://wa.me/${withCountry}?text=${text}`
}

const itemOptionsText = (item) => (
  (item.selected_options || [])
    .map(group => {
      const options = Array.isArray(group.options) ? group.options.join(', ') : ''
      return options ? `${group.group_name}: ${options}` : ''
    })
    .filter(Boolean)
    .join(' | ')
)

const MotoboyDashboard = () => {
  const navigate = useNavigate()
  const basePath = useCompanyBasePath()
  const [orders, setOrders] = useState([])
  const [route, setRoute] = useState(null)
  const [profile, setProfile] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  const ensureAuth = useCallback(() => {
    if (!getMotoboyToken()) {
      navigate(`${basePath}/motoboy/login`, { replace: true })
      return false
    }
    return true
  }, [basePath, navigate])

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!ensureAuth()) return
    try {
      if (!silent) setLoading(true)
      const [profileResponse, ordersResponse] = await Promise.all([
        getMotoboyProfile(),
        getMotoboyOrders(),
      ])
      setProfile(profileResponse.motoboy)
      setCompany(profileResponse.company)
      setOrders(ordersResponse.orders || [])
      setRoute(ordersResponse.route || null)
    } catch (error) {
      if (error.status === 401) {
        navigate(`${basePath}/motoboy/login`, { replace: true })
        return
      }
      toast.error(error.message || 'Nao foi possivel carregar entregas')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [basePath, ensureAuth, navigate])

  useEffect(() => {
    loadData()
    const stopPolling = scheduleAdaptivePoll({
      run: () => loadData({ silent: true }),
      visibleMs: 15000,
      hiddenMs: 60000,
      maxMs: 120000,
    })
    return () => stopPolling()
  }, [loadData])

  const activeDeliveries = useMemo(
    () => orders.filter(order => ['assigned', 'on_the_way'].includes(order.delivery_status)),
    [orders]
  )

  const handleComplete = async (orderId) => {
    const confirmed = window.confirm('Finalizar esta entrega? O pedido sera marcado como concluido.')
    if (!confirmed) return

    setActionId(orderId)
    try {
      await completeMotoboyOrder(orderId)
      toast.success('Entrega finalizada')
      await loadData({ silent: true })
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel finalizar entrega')
    } finally {
      setActionId(null)
    }
  }

  return (
    <MotoboyLayout company={company}>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">Painel do motoboy</p>
            <h1 className="text-2xl font-bold text-white">Minhas entregas</h1>
            <p className="mt-1 text-sm text-gray-400">
              {profile ? `${profile.name} · ${profile.total_deliveries || 0} entregas concluidas` : 'Pedidos atribuidos ao seu cadastro aparecem aqui.'}
            </p>
          </div>
          <Button variant="secondary" onClick={() => loadData()} loading={loading}>
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
          {activeDeliveries.length > 1 && route?.maps_url && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Rota sugerida</p>
                  <h2 className="text-xl font-bold text-white">{activeDeliveries.length} entregas em sequencia</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {route.summary?.estimated_distance_km || 0} km estimados · {route.summary?.estimated_delivery_minutes || 0} min estimados
                  </p>
                </div>
                <Button variant="success" onClick={() => openExternal(route.maps_url)}>
                  <Navigation size={18} className="mr-2" />
                  Abrir rota no Maps
                </Button>
              </CardContent>
            </Card>
          )}

          {activeDeliveries.map((order) => {
            const address = buildAddress(order)
            const { mapsUrl, wazeUrl } = buildMapsUrls(order, address)
            const phone = order.customer_whatsapp || order.customer_phone
            const whatsappLocation = hasWhatsappLocation(order)

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="flex flex-col gap-2 border-b border-dark-600 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      {order.route_position ? `Parada ${order.route_position} · ` : ''}
                      Atribuido em {formatDateTime(order.assigned_at || order.delivery_history?.assigned_at || order.created_at)}
                    </p>
                    <h2 className="text-xl font-bold text-white">{order.customer_name || 'Cliente'}</h2>
                  </div>
                  <Badge variant={order.delivery_status === 'on_the_way' ? 'info' : 'warning'}>
                    {statusLabels[order.delivery_status] || order.delivery_status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-dark-600 bg-dark-900 p-3">
                      <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-300">
                        <MapPin size={16} />
                        Endereco
                      </p>
                      <p className="text-white">{address || 'Endereco nao informado'}</p>
                      {(order.delivery_area_name || order.estimated_distance_km || order.logistics_group) && (
                        <p className="mt-1 text-xs text-gray-400">
                          {order.delivery_area_name || order.address?.neighborhood || 'Area'}
                          {order.estimated_distance_km ? ` · ${order.estimated_distance_km} km estimados` : ''}
                          {order.estimated_delivery_minutes ? ` · ${order.estimated_delivery_minutes} min` : ''}
                          {order.logistics_group ? ` · Grupo ${order.logistics_group}` : ''}
                        </p>
                      )}
                      {order.address?.reference && <p className="mt-1 text-sm text-gray-400">Ref.: {order.address.reference}</p>}
                      {whatsappLocation ? (
                        <div className="mt-3 rounded-lg border border-green-500/70 bg-green-950/70 p-3 shadow-lg shadow-green-950/20">
                          <p className="text-sm font-bold text-green-100">Localização confirmada pelo cliente</p>
                          <p className="mt-1 text-xs text-green-100/85">Maps e Waze vão abrir no pin enviado pelo WhatsApp.</p>
                          {order.delivery_location_received_at && (
                            <p className="mt-2 text-xs text-green-200">
                              Recebida em {formatDateTime(order.delivery_location_received_at)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-lg border border-yellow-500/50 bg-yellow-950/40 p-3">
                          <p className="text-sm font-bold text-yellow-100">Aguardando localização do cliente</p>
                          <p className="mt-1 text-xs text-yellow-100/80">Maps e Waze usam o endereço digitado até o cliente enviar o pin.</p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border border-dark-600 bg-dark-900 p-3">
                      <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-300">
                        <Wallet size={16} />
                        Pagamento
                      </p>
                      <p className="text-white">{paymentLabels[order.payment_method] || order.payment_method || '-'}</p>
                      <p className="mt-2 text-lg font-bold text-white">Total: {formatCurrency(order.total)}</p>
                      <p className="text-sm text-gray-400">Taxa: {formatCurrency(order.delivery_fee || 0)}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-dark-600 bg-dark-900 p-3">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-300">
                      <ClipboardList size={16} />
                      Itens
                    </p>
                    <div className="space-y-1">
                      {(order.items || []).map(item => (
                        <div key={item.id} className="text-sm">
                          <p className="text-white">{item.quantity || 1}x {item.product_name}</p>
                          {itemOptionsText(item) && <p className="text-xs text-gray-500">{itemOptionsText(item)}</p>}
                          {item.notes && <p className="text-xs text-yellow-300">Obs.: {item.notes}</p>}
                        </div>
                      ))}
                    </div>
                    {order.notes && <p className="mt-3 text-sm text-yellow-300">Obs. pedido: {order.notes}</p>}
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
                    <Button variant="secondary" onClick={() => openExternal(customerUrl(phone, company?.name))}>
                      <Phone size={17} className="mr-2" />
                      Cliente
                    </Button>
                  </div>

                  {['assigned', 'on_the_way'].includes(order.delivery_status) && (
                    <Button
                      size="lg"
                      variant="success"
                      className="w-full"
                      loading={actionId === order.id}
                      onClick={() => handleComplete(order.id)}
                    >
                      <CheckCircle2 size={20} className="mr-2" />
                      Finalizar entrega
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </MotoboyLayout>
  )
}

export default MotoboyDashboard
