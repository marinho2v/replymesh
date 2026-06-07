import { useState } from 'react'
import { useDeliveryZones } from '../../hooks/useDeliveryZones'
import {
  railsCreateDeliveryZone,
  railsUpdateDeliveryZone,
  railsDeleteDeliveryZone,
} from '../../services/storeApi'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Clock, Edit, MapPin, Plus, Search, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import { toast } from 'sonner'

const initialFormData = {
  name: '',
  slug: '',
  city: '',
  aliases: '',
  delivery_fee: '',
  estimated_time: '',
  minimum_order_amount: '',
  match_priority: 100,
  notes: '',
  is_active: true,
}

const normalizeSlug = (value) => (
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
)

const DeliveryZones = () => {
  const { zones, loading, refetch } = useDeliveryZones(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [saving, setSaving] = useState(false)
  const [testAddress, setTestAddress] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSaving(true)
      const data = {
        ...formData,
        slug: normalizeSlug(formData.slug || formData.name),
        delivery_fee: parseFloat(formData.delivery_fee) || 0,
        minimum_order_amount: parseFloat(formData.minimum_order_amount) || 0,
        match_priority: parseInt(formData.match_priority, 10) || 100,
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
      minimum_order_amount: zone.minimum_order_amount || '',
      match_priority: zone.match_priority || 100,
      notes: zone.notes || '',
      is_active: zone.is_active !== false,
    })
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

  const handleTestAddress = () => {
    toast.info('Teste de endereco disponivel apos integracao completa de entrega')
  }

  const resetForm = () => {
    setEditingZone(null)
    setFormData(initialFormData)
  }

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Areas de Entrega</h1>
          <p className="text-gray-400 mt-1">
            Use aliases para reconhecer variacoes como Apolo 2, Apolo 3, Manilha e regioes.
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Ex: Marambaia, Apolo 3, Conjunto Apolo 2, Manilha..."
              value={testAddress}
              onChange={(event) => setTestAddress(event.target.value)}
            />
            <Button onClick={handleTestAddress} loading={testing}>
              <Search size={18} className="mr-2" />
              Testar
            </Button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg border ${testResult.zone ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
              {testResult.zone ? (
                <div>
                  <p className="text-green-300">
                    Area encontrada: <strong>{testResult.zone.name}</strong>
                  </p>
                  <p className="text-green-200 text-sm mt-1">
                    Taxa: {formatCurrency(testResult.zone.delivery_fee)}
                    {testResult.match?.reason ? ` - ${testResult.match.reason}` : ''}
                  </p>
                </div>
              ) : (
                <p className="text-red-300">Nenhuma area encontrada para esse endereco.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-white text-center py-8">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones?.map((zone) => (
            <Card key={zone.id} className={!zone.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={18} className="text-white" />
                      <h3 className="text-lg font-semibold text-white">{zone.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={zone.is_active ? 'success' : 'danger'}>
                        {zone.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="default">Prioridade {zone.match_priority || 100}</Badge>
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Taxa de entrega</span>
                    <span className="text-white font-semibold">{formatCurrency(zone.delivery_fee)}</span>
                  </div>

                  {zone.city && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Cidade</span>
                      <span className="text-white font-semibold">{zone.city}</span>
                    </div>
                  )}

                  {zone.estimated_time && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-gray-400 text-sm">{zone.estimated_time}</span>
                    </div>
                  )}

                  {zone.minimum_order_amount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Valor minimo</span>
                      <span className="text-white font-semibold">{formatCurrency(zone.minimum_order_amount)}</span>
                    </div>
                  )}

                  {Array.isArray(zone.aliases) && zone.aliases.length > 0 && (
                    <p className="text-gray-400 text-xs">Aliases: {zone.aliases.join(', ')}</p>
                  )}

                  {zone.notes && (
                    <p className="text-gray-400 text-xs mt-2">{zone.notes}</p>
                  )}
                </div>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome principal da area"
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
            label="Slug"
            required
            value={formData.slug}
            onChange={(event) => setFormData(prev => ({ ...prev, slug: normalizeSlug(event.target.value) }))}
          />

          <Input
            label="Cidade"
            placeholder="Ex: Sao Goncalo, Itaborai"
            value={formData.city}
            onChange={(event) => setFormData(prev => ({ ...prev, city: event.target.value }))}
          />

          <Textarea
            label="Aliases / variacoes"
            placeholder={'Um por linha. Ex:\nApolo 2\nConjunto Apolo 2\nRegiao de Manilha'}
            value={formData.aliases}
            onChange={(event) => setFormData(prev => ({ ...prev, aliases: event.target.value }))}
            rows={4}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Taxa de entrega"
              type="number"
              step="0.01"
              required
              value={formData.delivery_fee}
              onChange={(event) => setFormData(prev => ({ ...prev, delivery_fee: event.target.value }))}
            />

            <Input
              label="Prioridade"
              type="number"
              value={formData.match_priority}
              onChange={(event) => setFormData(prev => ({ ...prev, match_priority: event.target.value }))}
            />
          </div>

          <Input
            label="Tempo estimado"
            placeholder="Ex: 30-40 min"
            value={formData.estimated_time}
            onChange={(event) => setFormData(prev => ({ ...prev, estimated_time: event.target.value }))}
          />

          <Input
            label="Valor minimo do pedido"
            type="number"
            step="0.01"
            value={formData.minimum_order_amount}
            onChange={(event) => setFormData(prev => ({ ...prev, minimum_order_amount: event.target.value }))}
          />

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(event) => setFormData(prev => ({ ...prev, is_active: event.target.checked }))}
              className="rounded"
            />
            <span className="text-white text-sm">Area ativa</span>
          </label>

          <Textarea
            label="Observacoes"
            value={formData.notes}
            onChange={(event) => setFormData(prev => ({ ...prev, notes: event.target.value }))}
            rows={2}
          />

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
