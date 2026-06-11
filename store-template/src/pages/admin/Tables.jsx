import { useEffect, useMemo, useState } from 'react'
import { Armchair, CircleDollarSign, Copy, Download, ExternalLink, Plus, Printer, QrCode, RefreshCw, Send, SquarePen, User, Utensils } from 'lucide-react'
import { useDiningTables, useTableActions } from '../../hooks/useTables'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useAuth } from '../../hooks/useAuth'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { getUsers } from '../../services/auth'
import { getOrders, updateOrderStatus } from '../../services/orders'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { formatCurrency } from '../../utils/currency'

const emptyTable = {
  name: '',
  slug: '',
  seats: 4,
  sort_order: 0,
  is_active: true,
  notes: '',
}

const statusMeta = {
  available: { label: 'Livre', variant: 'success', className: 'border-green-600' },
  occupied: { label: 'Ocupada', variant: 'warning', className: 'border-yellow-500' },
  preparing: { label: 'Em preparo', variant: 'info', className: 'border-blue-500' },
  waiting_payment: { label: 'Aguardando pagamento', variant: 'danger', className: 'border-red-500' },
  closed: { label: 'Fechada', variant: 'default', className: 'border-dark-600' },
  disabled: { label: 'Inativa', variant: 'default', className: 'border-dark-600 opacity-60' },
}

const getRoleLabel = (role) => {
  if (role === 'admin') return 'Admin'
  if (role === 'waiter') return 'Garcom'
  if (role === 'attendant') return 'Atendente'
  return 'Responsavel'
}

const Tables = () => {
  const { tables, loading, refetch } = useDiningTables()
  const tableActions = useTableActions()
  const { products } = useProducts({ activeOnly: true })
  const { categories } = useCategories(true)
  const { profile } = useAuth()
  const isWaiter = profile?.role === 'waiter'
  const basePath = useCompanyBasePath()
  const [tableModalOpen, setTableModalOpen] = useState(false)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [tableForm, setTableForm] = useState(emptyTable)
  const [session, setSession] = useState(null)
  const [items, setItems] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [productSearch, setProductSearch] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('money')
  const [discountAmount, setDiscountAmount] = useState('')
  const [serviceFee, setServiceFee] = useState('')
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferUsers, setTransferUsers] = useState([])
  const [transferUserId, setTransferUserId] = useState('')
  const [qrModalTable, setQrModalTable] = useState(null)
  const [readyTableOrders, setReadyTableOrders] = useState([])

  const activeProducts = useMemo(() => products || [], [products])
  const visibleCategories = useMemo(() => categories || [], [categories])
  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase()

    return activeProducts.filter((product) => {
      const matchesCategory = selectedCategoryId === 'all' || product.category_id === selectedCategoryId
      const matchesSearch = !search || product.name?.toLowerCase().includes(search)

      return matchesCategory && matchesSearch
    })
  }, [activeProducts, productSearch, selectedCategoryId])

  const subtotal = items.reduce((sum, item) => sum + Number(item.total_price || 0), 0)
  const total = Math.max(0, subtotal + Number(serviceFee || 0) - Number(discountAmount || 0))
  const qrLink = qrModalTable?.qr_token ? `${window.location.origin}${basePath}/mesa/${qrModalTable.qr_token}` : ''
  const qrImageUrl = qrLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=20&data=${encodeURIComponent(qrLink)}`
    : ''

  const loadReadyTableOrders = async () => {
    try {
      const orders = await getOrders({ orderType: 'dine_in', status: 'ready', limit: 30 })
      setReadyTableOrders(orders)
    } catch (error) {
      console.error('Error loading ready table orders:', error)
    }
  }

  useEffect(() => {
    loadReadyTableOrders()
  }, [])

  const resetTableForm = () => {
    setEditingTable(null)
    setTableForm(emptyTable)
  }

  const openTableForm = (table = null) => {
    if (table) {
      setEditingTable(table)
      setTableForm({
        name: table.name || '',
        slug: table.slug || '',
        seats: table.seats || 4,
        sort_order: table.sort_order || 0,
        is_active: table.is_active !== false,
        notes: table.notes || '',
        status: table.status || 'available',
      })
    } else {
      resetTableForm()
    }
    setTableModalOpen(true)
  }

  const handleSaveTable = async (event) => {
    event.preventDefault()
    const result = editingTable
      ? await tableActions.updateTable(editingTable.id, tableForm)
      : await tableActions.createTable(tableForm)

    if (result.success) {
      setTableModalOpen(false)
      resetTableForm()
      refetch()
    }
  }

  const openSession = async (table) => {
    if (!table.is_active) return

    const openResult = await tableActions.openSession(table.id)
    if (!openResult.success) return

    const loadResult = await tableActions.loadSession(openResult.data.id)
    if (!loadResult.success) return

    const loadedSession = loadResult.data
    setSession(loadedSession)
    setItems((loadedSession.orders?.order_items || []).map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      unit_price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 1),
      total_price: Number(item.total_price || 0),
      notes: item.notes || '',
    })))
    setSessionNotes(loadedSession.notes || loadedSession.orders?.notes || '')
    setDiscountAmount(loadedSession.discount_amount || '')
    setServiceFee(loadedSession.service_fee_amount ?? loadedSession.service_fee ?? '')
    setPaymentMethod(loadedSession.payment_method || loadedSession.orders?.payment_method || 'money')
    setSessionModalOpen(true)
    refetch()
  }

  const openTransferModal = async () => {
    try {
      const users = await getUsers()
      const availableUsers = (users || []).filter(user =>
        user.is_active !== false &&
        ['admin', 'attendant', 'waiter'].includes(user.role) &&
        user.id !== session?.attendant_id
      )

      setTransferUsers(availableUsers)
      setTransferUserId(availableUsers[0]?.id || '')
      setTransferModalOpen(true)
    } catch (error) {
      console.error('Error loading transfer users:', error)
    }
  }

  const handleTransferSession = async () => {
    if (!session?.id || !transferUserId) return

    const result = await tableActions.transferSession(session.id, transferUserId)
    if (!result.success) return

    const loadResult = await tableActions.loadSession(session.id)
    if (loadResult.success) {
      setSession(loadResult.data)
    }

    setTransferModalOpen(false)
    refetch()
  }

  const copyQrLink = async () => {
    if (!qrLink) return
    await navigator.clipboard.writeText(qrLink)
  }

  const toggleQrCode = async () => {
    if (!qrModalTable) return
    const result = await tableActions.setQrEnabled(qrModalTable.id, !qrModalTable.qr_enabled)
    if (!result.success) return
    setQrModalTable(result.data)
    refetch()
  }

  const regenerateQrCode = async () => {
    if (!qrModalTable) return
    if (!window.confirm('Regenerar o QR Code invalida o link impresso anteriormente. Continuar?')) return
    const result = await tableActions.regenerateQr(qrModalTable.id)
    if (!result.success) return
    setQrModalTable(result.data)
    refetch()
  }

  const downloadQrCode = async () => {
    if (!qrImageUrl) return
    const response = await fetch(qrImageUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qr-${qrModalTable.name || 'mesa'}.png`
    link.click()
    URL.revokeObjectURL(url)
  }

  const printQrCode = () => {
    if (!qrImageUrl || !qrModalTable) return
    const html = `
      <div style="font-family:Arial,sans-serif;text-align:center;padding:24px;color:#111;">
        <h1 style="margin:0 0 8px;font-size:28px;">${qrModalTable.name}</h1>
        <p style="margin:0 0 18px;font-size:16px;">Aponte a camera e faca seu pedido</p>
        <img src="${qrImageUrl}" style="width:320px;height:320px;" />
        <p style="font-size:12px;word-break:break-all;margin-top:16px;">${qrLink}</p>
      </div>
    `
    const win = window.open('', '_blank')
    win.document.write(`<html><body style="margin:0;">${html}</body></html>`)
    win.document.close()
    win.print()
  }

  const addProduct = () => {
    const product = activeProducts.find(item => item.id === selectedProductId)
    if (!product) return

    const price = Number(product.promotional_price || product.price || 0)
    setItems(prev => {
      const existing = prev.find(item => item.product_id === product.id && !item.notes)
      if (existing) {
        return prev.map(item => item === existing
          ? { ...item, quantity: item.quantity + 1, total_price: price * (item.quantity + 1) }
          : item
        )
      }

      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        unit_price: price,
        quantity: 1,
        total_price: price,
        notes: '',
      }]
    })
    setSelectedProductId('')
  }

  const updateItem = (index, changes) => {
    setItems(prev => prev.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const next = { ...item, ...changes }
      const quantity = Math.max(1, Number(next.quantity || 1))
      return { ...next, quantity, total_price: Number(next.unit_price || 0) * quantity }
    }))
  }

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const saveComanda = async () => {
    const result = await tableActions.saveItems(session, items, sessionNotes)
    if (result.success) {
      const loadResult = await tableActions.loadSession(result.data.id)
      if (loadResult.success) setSession(loadResult.data)
      refetch()
    }
  }

  const sendKitchen = async () => {
    let currentSession = session
    if (!currentSession?.order_id || items.length > 0) {
      const saveResult = await tableActions.saveItems(session, items, sessionNotes)
      if (!saveResult.success) return
      currentSession = { ...session, ...saveResult.data }
      setSession(currentSession)
    }

    const result = await tableActions.sendKitchen(currentSession)
    if (result.success) {
      const loadResult = await tableActions.loadSession(currentSession.id)
      if (loadResult.success) setSession(loadResult.data)
      loadReadyTableOrders()
      refetch()
    }
  }

  const markServed = async (order) => {
    try {
      await updateOrderStatus(order.id, 'completed')
      await loadReadyTableOrders()
      refetch()
    } catch (error) {
      console.error('Error marking table order served:', error)
    }
  }

  const requestClosure = async () => {
    const result = await tableActions.requestClosure(session.id)
    if (result.success) {
      setSession(prev => ({ ...prev, ...result.data }))
      refetch()
    }
  }

  const closeSession = async () => {
    const loaded = await tableActions.loadSession(session.id)
    if (!loaded.success) return

    const result = await tableActions.closeSession(
      loaded.data,
      paymentMethod,
      Number(discountAmount || 0),
      Number(serviceFee || 0),
      sessionNotes
    )

    if (result.success) {
      setSessionModalOpen(false)
      setSession(null)
      setItems([])
      refetch()
    }
  }

  const paymentLabels = { money: 'Dinheiro', pix: 'Pix', card_on_delivery: 'Cartão' }

  const printAccount = () => {
    if (!session) return
    const tableName = session.dining_tables?.name || 'Mesa'
    const attendantName = session.profiles?.full_name || '-'
    const orderNumber = session.orders?.order_number ? `#${session.orders.order_number}` : '-'
    const paymentLabel = paymentLabels[paymentMethod] || paymentMethod

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 80mm; margin: 0 auto; font-size: 12px;">
        <h2 style="text-align:center; margin-bottom:2px;">${tableName}</h2>
        <p style="text-align:center; margin:0; color:#555;">${session.company_name || ''}</p>
        <hr style="margin:8px 0;" />
        <p style="margin:2px 0;"><strong>Comanda:</strong> ${orderNumber}</p>
        <p style="margin:2px 0;"><strong>Atendente:</strong> ${attendantName}</p>
        <p style="margin:2px 0;"><strong>Pagamento:</strong> ${paymentLabel}</p>
        <hr style="margin:8px 0;" />
        ${(items || []).map(item => `
          <div style="display:flex; justify-content:space-between; margin:3px 0;">
            <span>${item.quantity}x ${item.product_name}</span>
            <span>R$ ${Number(item.total_price || 0).toFixed(2)}</span>
          </div>
          ${item.notes ? `<p style="margin:0 0 4px 12px; font-size:10px; color:#666;">Obs: ${item.notes}</p>` : ''}
        `).join('')}
        <hr style="margin:8px 0;" />
        <div style="display:flex; justify-content:space-between;"><span>Subtotal</span><span>R$ ${subtotal.toFixed(2)}</span></div>
        ${Number(serviceFee || 0) > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Taxa de serviço</span><span>R$ ${Number(serviceFee).toFixed(2)}</span></div>` : ''}
        ${Number(discountAmount || 0) > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Desconto</span><span>-R$ ${Number(discountAmount).toFixed(2)}</span></div>` : ''}
        <div style="display:flex; justify-content:space-between; font-size:15px; font-weight:bold; margin-top:6px;">
          <span>TOTAL</span><span>R$ ${total.toFixed(2)}</span>
        </div>
        ${sessionNotes ? `<hr style="margin:8px 0;"/><p style="font-size:10px;">Obs: ${sessionNotes}</p>` : ''}
        <hr style="margin:8px 0;" />
        <p style="text-align:center; font-size:10px; color:#888;">${new Date().toLocaleString('pt-BR')}</p>
      </div>
    `
    const win = window.open('', '_blank')
    win.document.write(`<html><body style="margin:0;padding:10px;">${html}</body></html>`)
    win.document.close()
    win.print()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mesas e Comandas</h1>
          <p className="mt-0.5 text-sm text-gray-400">Atendimento local · {tables.length} mesa{tables.length !== 1 ? 's' : ''} cadastrada{tables.length !== 1 ? 's' : ''}</p>
        </div>
        {!isWaiter && (
          <Button onClick={() => openTableForm()} className="w-full sm:w-auto">
            <Plus size={18} className="mr-2" />
            Nova mesa
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Armchair size={18} className="mr-2 animate-pulse" />
          Carregando mesas...
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-dark-600 py-16 text-center">
          <Armchair size={40} className="mb-3 text-gray-600" />
          <p className="text-sm font-medium text-gray-400">Nenhuma mesa cadastrada</p>
          <p className="mt-1 text-xs text-gray-500">Clique em "Nova mesa" para configurar o salão.</p>
          {!isWaiter && (
            <Button className="mt-4" onClick={() => openTableForm()}>
              <Plus size={16} className="mr-2" />
              Criar primeira mesa
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
          {tables.map(table => {
            const meta = statusMeta[table.status] || statusMeta.available
            const order = table.active_session?.orders

            return (
              <Card key={table.id} className={`transition-all hover:shadow-lg ${meta.className}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Armchair size={18} className="shrink-0 text-gray-300" />
                        <h2 className="truncate text-base font-bold text-white">{table.name}</h2>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{table.seats} lugares</p>
                    </div>
                    <Badge variant={meta.variant} className="shrink-0 text-[10px] px-1.5">
                      {meta.label}
                    </Badge>
                  </div>

                  {table.active_session?.profiles && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-dark-900 px-2.5 py-1.5 text-xs text-gray-400">
                      <User size={11} className="shrink-0" />
                      <span className="truncate">{table.active_session.profiles.full_name}</span>
                      <span className="shrink-0 rounded-full border border-dark-500 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-gray-400">
                        {getRoleLabel(table.active_session.profiles.role)}
                      </span>
                    </div>
                  )}

                  {order && (
                    <div className="flex items-center justify-between rounded-lg bg-dark-900 px-3 py-2 text-xs">
                      <span className="text-gray-400">Pedido #{order.order_number}</span>
                      <span className="font-bold text-white">{formatCurrency(order.total)}</span>
                    </div>
                  )}

                  <div className={`grid gap-1.5 ${isWaiter ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <Button size="sm" onClick={() => openSession(table)} disabled={!table.is_active} className="text-xs">
                      <Utensils size={14} className="mr-1" />
                      Abrir
                    </Button>
                    {!isWaiter && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => openTableForm(table)} className="text-xs">
                          <SquarePen size={14} className="mr-1" />
                          Editar
                        </Button>
                        <Button size="sm" variant="info" className="col-span-2 text-xs" onClick={() => setQrModalTable(table)}>
                          <QrCode size={14} className="mr-1" />
                          QR Code
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {readyTableOrders.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-white">Prontos para servir</h2>
            <p className="text-sm text-gray-400">Pedidos de mesa marcados pela cozinha como prontos.</p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {readyTableOrders.map(order => (
              <div key={order.id} className="rounded-lg border border-purple-700 bg-dark-900 p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">Pedido #{order.order_number}</p>
                    <p className="text-sm text-gray-400">{order.dining_tables?.name || order.customer_name || 'Mesa'}</p>
                  </div>
                  <Badge variant="info">Pronto</Badge>
                </div>
                <div className="mb-3 space-y-1 text-sm text-gray-300">
                  {(order.order_items || []).slice(0, 4).map(item => (
                    <p key={item.id}>{item.quantity}x {item.product_name}</p>
                  ))}
                </div>
                <Button className="w-full" variant="success" onClick={() => markServed(order)}>
                  Marcar servido
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Modal isOpen={tableModalOpen} onClose={() => setTableModalOpen(false)} title={editingTable ? 'Editar mesa' : 'Nova mesa'}>
        <form onSubmit={handleSaveTable} className="space-y-4">
          <Input label="Nome ou numero da mesa" required value={tableForm.name} onChange={event => setTableForm(prev => ({ ...prev, name: event.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lugares" type="number" min="1" value={tableForm.seats} onChange={event => setTableForm(prev => ({ ...prev, seats: event.target.value }))} />
            <Input label="Ordem" type="number" value={tableForm.sort_order} onChange={event => setTableForm(prev => ({ ...prev, sort_order: event.target.value }))} />
          </div>
          <Textarea label="Observacoes" rows={3} value={tableForm.notes} onChange={event => setTableForm(prev => ({ ...prev, notes: event.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-white">
            <input type="checkbox" checked={tableForm.is_active} onChange={event => setTableForm(prev => ({ ...prev, is_active: event.target.checked }))} />
            Mesa ativa
          </label>
          <div className="flex gap-3">
            <Button type="submit" loading={tableActions.loading} className="flex-1">Salvar</Button>
            {editingTable && (
              <Button type="button" variant={editingTable.is_active ? 'warning' : 'success'} onClick={async () => {
                const result = await tableActions.toggleTable(editingTable.id, !editingTable.is_active)
                if (result.success) {
                  setTableModalOpen(false)
                  refetch()
                }
              }}>
                {editingTable.is_active ? 'Desativar' : 'Ativar'}
              </Button>
            )}
            {editingTable && (
              <Button type="button" variant="danger" onClick={async () => {
                if (!window.confirm('Excluir esta mesa? O historico sera preservado e a mesa ficara inativa.')) return
                const result = await tableActions.deleteTable(editingTable.id)
                if (result.success) {
                  setTableModalOpen(false)
                  refetch()
                }
              }}>
                Excluir
              </Button>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(qrModalTable)}
        onClose={() => setQrModalTable(null)}
        title={qrModalTable ? `QR Code da ${qrModalTable.name}` : 'QR Code da mesa'}
      >
        {qrModalTable && (
          <div className="space-y-4">
            <div className="rounded-lg border border-dark-700 bg-dark-900 p-4 text-sm text-gray-300">
              Este QR Code abre o cardapio diretamente vinculado a esta mesa. Imprima uma vez e mantenha na mesa.
            </div>

            {!qrModalTable.qr_token ? (
              <div className="space-y-3 rounded-xl border border-yellow-700 bg-yellow-950/20 p-4">
                <p className="text-sm text-yellow-100">Esta mesa ainda nao tem token de QR Code.</p>
                <Button onClick={regenerateQrCode} loading={tableActions.loading}>
                  <RefreshCw size={18} className="mr-2" />
                  Gerar QR Code
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-center rounded-xl bg-white p-4">
                  <img src={qrImageUrl} alt={`QR Code da ${qrModalTable.name}`} className="h-64 w-64" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-white">Link da mesa</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input value={qrLink} readOnly className="text-xs" />
                    <Button type="button" variant="secondary" onClick={copyQrLink}>
                      <Copy size={18} className="mr-2" />
                      Copiar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button type="button" onClick={downloadQrCode}>
                    <Download size={18} className="mr-2" />
                    Baixar PNG
                  </Button>
                  <Button type="button" variant="secondary" onClick={printQrCode}>
                    <Printer size={18} className="mr-2" />
                    Imprimir
                  </Button>
                  <Button type="button" variant="outline" onClick={() => window.open(qrLink, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink size={18} className="mr-2" />
                    Abrir link
                  </Button>
                  <Button type="button" variant={qrModalTable.qr_enabled ? 'warning' : 'success'} onClick={toggleQrCode} loading={tableActions.loading}>
                    {qrModalTable.qr_enabled ? 'Desativar QR' : 'Ativar QR'}
                  </Button>
                </div>

                <Button type="button" variant="danger" onClick={regenerateQrCode} loading={tableActions.loading} className="w-full">
                  <RefreshCw size={18} className="mr-2" />
                  Regenerar QR Code
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
        title={
          session
            ? `${session.dining_tables?.name || 'Comanda'}${session.profiles?.full_name ? ` — ${session.profiles.full_name}` : ''}`
            : 'Comanda'
        }
        size="full"
      >
        <div className="grid min-h-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-h-0 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={`min-h-10 shrink-0 rounded-lg border px-4 text-sm font-medium transition-colors ${
                    selectedCategoryId === 'all'
                      ? 'border-white bg-white text-dark-950'
                      : 'border-dark-600 bg-dark-900 text-gray-300 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                {visibleCategories.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`min-h-10 shrink-0 rounded-lg border px-4 text-sm font-medium transition-colors ${
                      selectedCategoryId === category.id
                        ? 'border-white bg-white text-dark-950'
                        : 'border-dark-600 bg-dark-900 text-gray-300 hover:text-white'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <Input
                placeholder="Buscar produto..."
                value={productSearch}
                onChange={event => setProductSearch(event.target.value)}
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={selectedProductId}
                  onChange={event => setSelectedProductId(event.target.value)}
                  className="min-h-11"
                  options={[
                    { value: '', label: filteredProducts.length ? 'Selecione um produto' : 'Nenhum produto nesta categoria' },
                    ...filteredProducts.map(product => ({ value: product.id, label: `${product.name} - ${formatCurrency(product.promotional_price || product.price)}` })),
                  ]}
                />
                <Button type="button" onClick={addProduct} className="w-full sm:w-auto min-h-11">
                  <Plus size={18} className="sm:mr-0 mr-2" />
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </div>
            </div>

            <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1 xl:max-h-[58vh]">
              {items.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum item na comanda.</p>
              )}

              {items.map((item, index) => (
                <div key={`${item.product_id}-${index}`} className="bg-dark-900 border border-dark-600 rounded-lg p-3 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-white font-semibold">{item.product_name}</p>
                      <p className="text-gray-400 text-sm">{formatCurrency(item.unit_price)} cada</p>
                    </div>
                    <Button size="sm" variant="danger" onClick={() => removeItem(index)}>Remover</Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
                    <Input label="Qtd" type="number" min="1" value={item.quantity} onChange={event => updateItem(index, { quantity: event.target.value })} />
                    <Input label="Observacao do item" value={item.notes || ''} onChange={event => updateItem(index, { notes: event.target.value })} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-white">Resumo</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea label="Observacoes da comanda" rows={3} value={sessionNotes} onChange={event => setSessionNotes(event.target.value)} />
                <Input label="Taxa de servico" type="number" step="0.01" value={serviceFee} onChange={event => setServiceFee(event.target.value)} />
                <Input label="Desconto" type="number" step="0.01" value={discountAmount} onChange={event => setDiscountAmount(event.target.value)} />
                <Select
                  label="Pagamento"
                  value={paymentMethod}
                  onChange={event => setPaymentMethod(event.target.value)}
                  options={[
                    { value: 'money', label: 'Dinheiro' },
                    { value: 'pix', label: 'Pix' },
                    { value: 'card_on_delivery', label: 'Cartao' },
                  ]}
                />
                <div className="border-t border-dark-600 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-300"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-gray-300"><span>Servico</span><span>{formatCurrency(Number(serviceFee || 0))}</span></div>
                  <div className="flex justify-between text-gray-300"><span>Desconto</span><span>-{formatCurrency(Number(discountAmount || 0))}</span></div>
                  <div className="flex justify-between text-white text-lg font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
              </CardContent>
            </Card>

            <div className="sticky bottom-0 grid grid-cols-1 gap-3 rounded-xl border border-dark-700 bg-dark-800/95 p-3 shadow-xl backdrop-blur">
              <Button onClick={saveComanda} loading={tableActions.loading}>Salvar comanda</Button>
              <Button variant="info" onClick={sendKitchen} loading={tableActions.loading}>
                <Send size={18} className="mr-2" />
                Enviar para cozinha
              </Button>
              <Button variant="warning" onClick={requestClosure} loading={tableActions.loading}>Solicitar fechamento</Button>
              <Button variant="secondary" onClick={openTransferModal} loading={tableActions.loading}>
                Transferir mesa
              </Button>
              {session?.profiles && (
                <div className="rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-gray-300">
                  Responsavel atual: <span className="font-semibold text-white">{session.profiles.full_name}</span>{' '}
                  <span className="text-gray-400">({getRoleLabel(session.profiles.role)})</span>
                </div>
              )}
              <Button variant="secondary" onClick={printAccount}>
                <Printer size={18} className="mr-2" />
                Imprimir conta
              </Button>
              <Button variant="success" onClick={closeSession} loading={tableActions.loading}>
                <CircleDollarSign size={18} className="mr-2" />
                Marcar paga e liberar mesa
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transferir mesa"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Esta mesa so pode ser alterada pelo responsavel atual. Para passar o atendimento, selecione abaixo quem vai assumir.
          </p>

          <Select
            label="Transferir para"
            value={transferUserId}
            onChange={event => setTransferUserId(event.target.value)}
            options={[
              { value: '', label: transferUsers.length ? 'Selecione o usuario' : 'Nenhum usuario disponivel' },
              ...transferUsers.map(user => ({
                value: user.id,
                label: `${user.full_name} (${getRoleLabel(user.role)})`,
              })),
            ]}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              className="flex-1"
              onClick={handleTransferSession}
              disabled={!transferUserId}
              loading={tableActions.loading}
            >
              Confirmar transferencia
            </Button>
            <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Tables
