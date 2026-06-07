import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'

const InventoryForm = ({ item, onChange, onSubmit, onCancel, loading }) => {
  const categoryOptions = [
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'adicionais', label: 'Adicionais' },
    { value: 'acompanhamentos', label: 'Acompanhamentos' },
    { value: 'insumos', label: 'Insumos' },
    { value: 'outros', label: 'Outros' },
  ]

  const unitOptions = [
    { value: 'un', label: 'Unidade' },
    { value: 'lata', label: 'Lata' },
    { value: 'garrafa', label: 'Garrafa' },
    { value: 'kg', label: 'Quilograma' },
    { value: 'g', label: 'Grama' },
    { value: 'ml', label: 'Mililitro' },
    { value: 'l', label: 'Litro' },
    { value: 'cx', label: 'Caixa' },
    { value: 'pacote', label: 'Pacote' },
  ]

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Nome do item"
        required
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        placeholder="Coca-Cola Lata"
      />

      <Input
        label="SKU / Codigo interno"
        value={item.sku || ''}
        onChange={(e) => onChange({ ...item, sku: e.target.value })}
        placeholder="BEB-001"
      />

      <Input
        label="Slug (identificador único)"
        required
        value={item.slug}
        onChange={(e) => onChange({ ...item, slug: e.target.value })}
        placeholder="coca-cola-lata"
      />

      <Select
        label="Categoria"
        options={categoryOptions}
        value={item.category || ''}
        onChange={(e) => onChange({ ...item, category: e.target.value })}
      />

      <Select
        label="Unidade de medida"
        options={unitOptions}
        value={item.unit || ''}
        onChange={(e) => onChange({ ...item, unit: e.target.value })}
      />

      <Input
        label="Quantidade atual"
        type="number"
        step="0.01"
        required
        value={item.current_quantity || 0}
        onChange={(e) => onChange({ ...item, current_quantity: parseFloat(e.target.value) })}
      />

      <Input
        label="Estoque mínimo"
        type="number"
        step="0.01"
        value={item.minimum_quantity || 0}
        onChange={(e) => onChange({ ...item, minimum_quantity: parseFloat(e.target.value) })}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Custo unitario"
          type="number"
          step="0.01"
          value={item.cost_price || 0}
          onChange={(e) => onChange({ ...item, cost_price: parseFloat(e.target.value) })}
        />
        <Input
          label="Preco de venda opcional"
          type="number"
          step="0.01"
          value={item.sale_price || ''}
          onChange={(e) => onChange({ ...item, sale_price: e.target.value ? parseFloat(e.target.value) : null })}
        />
      </div>

      <Textarea
        label="Observações"
        value={item.notes}
        onChange={(e) => onChange({ ...item, notes: e.target.value })}
        rows={3}
      />

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={item.is_active !== undefined ? item.is_active : true}
          onChange={(e) => onChange({ ...item, is_active: e.target.checked })}
          className="rounded"
        />
        <span className="text-white text-sm">Item ativo</span>
      </label>

      <div className="flex gap-4 pt-4">
        <Button type="submit" className="flex-1" loading={loading}>
          {item.id ? 'Atualizar' : 'Criar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export default InventoryForm
