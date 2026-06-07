import { useState } from 'react'
import { useInventory, useInventoryActions, useInventoryStats, useLowStockItems, useInventoryCategories } from '../../hooks/useInventory'
import { useInventoryMovements, useMovementActions } from '../../hooks/useInventoryMovements'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import InventoryStatsCards from '../../components/inventory/InventoryStatsCards'
import InventoryFilters from '../../components/inventory/InventoryFilters'
import InventoryTable from '../../components/inventory/InventoryTable'
import InventoryForm from '../../components/inventory/InventoryForm'
import MovementForm from '../../components/inventory/MovementForm'
import MovementTable from '../../components/inventory/MovementTable'
import LowStockList from '../../components/inventory/LowStockList'
import { Plus, AlertTriangle, Package, RefreshCw } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const Inventory = () => {
  const { profile } = useAuth()
  const [filters, setFilters] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    slug: '',
    category: '',
    unit: 'un',
    current_quantity: 0,
    minimum_quantity: 0,
    cost_price: 0,
    sale_price: '',
    is_active: true,
    notes: '',
  })

  const [movementForm, setMovementForm] = useState({
    inventory_item_id: '',
    type: 'in',
    quantity: 0,
    final_quantity: 0,
    unit_cost: '',
    total_cost: '',
    supplier_name: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    source: 'manual',
    reason: '',
  })

  const { items, loading, refetch } = useInventory(filters)
  const { loading: actionsLoading, createItem, updateItem, deleteItem } = useInventoryActions()
  const { stats, loading: statsLoading, refetch: refetchStats } = useInventoryStats()
  const { items: lowStockItems, loading: lowStockLoading, refetch: refetchLowStock } = useLowStockItems()
  const { categories } = useInventoryCategories()
  const { movements, refetch: refetchMovements } = useInventoryMovements({ limit: 10 })
  const { loading: movementLoading, applyEntry, applyExit, applyAdjustment } = useMovementActions()

  const handleCreateItem = async (e) => {
    e.preventDefault()
    const result = await createItem(itemForm)
    if (result.success) {
      setModalOpen(false)
      resetItemForm()
      refetch()
      refetchStats()
    }
  }

  const handleUpdateItem = async (e) => {
    e.preventDefault()
    const result = await updateItem(editingItem.id, itemForm)
    if (result.success) {
      setModalOpen(false)
      resetItemForm()
      setEditingItem(null)
      refetch()
    }
  }

  const handleMovementSubmit = async (e) => {
    e.preventDefault()
    if (!profile) return

    const metadata = {
      reason: movementForm.reason,
      source: movementForm.source,
      user_id: profile.id,
      unit_cost: movementForm.unit_cost,
      total_cost: movementForm.total_cost,
      supplier_name: movementForm.supplier_name,
      purchase_date: movementForm.purchase_date,
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
      setMovementModalOpen(false)
      resetMovementForm()
      setSelectedItem(null)
      refetch()
      refetchStats()
      refetchLowStock()
      refetchMovements()
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      sku: item.sku || '',
      slug: item.slug,
      category: item.category || '',
      unit: item.unit,
      current_quantity: item.current_quantity,
      minimum_quantity: item.minimum_quantity,
      cost_price: item.cost_price || 0,
      sale_price: item.sale_price || '',
      is_active: item.is_active,
      notes: item.notes || '',
    })
    setModalOpen(true)
  }

  const handleEntry = (item) => {
    setSelectedItem(item)
    setMovementForm({
      inventory_item_id: item.id,
      type: 'in',
      quantity: 1,
      final_quantity: 0,
      unit_cost: item.cost_price || '',
      total_cost: item.cost_price || '',
      supplier_name: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      source: 'manual',
      reason: '',
    })
    setMovementModalOpen(true)
  }

  const handleExit = (item) => {
    setSelectedItem(item)
    setMovementForm({
      inventory_item_id: item.id,
      type: 'out',
      quantity: 1,
      final_quantity: 0,
      unit_cost: '',
      total_cost: '',
      supplier_name: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      source: 'manual',
      reason: '',
    })
    setMovementModalOpen(true)
  }

  const handleAdjust = (item) => {
    setSelectedItem(item)
    setMovementForm({
      inventory_item_id: item.id,
      type: 'adjustment',
      quantity: 0,
      final_quantity: item.current_quantity,
      unit_cost: '',
      total_cost: '',
      supplier_name: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      source: 'adjustment',
      reason: '',
    })
    setMovementModalOpen(true)
  }

  const handleMovements = (item) => {
    setSelectedItem(item)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este item de estoque?')) return
    const result = await deleteItem(id)
    if (result.success) {
      refetch()
      refetchStats()
    }
  }

  const resetItemForm = () => {
    setItemForm({
      name: '',
      sku: '',
      slug: '',
      category: '',
      unit: 'un',
      current_quantity: 0,
      minimum_quantity: 0,
      cost_price: 0,
      sale_price: '',
      is_active: true,
      notes: '',
    })
  }

  const resetMovementForm = () => {
    setMovementForm({
      inventory_item_id: '',
      type: 'in',
      quantity: 0,
      final_quantity: 0,
      unit_cost: '',
      total_cost: '',
      supplier_name: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      source: 'manual',
      reason: '',
    })
  }

  const openCreateModal = () => {
    setEditingItem(null)
    resetItemForm()
    setModalOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Estoque</h1>
          <p className="mt-0.5 text-sm text-gray-400">Controle de insumos, entradas, saídas e ajustes.</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={18} className="mr-2" />
          Novo item
        </Button>
      </div>

      <InventoryStatsCards stats={stats} loading={statsLoading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <InventoryFilters
            filters={filters}
            onChange={setFilters}
            categories={categories}
          />
          <Card>
            <CardHeader className="flex items-center justify-between p-4">
              <h2 className="font-bold text-white">Itens de estoque</h2>
              {!loading && (
                <span className="text-xs text-gray-500">{items?.length || 0} ite{items?.length !== 1 ? 'ns' : 'm'}</span>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Carregando...
                </div>
              ) : items?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package size={36} className="mb-2 text-gray-600" />
                  <p className="text-sm font-medium text-gray-400">Nenhum item de estoque cadastrado</p>
                  <p className="mt-1 text-xs text-gray-500">Clique em "Novo item" para começar.</p>
                </div>
              ) : (
                <InventoryTable
                  items={items}
                  loading={loading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onEntry={handleEntry}
                  onExit={handleExit}
                  onAdjust={handleAdjust}
                  onMovements={handleMovements}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-500" />
                <h2 className="font-bold text-white">Estoque baixo</h2>
              </div>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <LowStockList items={lowStockItems} loading={lowStockLoading} />
            </CardContent>
          </Card>

          {selectedItem && (
            <Card>
              <CardHeader className="p-4">
                <div>
                  <h2 className="font-bold text-white">Últimas movimentações</h2>
                  <p className="mt-0.5 text-xs text-gray-400 truncate">{selectedItem.name}</p>
                </div>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <MovementTable movements={movements} loading={movementLoading} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Editar item' : 'Novo item de estoque'}>
        <InventoryForm
          item={itemForm}
          onChange={setItemForm}
          onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
          onCancel={() => setModalOpen(false)}
          loading={actionsLoading}
        />
      </Modal>

      <Modal isOpen={movementModalOpen} onClose={() => setMovementModalOpen(false)} title="Movimentar estoque">
        <MovementForm
          movement={movementForm}
          onChange={setMovementForm}
          onSubmit={handleMovementSubmit}
          onCancel={() => setMovementModalOpen(false)}
          loading={movementLoading}
          inventoryItems={items}
        />
      </Modal>
    </div>
  )
}

export default Inventory
