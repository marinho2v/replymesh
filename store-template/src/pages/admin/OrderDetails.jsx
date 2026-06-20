import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Bike,
  Clock,
  MessageCircle,
  Printer,
  ReceiptText,
  Send,
  X,
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import OrderStatusBadge from '../../components/dashboard/OrderStatusBadge'
import SelectedOptionsSummary from '../../components/shared/SelectedOptionsSummary'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import {
  getStoreOrder,
  railsAssignMotoboyToOrder,
  railsGetMotoboys,
  railsGetWhatsappTemplates,
  railsSendWhatsappTest,
  updateStoreOrderStatus,
} from '../../services/storeApi'
import { ORDER_STATUS_LABELS, ORDER_STATUSES, ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../lib/constants'
import { formatSelectedOptions } from '../../utils/productOptions'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'
import { flowFromWhatsappTemplates, getNextStatuses } from '../../utils/orderStatus.jsx'

const centsToCurrency = (value) => formatCurrency(Number(value || 0) / 100)

const normalizeOrder = (order) => ({
  ...order,
  total: order.total_brl ?? order.total ?? Number(order.total_cents || 0) / 100,
  subtotal: order.subtotal ?? Number(order.subtotal_cents || 0) / 100,
  delivery_fee: order.delivery_fee ?? Number(order.delivery_fee_cents || 0) / 100,
  discount_amount: order.discount_amount ?? Number(order.discount_cents || 0) / 100,
  change_for: order.change_for ?? Number(order.change_for_cents || 0) / 100,
  order_items: order.order_items || order.items || [],
})

const detailAddress = (order) => {
  const address = order.address || order
  return {
    zip_code: address.zip_code,
    street: address.street,
    number: address.number,
    complement: address.complement,
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    reference: address.reference,
  }
}

const addressLine = (order) => {
  const address = detailAddress(order)
  return [
    address.street && `${address.street}${address.number ? `, ${address.number}` : ''}`,
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
  ].filter(Boolean).join(' | ')
}

const printValue = (value) => String(value ?? '').replace(/[<>]/g, '')
const printCurrency = (value) => {
  const number = Number(value || 0)
  return `R$ ${number.toFixed(2).replace('.', ',')}`
}

const OrderDetails = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const basePath = useCompanyBasePath()
  const [order, setOrder] = useState(null)
  const [motoboys, setMotoboys] = useState([])
  const [selectedMotoboyId, setSelectedMotoboyId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [statusFlow, setStatusFlow] = useState()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true)
      const data = normalizeOrder(await getStoreOrder(orderId))
      setOrder(data)
      setSelectedMotoboyId(data.motoboy?.id || data.motoboy_id || '')
      setSelectedStatus('')
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel carregar o pedido')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  const loadMotoboys = useCallback(async () => {
    try {
      setMotoboys(await railsGetMotoboys({ params: { active: 'true' } }))
    } catch (error) {
      console.error('Erro ao carregar motoboys:', error)
    }
  }, [])

  const loadStatusFlow = useCallback(async () => {
    try {
      const templates = await railsGetWhatsappTemplates()
      setStatusFlow(flowFromWhatsappTemplates(templates))
    } catch (error) {
      console.error('Erro ao carregar templates WhatsApp:', error)
    }
  }, [])

  useEffect(() => {
    loadOrder()
    loadMotoboys()
    loadStatusFlow()
  }, [loadMotoboys, loadOrder, loadStatusFlow])

  const orderItems = order?.order_items || []
  const statusHistory = useMemo(() => order?.status_history || [], [order])
  const nextStatusOptions = useMemo(() => {
    if (!order) return [{ value: '', label: 'Selecionar status' }]

    const statuses = getNextStatuses(order.status, order.order_type, 'admin', statusFlow)
      .filter(status => !(
        status === ORDER_STATUSES.OUT_FOR_DELIVERY &&
        order.order_type === 'delivery' &&
        !order.motoboy
      ))

    return [
      { value: '', label: 'Selecionar status' },
      ...statuses.map(status => ({
        value: status,
        label: ORDER_STATUS_LABELS[status] || status,
      })),
    ]
  }, [order, statusFlow])
  const canCancelOrder = nextStatusOptions.some(option => option.value === ORDER_STATUSES.CANCELLED)

  const refreshWith = (updatedOrder) => {
    const normalized = normalizeOrder(updatedOrder)
    setOrder(normalized)
    setSelectedMotoboyId(normalized.motoboy?.id || normalized.motoboy_id || selectedMotoboyId)
  }

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      toast.error('Selecione um status')
      return
    }

    setActionLoading('status')
    try {
      const updatedOrder = await updateStoreOrderStatus(order.id, selectedStatus, { skipSideEffects: true })
      refreshWith(updatedOrder)
      toast.success('Status atualizado')
      await loadOrder()
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel atualizar status')
    } finally {
      setActionLoading('')
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancelar este pedido?')) return
    setSelectedStatus(ORDER_STATUSES.CANCELLED)
    setActionLoading('cancel')
    try {
      const updatedOrder = await updateStoreOrderStatus(order.id, ORDER_STATUSES.CANCELLED, { skipSideEffects: false })
      refreshWith(updatedOrder)
      toast.success('Pedido cancelado')
      await loadOrder()
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel cancelar pedido')
    } finally {
      setActionLoading('')
    }
  }

  const handleAssignMotoboy = async () => {
    if (!selectedMotoboyId) {
      toast.error('Selecione um motoboy')
      return
    }

    setActionLoading('motoboy')
    try {
      const updatedOrder = await railsAssignMotoboyToOrder(order.id, selectedMotoboyId)
      refreshWith(updatedOrder)
      toast.success('Motoboy salvo no pedido')
      await loadOrder()
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel salvar motoboy')
    } finally {
      setActionLoading('')
    }
  }

  const handleWhatsapp = async () => {
    setActionLoading('whatsapp')
    try {
      await railsSendWhatsappTest({ orderId: order.id, status: order.status === 'pending' ? 'accepted' : order.status })
      toast.success('WhatsApp enviado/preparado pelo Rails')
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel enviar WhatsApp')
    } finally {
      setActionLoading('')
    }
  }

  const buildPrintHtml = () => {
    const address = detailAddress(order)
    const itemsHtml = orderItems.map(item => `
      <div class="item">
        <div><strong>${printValue(item.quantity)}x ${printValue(item.product_name)}</strong></div>
        ${formatSelectedOptions(item.selected_options).map(line => `<div class="muted small">${printValue(line)}</div>`).join('')}
        ${item.notes ? `<div class="muted small">Obs: ${printValue(item.notes)}</div>` : ''}
        <div class="right">${printCurrency(Number(item.total_price_cents || 0) / 100)}</div>
      </div>
    `).join('')

    return `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Pedido #${printValue(order.order_number)}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 10px; color: #000; background: #fff; }
            .receipt { width: 80mm; max-width: 100%; margin: 0 auto; font-size: 12px; line-height: 1.25; }
            h1 { text-align: center; font-size: 18px; margin: 0 0 8px; }
            h2 { font-size: 13px; margin: 10px 0 4px; }
            p { margin: 2px 0; }
            hr { border: 0; border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
            .row span:last-child { white-space: nowrap; text-align: right; }
            .item { margin-bottom: 8px; }
            .muted { color: #333; }
            .small { font-size: 11px; }
            .right { text-align: right; }
            .total { font-size: 16px; font-weight: bold; }
            @media print {
              body { padding: 0; }
              @page { margin: 4mm; }
              .receipt { width: 80mm; }
            }
          </style>
        </head>
        <body>
          <main class="receipt">
            <h1>PEDIDO #${printValue(order.order_number)}</h1>
            <p><strong>Cliente:</strong> ${printValue(order.customer_name)}</p>
            <p><strong>Telefone:</strong> ${printValue(order.customer_phone || order.customer_whatsapp)}</p>
            <p><strong>Tipo:</strong> ${printValue(ORDER_TYPE_LABELS[order.order_type] || order.order_type)}</p>
            <p><strong>Data:</strong> ${printValue(formatDateTime(order.created_at))}</p>
            <hr />
            ${order.order_type === 'delivery' ? `
              <h2>Endereco</h2>
              <p>${printValue(address.street)}, ${printValue(address.number)}</p>
              ${address.complement ? `<p>${printValue(address.complement)}</p>` : ''}
              <p>${printValue(address.neighborhood)}</p>
              <p>${printValue(address.city)} - ${printValue(address.state)}</p>
              ${address.reference ? `<p><strong>Ref:</strong> ${printValue(address.reference)}</p>` : ''}
              <hr />
            ` : '<p><strong>Retirada no local</strong></p><hr />'}
            <h2>Itens</h2>
            ${itemsHtml}
            <hr />
            <div class="row"><span>Subtotal</span><span>${printCurrency(order.subtotal)}</span></div>
            <div class="row"><span>Taxa</span><span>${printCurrency(order.delivery_fee)}</span></div>
            <div class="row"><span>Desconto</span><span>${printCurrency(order.discount_amount)}</span></div>
            <div class="row total"><span>Total</span><span>${printCurrency(order.total)}</span></div>
            <p><strong>Pagamento:</strong> ${printValue(PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method)}</p>
            ${order.needs_change ? `<p><strong>Troco:</strong> ${printCurrency(order.change_for)}</p>` : ''}
            ${order.notes ? `<hr /><p><strong>Obs:</strong> ${printValue(order.notes)}</p>` : ''}
          </main>
          <script>
            window.addEventListener('load', function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 150);
            });
          </script>
        </body>
      </html>
    `
  }

  const printWithIframeFallback = (html) => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    iframe.srcdoc = html
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => iframe.remove(), 1000)
      }, 150)
    }
    document.body.appendChild(iframe)
  }

  const handlePrint = () => {
    const html = buildPrintHtml()
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const printUrl = URL.createObjectURL(blob)
    const printWindow = window.open(printUrl, '_blank', 'width=420,height=720')

    if (!printWindow) {
      URL.revokeObjectURL(printUrl)
      printWithIframeFallback(html)
      return
    }

    setTimeout(() => URL.revokeObjectURL(printUrl), 10000)
  }

  if (loading) return <div className="text-white">Carregando...</div>
  if (!order) return <div className="text-white">Pedido nao encontrado</div>

  const address = detailAddress(order)

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" onClick={() => navigate(`${basePath}/admin/orders`)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <p className="text-sm text-gray-400">Detalhe do pedido</p>
            <h1 className="text-2xl font-black text-white">Pedido #{order.order_number}</h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <Button variant="secondary" onClick={handlePrint}>
          <Printer size={18} className="mr-2" />
          Imprimir
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Informacoes do pedido</h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Info label="Cliente" value={order.customer_name} />
                <Info label="Telefone" value={order.customer_phone || order.customer_whatsapp} />
                <Info label="Tipo" value={ORDER_TYPE_LABELS[order.order_type] || order.order_type} />
                <Info label="Pagamento" value={PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method} />
                <Info label="Status da entrega" value={order.delivery_status} />
                <Info label="Data/hora" value={formatDateTime(order.created_at)} />
                {order.motoboy && <Info label="Motoboy" value={order.motoboy.name} />}
                {order.needs_change && <Info label="Troco para" value={formatCurrency(order.change_for)} />}
              </div>

              {order.order_type === 'delivery' && (
                <div className="rounded-lg border border-dark-600 bg-dark-900 p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-300">Endereco completo</p>
                  <p className="text-white">{address.street}, {address.number}</p>
                  {address.complement && <p className="text-gray-300">{address.complement}</p>}
                  <p className="text-gray-300">Bairro: {address.neighborhood || '-'}</p>
                  <p className="text-gray-300">{address.city} - {address.state}</p>
                  {address.reference && <p className="mt-2 text-sm text-yellow-300">Ref.: {address.reference}</p>}
                </div>
              )}

              {order.notes && (
                <div className="rounded-lg border border-yellow-700/50 bg-yellow-950/20 p-4">
                  <p className="text-sm font-semibold text-yellow-300">Observacoes</p>
                  <p className="mt-1 text-white">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Itens do pedido</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {orderItems.map(item => (
                <div key={item.id} className="flex justify-between gap-4 rounded-lg bg-dark-900 p-3">
                  <div>
                    <p className="font-semibold text-white">{item.quantity}x {item.product_name}</p>
                    <SelectedOptionsSummary selectedOptions={item.selected_options} />
                    {item.notes && <p className="mt-1 text-sm text-yellow-300">Obs.: {item.notes}</p>}
                  </div>
                  <p className="font-semibold text-white">{centsToCurrency(item.total_price_cents)}</p>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <div className="w-full space-y-2">
                <TotalRow label="Subtotal" value={formatCurrency(order.subtotal)} />
                <TotalRow label="Taxa de entrega" value={formatCurrency(order.delivery_fee)} />
                <TotalRow label={`Desconto${order.coupon?.code || order.coupon_code ? ` (${order.coupon?.code || order.coupon_code})` : ''}`} value={`-${formatCurrency(order.discount_amount)}`} muted={order.discount_amount <= 0} />
                <div className="flex justify-between border-t border-dark-600 pt-2 text-xl font-black text-white">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Historico de status</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusHistory.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma mudanca registrada ainda.</p>
              ) : statusHistory.map((log, index) => (
                <div key={`${log.new_status}-${log.created_at}-${index}`} className="flex items-start gap-3">
                  <Clock size={16} className="mt-1 text-gray-400" />
                  <div>
                    <p className="text-sm text-white">
                      {`${log.previous_status || 'inicio'} -> ${log.new_status}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(log.created_at)} · {log.changed_by?.name || log.changed_by?.email || 'Sistema'}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <ReceiptText size={20} />
                Acoes
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" variant="outline" onClick={handleWhatsapp} loading={actionLoading === 'whatsapp'}>
                <MessageCircle size={18} className="mr-2" />
                Enviar WhatsApp
              </Button>

              <div className="space-y-2 border-t border-dark-600 pt-4">
                <p className="text-sm text-gray-400">Alterar status</p>
                <Select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} options={nextStatusOptions} />
                <Button className="w-full" onClick={handleStatusChange} loading={actionLoading === 'status'} disabled={!selectedStatus}>
                  Salvar status
                </Button>
                <Button className="w-full" variant="danger" onClick={handleCancel} loading={actionLoading === 'cancel'} disabled={order.status === ORDER_STATUSES.CANCELLED || !canCancelOrder}>
                  <X size={18} className="mr-2" />
                  Cancelar pedido
                </Button>
              </div>

              {order.order_type === 'delivery' && (
                <div className="space-y-2 border-t border-dark-600 pt-4">
                  <p className="flex items-center gap-2 text-sm text-gray-400">
                    <Bike size={17} />
                    Motoboy
                  </p>
                  <Select
                    value={selectedMotoboyId}
                    onChange={(event) => setSelectedMotoboyId(event.target.value)}
                    options={[
                      { value: '', label: 'Selecionar motoboy' },
                      ...motoboys.map(motoboy => ({ value: motoboy.id, label: motoboy.name })),
                    ]}
                  />
                  <Button className="w-full" variant="info" onClick={handleAssignMotoboy} loading={actionLoading === 'motoboy'} disabled={!selectedMotoboyId}>
                    <Send size={18} className="mr-2" />
                    Salvar motoboy no pedido
                  </Button>
                  {order.motoboy && (
                    <p className="rounded-lg bg-dark-900 p-3 text-sm text-gray-300">
                      Atual: <span className="font-semibold text-white">{order.motoboy.name}</span>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

const Info = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-400">{label}</p>
    <p className="font-semibold text-white">{value || '-'}</p>
  </div>
)

const TotalRow = ({ label, value, muted = false }) => (
  <div className={`flex justify-between ${muted ? 'text-gray-500' : 'text-gray-300'}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
)

export default OrderDetails
