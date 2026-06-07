import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { INVENTORY_MOVEMENT_TYPES, INVENTORY_MOVEMENT_SOURCES } from '../../utils/inventory'

const MovementForm = ({ movement, onChange, onSubmit, onCancel, loading, inventoryItems }) => {
  const typeOptions = [
    { value: INVENTORY_MOVEMENT_TYPES.IN, label: 'Entrada' },
    { value: INVENTORY_MOVEMENT_TYPES.OUT, label: 'Saída' },
    { value: INVENTORY_MOVEMENT_TYPES.ADJUSTMENT, label: 'Ajuste' },
  ]

  const sourceOptions = [
    { value: INVENTORY_MOVEMENT_SOURCES.MANUAL, label: 'Manual' },
    { value: INVENTORY_MOVEMENT_SOURCES.RESTOCK, label: 'Reposição' },
    { value: INVENTORY_MOVEMENT_SOURCES.ADJUSTMENT, label: 'Ajuste' },
  ]

  const itemOptions = inventoryItems?.map(item => ({
    value: item.id,
    label: `${item.name} (${item.current_quantity} ${item.unit})`,
  })) || []

  const quantity = Number(movement.quantity || 0)
  const unitCost = Number(movement.unit_cost || 0)
  const totalCost = Number(movement.total_cost || 0)
  const calculatedUnitCost = quantity > 0 && totalCost > 0 ? totalCost / quantity : unitCost

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Select
        label="Item de estoque"
        options={itemOptions}
        value={movement.inventory_item_id || ''}
        onChange={(e) => onChange({ ...movement, inventory_item_id: e.target.value })}
        required
      />

      <Select
        label="Tipo de movimentação"
        options={typeOptions}
        value={movement.type || ''}
        onChange={(e) => onChange({ ...movement, type: e.target.value })}
        required
      />

      {movement.type === INVENTORY_MOVEMENT_TYPES.ADJUSTMENT ? (
        <Input
          label="Quantidade final"
          type="number"
          step="0.01"
          required
          value={movement.final_quantity || ''}
          onChange={(e) => onChange({ ...movement, final_quantity: parseFloat(e.target.value) })}
          placeholder="Informe a quantidade real do estoque"
        />
      ) : (
        <Input
          label="Quantidade"
          type="number"
          step="0.01"
          required
          value={movement.quantity || ''}
          onChange={(e) => onChange({ ...movement, quantity: parseFloat(e.target.value) })}
        />
      )}

      {movement.type === INVENTORY_MOVEMENT_TYPES.IN && (
        <div className="rounded-lg border border-dark-600 bg-dark-900/60 p-4 space-y-3">
          <div>
            <h3 className="text-white font-semibold">Custo da compra</h3>
            <p className="text-xs text-gray-400">
              Informe quanto essa entrada custou. O sistema usa isso para atualizar o custo medio do item.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Custo total da compra"
              type="number"
              step="0.01"
              min="0"
              value={movement.total_cost || ''}
              onChange={(e) => {
                const nextTotal = e.target.value
                onChange({
                  ...movement,
                  total_cost: nextTotal,
                  unit_cost: quantity > 0 && nextTotal ? (Number(nextTotal) / quantity).toFixed(2) : movement.unit_cost,
                })
              }}
            />
            <Input
              label="Custo unitario"
              type="number"
              step="0.01"
              min="0"
              value={movement.unit_cost || ''}
              onChange={(e) => {
                const nextUnit = e.target.value
                onChange({
                  ...movement,
                  unit_cost: nextUnit,
                  total_cost: quantity > 0 && nextUnit ? (Number(nextUnit) * quantity).toFixed(2) : movement.total_cost,
                })
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Fornecedor"
              value={movement.supplier_name || ''}
              onChange={(e) => onChange({ ...movement, supplier_name: e.target.value })}
              placeholder="Ex.: Atacadao, distribuidor..."
            />
            <Input
              label="Data da compra"
              type="date"
              value={movement.purchase_date || ''}
              onChange={(e) => onChange({ ...movement, purchase_date: e.target.value })}
            />
          </div>
          <div className="rounded-lg bg-dark-800 p-3 text-sm">
            <span className="text-gray-400">Custo unitario usado: </span>
            <span className="font-semibold text-white">
              R$ {Number(calculatedUnitCost || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <Select
        label="Origem"
        options={sourceOptions}
        value={movement.source || INVENTORY_MOVEMENT_SOURCES.MANUAL}
        onChange={(e) => onChange({ ...movement, source: e.target.value })}
      />

      <Textarea
        label="Motivo"
        value={movement.reason}
        onChange={(e) => onChange({ ...movement, reason: e.target.value })}
        rows={3}
        placeholder="Descreva o motivo da movimentação..."
      />

      <div className="flex gap-4 pt-4">
        <Button type="submit" className="flex-1" loading={loading}>
          Registrar Movimentação
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export default MovementForm
