import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
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
  Clock,
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

const areaIcon = L.divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;border-radius:999px;background:#22c55e;border:3px solid #fff;box-shadow:0 12px 30px rgba(34,197,94,.35);"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const storeIcon = L.divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:999px;background:#facc15;border:3px solid #111827;box-shadow:0 10px 25px rgba(250,204,21,.35);"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
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

const MapFocus = ({ center }) => {
  const map = useMap()

  useEffect(() => {
    if (center) map.setView(center, 14, { animate: true })
  }, [center, map])

  return null
}

const DeliveryAreaMap = ({ formData, onPositionChange }) => {
  const position = getPosition(formData)
  const center = position || defaultMapCenter

  return (
    <div className="overflow-hidden rounded-2xl border border-dark-600 bg-dark-900">
      <div className="flex flex-col gap-1 border-b border-dark-600 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Map size={16} className="text-green-300" />
          Mapa da regiao
        </div>
        <p className="text-xs text-gray-400">
          Ponto usado apenas para organizar rotas. O cliente nao vera isso.
        </p>
      </div>

      <div className="h-72">
        <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
          <MapFocus center={center} />
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={defaultMapCenter} icon={storeIcon}>
            <Popup>Referencia da loja/cidade</Popup>
          </Marker>
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
        <div className="border-t border-dark-600 px-4 py-3 text-sm text-gray-300">
          Busque um ponto de referencia ou informe coordenadas nas configuracoes avancadas.
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

  const referenceQuery = useMemo(() => (
    [formData.reference_point, formData.city].filter(Boolean).join(', ')
  ), [formData.reference_point, formData.city])

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
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(referenceQuery)}`
      const response = await fetch(url, { headers: { Accept: 'application/json' } })
      const payload = await response.json()
      const result = payload?.[0]

      if (!result) {
        toast.error('Nao encontrei esse ponto. Voce pode abrir no Google Maps ou informar coordenadas avancadas.')
        return
      }

      setFormData(prev => ({
        ...prev,
        latitude: Number(result.lat).toFixed(7),
        longitude: Number(result.lon).toFixed(7),
      }))
      toast.success('Ponto encontrado e coordenadas preenchidas.')
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
  }

  const updatePosition = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: Number(lat).toFixed(7),
      longitude: Number(lng).toFixed(7),
    }))
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
          </div>

          <div>
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
          </div>

          <DeliveryAreaMap formData={formData} onPositionChange={updatePosition} />

          <Textarea
            label="Aliases / variacoes"
            placeholder={'Um por linha. Ex:\nApolo 2\nConjunto Apollo 2\nRegiao de Manilha'}
            value={formData.aliases}
            onChange={(event) => setFormData(prev => ({ ...prev, aliases: event.target.value }))}
            rows={4}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Input
                label="Taxa de entrega"
                type="number"
                step="0.01"
                required
                value={formData.delivery_fee}
                onChange={(event) => setFormData(prev => ({ ...prev, delivery_fee: event.target.value }))}
              />
            </div>

            <div>
              <Input
                label="Prioridade da rota"
                type="number"
                value={formData.match_priority}
                onChange={(event) => setFormData(prev => ({ ...prev, match_priority: event.target.value }))}
              />
              <p className="mt-1 text-xs text-gray-400">Numeros menores aparecem primeiro na rota sugerida.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Input
                label="Tempo medio de entrega (min)"
                type="number"
                placeholder="Ex: 35"
                value={formData.estimated_time}
                onChange={(event) => setFormData(prev => ({ ...prev, estimated_time: event.target.value }))}
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Input
                label="Grupo de rota / regiao proxima"
                placeholder="Ex: Apollo, Manilha, Centro"
                value={formData.logistics_group}
                onChange={(event) => setFormData(prev => ({ ...prev, logistics_group: event.target.value }))}
              />
              <p className="mt-1 text-xs text-gray-400">Ex: Apollo, Manilha, Centro.</p>
            </div>

            <Input
              label="Valor minimo do pedido"
              type="number"
              step="0.01"
              value={formData.minimum_order_amount}
              onChange={(event) => setFormData(prev => ({ ...prev, minimum_order_amount: event.target.value }))}
            />
          </div>

          <Textarea
            label="Observacao interna"
            value={formData.internal_note}
            onChange={(event) => setFormData(prev => ({ ...prev, internal_note: event.target.value }))}
            rows={2}
          />

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-dark-600 bg-dark-900 px-4 py-3 text-left text-sm font-semibold text-white"
            onClick={() => setAdvancedOpen(prev => !prev)}
          >
            Configuracoes avancadas
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
            </div>
          )}

          <Input
            label="Slug"
            required
            value={formData.slug}
            onChange={(event) => setFormData(prev => ({ ...prev, slug: normalizeSlug(event.target.value) }))}
          />

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
