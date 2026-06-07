import { useState } from 'react'
import { useInventoryMovements, useMovementActions } from '../../hooks/useInventoryMovements'
import { useInventory } from '../../hooks/useInventory'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import MovementTable from '../../components/inventory/MovementTable'
import MovementForm from '../../components/inventory/MovementForm'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { INVENTORY_MOVEMENT_TYPES, INVENTORY_MOVEMENT_SOURCES } from '../../utils/inventory'
import { exportToCsv, exportToXlsx } from '../../utils/exportCsv'
import { Plus, Download } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const InventoryMovements = () => {
  const { profile } = useAuth()
  const [filters, setFilters] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  
  const [movementForm, setMovementForm] = useState({
    inventory_item_id: '',
    type: 'in',
    quantity: 0,
    final_quantity: 0,
    source: 'manual',
    reason: '',
  })

  const { movements, loading, refetch } = useInventoryMovements(filters)
  const { items: inventoryItems } = useInventory({ is_active: true })
  const { loading: movementLoading, applyEntry, applyExit, applyAdjustment } = useMovementActions()
  const itemOptions = [
    { value: '', label: 'Todos os itens' },
    ...(inventoryItems || []).map(item => ({ value: item.id, label: item.name })),
  ]

  const typeOptions = [
    { value: '', label: 'Todos' },
    { value: INVENTORY_MOVEMENT_TYPES.IN, label: 'Entrada' },
    { value: INVENTORY_MOVEMENT_TYPES.OUT, label: 'Saída' },
    { value: INVENTORY_MOVEMENT_TYPES.ADJUSTMENT, label: 'Ajuste' },
  ]

  const sourceOptions = [
    { value: '', label: 'Todas' },
    { value: INVENTORY_MOVEMENT_SOURCES.MANUAL, label: 'Manual' },
    { value: INVENTORY_MOVEMENT_SOURCES.ORDER, label: 'Pedido' },
    { value: INVENTORY_MOVEMENT_SOURCES.ADJUSTMENT, label: 'Ajuste' },
    { value: INVENTORY_MOVEMENT_SOURCES.RESTOCK, label: 'Reposição' },
    { value: INVENTORY_MOVEMENT_SOURCES.CANCELLATION, label: 'Cancelamento' },
  ]

  const movementRows = (movements || []).map(movement => ({
    data: new Date(movement.created_at).toLocaleString('pt-BR'),
    produto: movement.inventory_item?.name || '-',
    tipo: movement.type,
    quantidade_anterior: movement.quantity_before,
    quantidade_movimentada: movement.quantity,
    quantidade_final: movement.quantity_after,
    motivo: movement.reason || '',
    pedido_vinculado: movement.reference_id || '',
  }))

  const movementColumns = [
    { key: 'data', label: 'Data' },
    { key: 'produto', label: 'Produto' },
    { key: 'tipo', label: 'Tipo de movimentacao' },
    { key: 'quantidade_anterior', label: 'Quantidade anterior' },
    { key: 'quantidade_movimentada', label: 'Quantidade movimentada' },
    { key: 'quantidade_final', label: 'Quantidade final' },
    { key: 'motivo', label: 'Motivo' },
    { key: 'pedido_vinculado', label: 'Pedido vinculado' },
  ]

  const handleMovementSubmit = async (e) => {
    e.preventDefault()
    if (!profile) return

    const metadata = {
      reason: movementForm.reason,
      source: movementForm.source,
      user_id: profile.id,
    }

    let result
    if (movementForm.type === 'in') {
      result = await applyEntry(movementForm.inventory_item_id, movementForm.quantity, metadata)
    } else if (movementForm.type === 'out') {
      result = await applyExit(movementForm.inventory_item_id, movementForm.quantity, metadata)
    } else if (movementForm.type === 'adjustment') {
      result = await applyAdjustment(movementForm.inventory_item_id, movementForm.final_quantity, metadata)
    }

    if (result.success) {
      setModalOpen(false)
      resetMovementForm()
      refetch()
    }
  }

  const resetMovementForm = () => {
    setMovementForm({
      inventory_item_id: '',
      type: 'in',
      quantity: 0,
      final_quantity: 0,
      source: 'manual',
      reason: '',
    })
  }

  const openCreateModal = () => {
    resetMovementForm()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Movimentações de Estoque</h1>
        <Button onClick={openCreateModal}>
          <Plus size={20} className="mr-2" />
          Nova Movimentação
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            <Select
              label="Produto"
              options={itemOptions}
              value={filters.inventory_item_id || ''}
              onChange={(e) => setFilters({ ...filters, inventory_item_id: e.target.value })}
            />

            <Select
              label="Tipo"
              options={typeOptions}
              value={filters.type || ''}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            />

            <Select
              label="Origem"
              options={sourceOptions}
              value={filters.source || ''}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            />

            <Input
              label="Item de Estoque"
              placeholder="Buscar por item..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />

            <Input
              label="Inicio"
              type="date"
              value={filters.start_date ? filters.start_date.slice(0, 10) : ''}
              onChange={(e) => setFilters({
                ...filters,
                start_date: e.target.value ? `${e.target.value}T00:00:00` : '',
              })}
            />

            <Input
              label="Fim"
              type="date"
              value={filters.end_date ? filters.end_date.slice(0, 10) : ''}
              onChange={(e) => setFilters({
                ...filters,
                end_date: e.target.value ? `${e.target.value}T23:59:59.999` : '',
              })}
            />
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => exportToCsv(movementRows, 'movimentacoes_estoque', movementColumns)}
              disabled={!movementRows.length}
            >
              <Download size={18} className="mr-2" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportToXlsx(movementRows, 'movimentacoes_estoque', movementColumns, 'Movimentacoes')}
              disabled={!movementRows.length}
            >
              <Download size={18} className="mr-2" />
              Exportar XLSX
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Histórico de Movimentações</h2>
        </CardHeader>
        <CardContent>
          <MovementTable movements={movements} loading={loading} />
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Movimentação">
        <MovementForm
          movement={movementForm}
          onChange={setMovementForm}
          onSubmit={handleMovementSubmit}
          onCancel={() => setModalOpen(false)}
          loading={movementLoading}
          inventoryItems={inventoryItems}
        />
      </Modal>
    </div>
  )
}

export default InventoryMovements
