import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useDeliveryZones } from '../../hooks/useDeliveryZones'
import {
  railsCreateDeliveryZone,
  railsUpdateDeliveryZone,
  railsDeleteDeliveryZone,
} from '../../services/storeApi'
import { matchDeliveryZone } from '../../services/deliveryZones'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import {
  ChevronDown,
  Edit,
  ExternalLink,
  LocateFixed,
  Map,
  MapPin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import { getStoreSettings } from '../../services/settings'
import { toast } from 'sonner'

const initialFormData = {
  name: '',
  slug: '',
  city: '',
  aliases: '',
  delivery_fee: '',
  estimated_time: '',
  estimated_distance_km: '',
  logistics_group: '',
  latitude: '',
  longitude: '',
  reference_point: '',
  minimum_order_amount: '',
  match_priority: 100,
  internal_note: '',
  is_active: true,
}

const defaultMapCenter = [-22.8268, -43.0634]
const defaultMapLabel = 'Sao Goncalo/RJ'

const areaIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;border-radius:999px;background:#22c55e;border:3px solid #fff;box-shadow:0 12px 30px rgba(34,197,94,.35);"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const normalizeSlug = (value) => (
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const formatKm = (value) => {
  if (value === '' || value == null) return ''
  return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km`
}

const getPosition = (formData) => {
  const lat = Number(formData.latitude)
  const lng = Number(formData.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null
}

const buildMapsSearchUrl = (query) => (
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || '')}`
)

const knownCityCenter = (value = '') => {
  const city = String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (city.includes('sao goncalo')) return { center: [-22.8268, -43.0634], label: 'Sao Goncalo/RJ' }
  if (city.includes('rio de janeiro')) return { center: [-22.9068, -43.1729], label: 'Rio de Janeiro/RJ' }
  if (city.includes('niteroi')) return { center: [-22.8832, -43.1034], label: 'Niteroi/RJ' }
  if (city.includes('itaborai')) return { center: [-22.7448, -42.8598], label: 'Itaborai/RJ' }
  if (city.includes('marica')) return { center: [-22.9196, -42.8186], label: 'Marica/RJ' }
  return null
}

const geocodeAddress = async (query) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  const payload = await response.json()
  return payload?.[0] || null
}

const MapFocus = ({ center }) => {
  const map = useMap()

  useEffect(() => {
    if (center) map.setView(center, 14, { animate: true })
  }, [center, map])

  return null
}

const MapClickHandler = ({ onPositionChange }) => {
  useMapEvents({
    click: (event) => onPositionChange(event.latlng.lat, event.latlng.lng),
  })
  return null
}

const DeliveryAreaMap = ({ formData, mapCenter, mapLabel, onPositionChange, onSearchReference }) => {
  const position = getPosition(formData)
  const center = position || mapCenter || defaultMapCenter

  return (
    <div className="overflow-hidden rounded-2xl border border-dark-600 bg-dark-900">
      <div className="flex flex-col gap-1 border-b border-dark-600 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Map size={16} className="text-green-300" />
          Mapa da regiao
        </div>
        <p className="text-xs text-gray-400">
          Clique no mapa para marcar o ponto aproximado da regiao. O cliente nao vera isso.
        </p>
      </div>

      <div className="h-72">
        <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
          <MapFocus center={center} />
          <MapClickHandler onPositionChange={onPositionChange} />
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && (
            <Marker
              position={position}
              icon={areaIcon}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const marker = event.target
                  const next = marker.getLatLng()
                  onPositionChange(next.lat, next.lng)
                },
              }}
            >
              <Popup>Arraste para ajustar o ponto da regiao</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {!position && (
        <div className="flex flex-col gap-3 border-t border-dark-600 px-4 py-3 text-sm text-gray-300 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">Busque um ponto de referencia para posicionar esta regiao no mapa.</p>
            <p className="mt-1 text-xs text-gray-400">Centro atual: {mapLabel || defaultMapLabel}. Nenhum marcador sera salvo ate voce buscar ou clicar no mapa.</p>
          </div>
          <Button type="button" variant="secondary" onClick={onSearchReference}>
            <LocateFixed size={16} className="mr-2" />
            Buscar ponto
          </Button>
        </div>
      )}
    </div>
  )
}

const DeliveryZones = () => {
  const { zones, loading, refetch } = useDeliveryZones(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [saving, setSaving] = useState(false)
  const [testAddress, setTestAddress] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [storeSettings, setStoreSettings] = useState(null)
  const [mapCenter, setMapCenter] = useState(defaultMapCenter)
  const [mapLabel, setMapLabel] = useState(defaultMapLabel)
  const [regionPreview, setRegionPreview] = useState(null)

  const referenceQuery = useMemo(() => (
    [
      formData.reference_point,
      formData.name,
      formData.city || storeSettings?.city,
      storeSettings?.state || storeSettings?.uf || 'RJ',
    ].filter(Boolean).join(', ')
  ), [formData.reference_point, formData.name, formData.city, storeSettings])

  useEffect(() => {
    getStoreSettings()
      .then(settings => {
        setStoreSettings(settings)
        const known = knownCityCenter([settings.city, settings.state || settings.uf].filter(Boolean).join(', '))
        if (known) {
          setMapCenter(known.center)
          setMapLabel(known.label)
        }
      })
      .catch(() => {
        // Configuracao da loja nao deve bloquear a tela de areas.
      })
  }, [])

  useEffect(() => {
    if (!modalOpen || getPosition(formData)) return

    const known = knownCityCenter(formData.city || storeSettings?.city)
    if (known) {
      setMapCenter(known.center)
      setMapLabel(known.label)
    } else {
      setMapCenter(defaultMapCenter)
      setMapLabel(defaultMapLabel)
    }
  }, [formData.city, formData.latitude, formData.longitude, modalOpen, storeSettings])

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      const data = {
        ...formData,
        slug: normalizeSlug(formData.slug || formData.name),
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        minimum_order_amount: parseFloat(formData.minimum_order_amount) || 0,
        estimated_distance_km: formData.estimated_distance_km === '' ? '' : parseFloat(formData.estimated_distance_km),
        latitude: formData.latitude === '' ? '' : parseFloat(formData.latitude),
        longitude: formData.longitude === '' ? '' : parseFloat(formData.longitude),
        match_priority: parseInt(formData.match_priority, 10) || 100,
        aliases: String(formData.aliases || '')
          .split(/[\n,;]+/)
          .map(value => value.trim())
          .filter(Boolean),
      }

      if (editingZone) {
        await railsUpdateDeliveryZone(editingZone.id, data)
        toast.success('Area de entrega atualizada com sucesso!')
      } else {
        await railsCreateDeliveryZone(data)
        toast.success('Area de entrega criada com sucesso!')
      }

      setModalOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      console.error('Error saving delivery zone:', error)
      toast.error(error.message || 'Erro ao salvar area de entrega')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (zone) => {
    setEditingZone(zone)
    setFormData({
      name: zone.name || '',
      slug: zone.slug || '',
      city: zone.city || '',
      aliases: Array.isArray(zone.aliases) ? zone.aliases.join('\n') : '',
      delivery_fee: zone.delivery_fee || '',
      estimated_time: zone.estimated_time || '',
      estimated_distance_km: zone.estimated_distance_km ?? '',
      logistics_group: zone.logistics_group || '',
      latitude: zone.latitude ?? '',
      longitude: zone.longitude ?? '',
      reference_point: [zone.name, zone.city].filter(Boolean).join(', '),
      minimum_order_amount: zone.minimum_order_amount || '',
      match_priority: zone.match_priority || 100,
      internal_note: zone.internal_note || zone.notes || '',
      is_active: zone.is_active !== false,
    })
    const position = getPosition({ latitude: zone.latitude, longitude: zone.longitude })
    if (position) {
      setMapCenter(position)
      setMapLabel(zone.name || 'Ponto salvo da regiao')
    }
    setAdvancedOpen(Boolean(zone.latitude && zone.longitude))
    setModalOpen(true)
  }

  const handleDelete = async (zoneId) => {
    if (!confirm('Tem certeza que deseja desativar esta area de entrega?')) return

    try {
      await railsDeleteDeliveryZone(zoneId)
      toast.success('Area de entrega desativada com sucesso!')
      refetch()
    } catch (error) {
      console.error('Error deleting delivery zone:', error)
      toast.error('Erro ao desativar area de entrega')
    }
  }

  const handleTestAddress = async () => {
    if (!testAddress.trim()) {
      toast.error('Informe um bairro, rua ou referencia para testar.')
      return
    }

    try {
      setTesting(true)
      const result = await matchDeliveryZone(testAddress)
      setTestResult(result)
    } catch (error) {
      console.error('Error testing delivery zone:', error)
      toast.error(error.message || 'Nao foi possivel testar a area de entrega')
    } finally {
      setTesting(false)
    }
  }

  const handleSearchReference = async () => {
    if (!referenceQuery.trim()) {
      toast.error('Informe um ponto de referencia para buscar.')
      return
    }

    try {
      setLocating(true)
      const result = await geocodeAddress(referenceQuery)

      if (!result) {
        toast.error('Nao encontramos esse ponto. Tente informar bairro, cidade ou um local conhecido.')
        return
      }

      const nextCenter = [Number(result.lat), Number(result.lon)]
      setFormData(prev => ({
        ...prev,
        latitude: nextCenter[0].toFixed(7),
        longitude: nextCenter[1].toFixed(7),
      }))
      setMapCenter(nextCenter)
      setMapLabel(result.display_name || formData.name || 'Ponto encontrado')
      toast.success('Ponto encontrado. Voce pode arrastar o marcador se precisar.')
    } catch (error) {
      console.error('Error geocoding delivery point:', error)
      toast.error('Mapa/geocoding indisponivel agora. A area pode ser salva sem coordenadas.')
    } finally {
      setLocating(false)
    }
  }

  const resetForm = () => {
    setEditingZone(null)
    setFormData(initialFormData)
    setAdvancedOpen(false)
    setRegionPreview(null)
    const known = knownCityCenter(storeSettings?.city)
    setMapCenter(known?.center || defaultMapCenter)
    setMapLabel(known?.label || defaultMapLabel)
  }

  const updatePosition = (lat, lng) => {
    const nextCenter = [Number(lat), Number(lng)]
    setFormData(prev => ({
      ...prev,
      latitude: nextCenter[0].toFixed(7),
      longitude: nextCenter[1].toFixed(7),
    }))
    setMapCenter(nextCenter)
    setMapLabel(formData.name || 'Ponto marcado no mapa')
  }

  const handlePreviewRegion = () => {
    const group = formData.logistics_group || formData.name || 'Sem grupo'
    const distance = formatKm(formData.estimated_distance_km) || 'sem distancia'
    const priority = formData.match_priority || 100
    setRegionPreview(`Essa regiao entraria na rota como: ${group} / ${distance} / prioridade ${priority}.`)
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Areas de Entrega</h1>
          <p className="mt-1 text-gray-400">
            Configure regioes, taxas e organizacao de rota sem expor dados tecnicos ao cliente.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true) }}>
          <Plus size={20} className="mr-2" />
          Nova Area
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Testar correspondencia de entrega</h2>
          <p className="text-sm text-gray-400">
            Digite como o cliente costuma escrever o bairro/regiao para validar aliases e prioridades.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              placeholder="Ex: Apolo 3, Conjunto Apollo 2, Manilha..."
              value={testAddress}
              onChange={(event) => setTestAddress(event.target.value)}
            />
            <Button onClick={handleTestAddress} loading={testing}>
              <Search size={18} className="mr-2" />
              Testar
            </Button>
          </div>

          {testResult && (
            <div className={`rounded-2xl border p-4 ${testResult.zone ? 'border-green-700 bg-green-900/25' : 'border-red-700 bg-red-900/25'}`}>
              {testResult.zone ? (
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="md:col-span-2">
                    <p className="text-sm uppercase tracking-wide text-green-200/80">Area encontrada</p>
                    <p className="text-xl font-bold text-green-100">{testResult.zone.name}</p>
                    {testResult.match?.reason && (
                      <p className="mt-1 text-xs text-green-100/80">
                        Match encontrado por {testResult.match.reason.source}: "{testResult.match.reason.label}"
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-green-200/80">Taxa</p>
                    <p className="font-bold text-white">{formatCurrency(testResult.zone.delivery_fee)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-200/80">Distancia estimada</p>
                    <p className="font-bold text-white">{formatKm(testResult.zone.estimated_distance_km) || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-200/80">Tempo / Grupo</p>
                    <p className="font-bold text-white">
                      {testResult.zone.estimated_time ? `${testResult.zone.estimated_time} min` : '-'}
                      {testResult.zone.logistics_group ? ` · ${testResult.zone.logistics_group}` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-red-200">
                  Nenhuma area encontrada. Verifique aliases ou cadastre uma nova variacao.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-8 text-center text-white">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {zones?.map((zone) => (
            <Card key={zone.id} className={!zone.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="rounded-xl bg-green-500/10 p-2 text-green-300">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{zone.name}</h3>
                        <p className="text-xs text-gray-500">{zone.city || 'Cidade nao informada'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={zone.is_active ? 'success' : 'danger'}>
                        {zone.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="default">Prioridade {zone.match_priority || 100}</Badge>
                      {zone.logistics_group && <Badge variant="info">Grupo {zone.logistics_group}</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(zone)}>
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(zone.id)}>
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-dark-600 bg-dark-900 p-3">
                    <p className="text-xs text-gray-500">Taxa</p>
                    <p className="font-bold text-white">{formatCurrency(zone.delivery_fee)}</p>
                  </div>
                  <div className="rounded-xl border border-dark-600 bg-dark-900 p-3">
                    <p className="text-xs text-gray-500">Distancia</p>
                    <p className="font-bold text-white">{formatKm(zone.estimated_distance_km) || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-dark-600 bg-dark-900 p-3">
                    <p className="text-xs text-gray-500">Tempo</p>
                    <p className="font-bold text-white">{zone.estimated_time ? `${zone.estimated_time} min` : '-'}</p>
                  </div>
                  <div className="rounded-xl border border-dark-600 bg-dark-900 p-3">
                    <p className="text-xs text-gray-500">Valor minimo</p>
                    <p className="font-bold text-white">
                      {zone.minimum_order_amount > 0 ? formatCurrency(zone.minimum_order_amount) : '-'}
                    </p>
                  </div>
                </div>

                {Array.isArray(zone.aliases) && zone.aliases.length > 0 && (
                  <p className="mt-4 text-xs text-gray-400">Aliases: {zone.aliases.join(', ')}</p>
                )}

                {zone.internal_note && (
                  <p className="mt-2 text-xs text-gray-500">Obs. interna: {zone.internal_note}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingZone ? 'Editar Area de Entrega' : 'Nova Area de Entrega'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="rounded-2xl border border-dark-600 bg-dark-900/60 p-4">
            <p className="mb-4 text-sm font-bold uppercase tracking-wide text-green-300">1. Dados da regiao</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Nome da area"
                required
                value={formData.name}
                onChange={(event) => {
                  const name = event.target.value
                  setFormData(prev => ({
                    ...prev,
                    name,
                    slug: normalizeSlug(name),
                  }))
                }}
              />

              <Input
                label="Cidade"
                placeholder="Ex: Sao Goncalo, Itaborai"
                value={formData.city}
                onChange={(event) => setFormData(prev => ({ ...prev, city: event.target.value }))}
              />

              <Input
                label="Taxa de entrega"
                type="number"
                step="0.01"
                required
                value={formData.delivery_fee}
                onChange={(event) => setFormData(prev => ({ ...prev, delivery_fee: event.target.value }))}
              />

              <Input
                label="Valor minimo do pedido"
                type="number"
                step="0.01"
                value={formData.minimum_order_amount}
                onChange={(event) => setFormData(prev => ({ ...prev, minimum_order_amount: event.target.value }))}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-dark-600 bg-dark-900/60 p-4">
            <p className="mb-4 text-sm font-bold uppercase tracking-wide text-green-300">2. Logistica para o motoboy</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Input
                  label="Distancia estimada ate a loja (km)"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 4.5"
                  value={formData.estimated_distance_km}
                  onChange={(event) => setFormData(prev => ({ ...prev, estimated_distance_km: event.target.value }))}
                />
                <p className="mt-1 text-xs text-gray-400">Use um valor aproximado. Ex: 4.5</p>
              </div>

              <Input
                label="Tempo medio de entrega (min)"
                type="number"
                placeholder="Ex: 35"
                value={formData.estimated_time}
                onChange={(event) => setFormData(prev => ({ ...prev, estimated_time: event.target.value }))}
              />

              <div>
                <Input
                  label="Grupo de rota / regiao proxima"
                  placeholder="Ex: Apollo, Manilha, Centro"
                  value={formData.logistics_group}
                  onChange={(event) => setFormData(prev => ({ ...prev, logistics_group: event.target.value }))}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Use para juntar bairros proximos. Ex: Apollo 1, Apollo 2 e Apollo 3 podem ficar no grupo Apollo.
                </p>
              </div>

              <div>
                <Input
                  label="Prioridade da rota"
                  type="number"
                  value={formData.match_priority}
                  onChange={(event) => setFormData(prev => ({ ...prev, match_priority: event.target.value }))}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Numeros menores aparecem antes. Ex: 10 = perto, 50 = medio, 100 = longe. Se houver distancia em km, ela pesa mais.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={handlePreviewRegion}>
                Testar esta regiao
              </Button>
              {regionPreview && (
                <p className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                  {regionPreview}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-dark-600 bg-dark-900/60 p-4">
            <p className="mb-4 text-sm font-bold uppercase tracking-wide text-green-300">3. Ponto no mapa</p>
            <Input
              label="Ponto de referencia da regiao"
              placeholder="Ex: Praca do Apollo 2, Sao Goncalo"
              value={formData.reference_point}
              onChange={(event) => setFormData(prev => ({ ...prev, reference_point: event.target.value }))}
            />
            <p className="mt-1 text-xs text-gray-400">
              Use um local conhecido da regiao para ajudar o sistema a organizar rotas.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={handleSearchReference} loading={locating}>
                <LocateFixed size={17} className="mr-2" />
                Buscar ponto
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(buildMapsSearchUrl(referenceQuery || formData.name), '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink size={17} className="mr-2" />
                Abrir no Google Maps
              </Button>
            </div>

            <div className="mt-4">
              <DeliveryAreaMap
                formData={formData}
                mapCenter={mapCenter}
                mapLabel={mapLabel}
                onPositionChange={updatePosition}
                onSearchReference={handleSearchReference}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-dark-600 bg-dark-900/60 p-4">
            <p className="mb-4 text-sm font-bold uppercase tracking-wide text-green-300">4. Variacoes de nome</p>
            <Textarea
              label="Aliases / variacoes"
              placeholder={'Um por linha. Ex:\nApolo 2\nConjunto Apollo 2\nRegiao de Manilha'}
              value={formData.aliases}
              onChange={(event) => setFormData(prev => ({ ...prev, aliases: event.target.value }))}
              rows={4}
            />
          </section>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-dark-600 bg-dark-900 px-4 py-3 text-left text-sm font-semibold text-white"
            onClick={() => setAdvancedOpen(prev => !prev)}
          >
            5. Avancado
            <ChevronDown size={18} className={`transition ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>

          {advancedOpen && (
            <div className="rounded-2xl border border-dark-600 bg-dark-900 p-4">
              <p className="mb-3 text-sm text-gray-400">
                Use apenas se souber preencher coordenadas manualmente.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Latitude"
                  type="number"
                  step="0.0000001"
                  value={formData.latitude}
                  onChange={(event) => setFormData(prev => ({ ...prev, latitude: event.target.value }))}
                />

                <Input
                  label="Longitude"
                  type="number"
                  step="0.0000001"
                  value={formData.longitude}
                  onChange={(event) => setFormData(prev => ({ ...prev, longitude: event.target.value }))}
                />
              </div>

              <div className="mt-4">
                <Textarea
                  label="Observacao interna"
                  value={formData.internal_note}
                  onChange={(event) => setFormData(prev => ({ ...prev, internal_note: event.target.value }))}
                  rows={2}
                />
              </div>

              <div className="mt-4">
                <Input
                  label="Slug"
                  required
                  value={formData.slug}
                  onChange={(event) => setFormData(prev => ({ ...prev, slug: normalizeSlug(event.target.value) }))}
                />
              </div>
            </div>
          )}

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(event) => setFormData(prev => ({ ...prev, is_active: event.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-white">Area ativa</span>
          </label>

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1" loading={saving}>
              {editingZone ? 'Atualizar' : 'Criar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default DeliveryZones
