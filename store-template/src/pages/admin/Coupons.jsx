import { useMemo, useState } from 'react'
import { useCoupons } from '../../hooks/useCoupons'
import { useCategories } from '../../hooks/useCategories'
import { createCoupon, updateCoupon, deleteCoupon } from '../../services/coupons'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Plus, Edit, Trash2, Tag, Percent, DollarSign, Truck, Gift, Store } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'
import { DISCOUNT_TYPES, DISCOUNT_TYPE_LABELS } from '../../lib/constants'
import { toast } from 'sonner'

const Coupons = () => {
  const { coupons, loading, refetch } = useCoupons(false)
  const { categories } = useCategories(false)
  const [activeTab, setActiveTab] = useState('manual')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discount_type: DISCOUNT_TYPES.PERCENTAGE,
    discount_value: '',
    minimum_order_amount: '',
    max_uses: '',
    starts_at: '',
    expires_at: '',
    is_single_use_per_customer: false,
    applies_to_all: true,
    category_id: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const data = {
        ...formData,
        discount_value: formData.discount_type === DISCOUNT_TYPES.FREE_SHIPPING
          ? 0
          : parseFloat(formData.discount_value),
        minimum_order_amount: parseFloat(formData.minimum_order_amount) || 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        starts_at: formData.starts_at || null,
        expires_at: formData.expires_at || null,
        category_id: !formData.applies_to_all && formData.category_id ? formData.category_id : null,
      }

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, data)
        toast.success('Cupom atualizado com sucesso!')
      } else {
        await createCoupon(data)
        toast.success('Cupom criado com sucesso!')
      }

      setModalOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      console.error('Error saving coupon:', error)
      toast.error('Erro ao salvar cupom')
    }
  }

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      title: coupon.title || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_order_amount: coupon.minimum_order_amount,
      max_uses: coupon.max_uses || '',
      starts_at: coupon.starts_at ? coupon.starts_at.split('T')[0] : '',
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
      is_single_use_per_customer: coupon.is_single_use_per_customer,
      applies_to_all: coupon.applies_to_all,
      category_id: coupon.category_id || '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (couponId) => {
    if (!confirm('Tem certeza que deseja desativar este cupom?')) return

    try {
      await deleteCoupon(couponId)
      toast.success('Cupom desativado com sucesso!')
      refetch()
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast.error('Erro ao desativar cupom')
    }
  }

  const resetForm = () => {
    setEditingCoupon(null)
    setFormData({
      code: '',
      title: '',
      description: '',
      discount_type: DISCOUNT_TYPES.PERCENTAGE,
      discount_value: '',
      minimum_order_amount: '',
      max_uses: '',
      starts_at: '',
      expires_at: '',
      is_single_use_per_customer: false,
      applies_to_all: true,
      category_id: '',
    })
  }

  const discountTypeOptions = Object.values(DISCOUNT_TYPES).map(type => ({
    value: type,
    label: DISCOUNT_TYPE_LABELS[type],
  }))

  const categoryOptions = categories?.map(cat => ({
    value: cat.id,
    label: cat.name,
  })) || []
  const visibleCoupons = useMemo(
    () => (coupons || []).filter((coupon) => (coupon.source || 'manual') === activeTab),
    [coupons, activeTab]
  )

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Cupons de Desconto</h1>
          <p className="mt-1 text-sm text-gray-400">Cupons criados pela loja e premios pessoais da roleta.</p>
        </div>
        {activeTab === 'manual' && (
          <Button onClick={() => { resetForm(); setModalOpen(true) }}>
            <Plus size={20} className="mr-2" />
            Novo Cupom
          </Button>
        )}
      </div>

      <div className="mb-6 flex gap-2 rounded-lg border border-dark-700 bg-dark-900 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'manual' ? 'bg-yellow-400 text-black' : 'text-gray-300 hover:bg-dark-800'
          }`}
        >
          <Store size={18} />
          Cupons da loja
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('wheel')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'wheel' ? 'bg-yellow-400 text-black' : 'text-gray-300 hover:bg-dark-800'
          }`}
        >
          <Gift size={18} />
          Cupons da roleta
        </button>
      </div>

      {activeTab === 'wheel' && (
        <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          Cada cupom da roleta pertence somente ao cliente que ganhou, permite um único uso e expira em 7 dias.
        </div>
      )}

      {loading ? (
        <div className="text-white text-center py-8">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCoupons.map((coupon) => (
            <Card key={coupon.id} className={!coupon.is_active ? 'opacity-50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag size={18} className="text-white" />
                      <h3 className="text-lg font-semibold text-white uppercase">{coupon.code}</h3>
                    </div>
                    {coupon.title && (
                      <p className="text-gray-300 text-sm mb-2">{coupon.title}</p>
                    )}
                  </div>
                  {activeTab === 'manual' && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(coupon)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(coupon.id)}>
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>

                {coupon.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{coupon.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {coupon.discount_type === DISCOUNT_TYPES.PERCENTAGE ? (
                      <Percent size={16} className="text-gray-400" />
                    ) : coupon.discount_type === DISCOUNT_TYPES.FREE_SHIPPING ? (
                      <Truck size={16} className="text-gray-400" />
                    ) : (
                      <DollarSign size={16} className="text-gray-400" />
                    )}
                    <span className="text-white font-semibold">
                      {coupon.discount_type === DISCOUNT_TYPES.PERCENTAGE
                        ? `${coupon.discount_value}%`
                        : coupon.discount_type === DISCOUNT_TYPES.FREE_SHIPPING
                          ? 'Frete gratis'
                        : formatCurrency(coupon.discount_value)}
                    </span>
                  </div>

                  {coupon.minimum_order_amount > 0 && (
                    <p className="text-gray-400 text-xs">
                      Mínimo: {formatCurrency(coupon.minimum_order_amount)}
                    </p>
                  )}

                  {coupon.max_uses && (
                    <p className="text-gray-400 text-xs">
                      Usos: {coupon.used_count}/{coupon.max_uses}
                    </p>
                  )}

                  {activeTab === 'wheel' && (
                    <div className="rounded-md border border-dark-700 bg-dark-950 p-3 text-xs text-gray-300">
                      <p><span className="text-gray-500">Cliente:</span> {coupon.customer_name || 'Cliente nao identificado'}</p>
                      <p className="mt-1"><span className="text-gray-500">Telefone:</span> {coupon.customer_phone || '-'}</p>
                      <p className="mt-1"><span className="text-gray-500">Regra:</span> uso unico e pessoal</p>
                    </div>
                  )}

                  {coupon.expires_at && (
                    <p className="text-gray-400 text-xs">
                      Expira: {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}

                  {!coupon.is_active && (
                    <Badge variant="danger" className="mt-2">Inativo</Badge>
                  )}
                  {coupon.exhausted && (
                    <Badge variant="danger" className="mt-2">Utilizado</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {visibleCoupons.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-dark-600 py-12 text-center text-gray-400">
              {activeTab === 'wheel'
                ? 'Nenhum cupom foi gerado pela roleta ainda.'
                : 'Nenhum cupom da loja cadastrado.'}
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Código do cupom"
            required
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="BEMVINDO10"
          />

          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          />

          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de desconto"
              options={discountTypeOptions}
              value={formData.discount_type}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                discount_type: e.target.value,
                discount_value: e.target.value === DISCOUNT_TYPES.FREE_SHIPPING ? '0' : prev.discount_value,
              }))}
            />

            <Input
              label="Valor do desconto"
              type="number"
              step="0.01"
              required={formData.discount_type !== DISCOUNT_TYPES.FREE_SHIPPING}
              disabled={formData.discount_type === DISCOUNT_TYPES.FREE_SHIPPING}
              value={formData.discount_value}
              onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
              placeholder={formData.discount_type === DISCOUNT_TYPES.FREE_SHIPPING
                ? 'Frete zerado automaticamente'
                : formData.discount_type === DISCOUNT_TYPES.PERCENTAGE ? '10' : '5.00'}
            />
          </div>

          <Input
            label="Valor mínimo do pedido"
            type="number"
            step="0.01"
            value={formData.minimum_order_amount}
            onChange={(e) => setFormData(prev => ({ ...prev, minimum_order_amount: e.target.value }))}
          />

          <Input
            label="Máximo de usos (opcional)"
            type="number"
            value={formData.max_uses}
            onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data de início (opcional)"
              type="date"
              value={formData.starts_at}
              onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
            />

            <Input
              label="Data de expiração (opcional)"
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
            />
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_single_use_per_customer}
              onChange={(e) => setFormData(prev => ({ ...prev, is_single_use_per_customer: e.target.checked }))}
              className="rounded"
            />
            <span className="text-white text-sm">Uso único por cliente</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.applies_to_all}
              onChange={(e) => setFormData(prev => ({ ...prev, applies_to_all: e.target.checked }))}
              className="rounded"
            />
            <span className="text-white text-sm">Aplicar a todos os produtos</span>
          </label>

          {!formData.applies_to_all && (
            <Select
              label="Categoria específica"
              options={categoryOptions}
              value={formData.category_id}
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
            />
          )}

          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {editingCoupon ? 'Atualizar' : 'Criar'}
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

export default Coupons
