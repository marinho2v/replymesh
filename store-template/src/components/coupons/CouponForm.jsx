import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { DISCOUNT_TYPES, DISCOUNT_TYPE_LABELS } from '../../lib/constants'

const CouponForm = ({ coupon, onSubmit, onCancel, loading }) => {
  const discountTypeOptions = Object.values(DISCOUNT_TYPES).map(type => ({
    value: type,
    label: DISCOUNT_TYPE_LABELS[type],
  }))

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Código do cupom"
        required
        value={coupon.code}
        onChange={(e) => onSubmit({ ...coupon, code: e.target.value.toUpperCase() })}
        placeholder="BEMVINDO10"
      />

      <Input
        label="Título"
        value={coupon.title}
        onChange={(e) => onSubmit({ ...coupon, title: e.target.value })}
      />

      <Textarea
        label="Descrição"
        value={coupon.description}
        onChange={(e) => onSubmit({ ...coupon, description: e.target.value })}
        rows={2}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Tipo de desconto"
          options={discountTypeOptions}
          value={coupon.discount_type}
          onChange={(e) => onSubmit({ ...coupon, discount_type: e.target.value })}
        />

        <Input
          label="Valor do desconto"
          type="number"
          step="0.01"
          required
          value={coupon.discount_value}
          onChange={(e) => onSubmit({ ...coupon, discount_value: e.target.value })}
          placeholder={coupon.discount_type === DISCOUNT_TYPES.PERCENTAGE ? '10' : '5.00'}
        />
      </div>

      <Input
        label="Valor mínimo do pedido"
        type="number"
        step="0.01"
        value={coupon.minimum_order_amount}
        onChange={(e) => onSubmit({ ...coupon, minimum_order_amount: e.target.value })}
      />

      <Input
        label="Máximo de usos (opcional)"
        type="number"
        value={coupon.max_uses}
        onChange={(e) => onSubmit({ ...coupon, max_uses: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Data de início (opcional)"
          type="date"
          value={coupon.starts_at}
          onChange={(e) => onSubmit({ ...coupon, starts_at: e.target.value })}
        />

        <Input
          label="Data de expiração (opcional)"
          type="date"
          value={coupon.expires_at}
          onChange={(e) => onSubmit({ ...coupon, expires_at: e.target.value })}
        />
      </div>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={coupon.is_single_use_per_customer}
          onChange={(e) => onSubmit({ ...coupon, is_single_use_per_customer: e.target.checked })}
          className="rounded"
        />
        <span className="text-white text-sm">Uso único por cliente</span>
      </label>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={coupon.applies_to_all}
          onChange={(e) => onSubmit({ ...coupon, applies_to_all: e.target.checked })}
          className="rounded"
        />
        <span className="text-white text-sm">Aplicar a todos os produtos</span>
      </label>

      <div className="flex gap-4 pt-4">
        <Button type="submit" className="flex-1" loading={loading}>
          {coupon.id ? 'Atualizar' : 'Criar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export default CouponForm
