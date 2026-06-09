import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, MessageCircle, ShoppingBag } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import SelectedOptionsSummary from '../../components/shared/SelectedOptionsSummary'
import MercadoPagoPixPanel from '../../components/shared/MercadoPagoPixPanel'
import { getPublicOrder } from '../../services/publicApi'
import { buildWhatsAppLinks, generateOrderMessage } from '../../services/whatsapp'
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'
import { useCompanySlug, useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from '../../lib/constants'
import { formatCurrency } from '../../utils/currency'
import {
  copyPixToClipboard,
  getPixCopyText,
  getPixMode,
  hasPixConfig,
  isMercadoPagoEnabled,
  PIX_KEY_TYPE_LABELS,
} from '../../utils/pix'
import { toast } from 'sonner'

const formatAddress = (address) => {
  if (!address) return ''
  return [
    address.street && `${address.street}${address.number ? `, ${address.number}` : ''}`,
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
    address.reference && `Ref.: ${address.reference}`,
  ].filter(Boolean).join(' | ')
}

const paymentLabel = (order) => {
  const base = PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method
  if (order.payment_method === 'pix' && order.payment_status === 'paid') return `${base} - pago`
  if (order.payment_method === 'pix' && order.payment_status === 'pending_payment') return `${base} - aguardando pagamento`
  return base
}

const Success = () => {
  const { orderId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const slug = useCompanySlug()
  const basePath = useCompanyBasePath()
  const { store } = usePublicStoreInfo()

  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!location.state?.order)
  const [error, setError] = useState(null)
  const [whatsappLinks, setWhatsappLinks] = useState(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId) return

    try {
      setLoading(true)
      const orderData = await getPublicOrder(orderId, slug)
      setOrder(orderData)
      setError(null)
    } catch (err) {
      setError(err.message || 'Pedido nao encontrado')
    } finally {
      setLoading(false)
    }
  }, [orderId, slug])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  useEffect(() => {
    if (!order || !store) {
      setWhatsappLinks(null)
      return
    }

    const storePhone = store.whatsapp_number || store.whatsapp || store.phone
    if (!storePhone) {
      setWhatsappLinks(null)
      return
    }

    const whatsappOrder = {
      ...order,
      ...(order.address || {}),
      order_items: order.order_items || [],
    }

    const storeSettings = {
      ...store,
      store_name: store.store_name || store.name || store.company_name || store.trade_name,
      whatsapp_number: storePhone,
    }

    const message = generateOrderMessage(whatsappOrder, '', storeSettings)
    setWhatsappLinks(buildWhatsAppLinks(storePhone, message))
  }, [order, store])

  const handleSendWhatsapp = (event) => {
    if (!whatsappLinks?.waMe && !whatsappLinks?.web) {
      event.preventDefault()
      toast.error('WhatsApp da loja ainda nao configurado')
    }
  }

  const handleCopyPix = async () => {
    try {
      const copied = await copyPixToClipboard(store)
      toast[copied ? 'success' : 'error'](copied ? 'PIX copiado' : 'PIX nao configurado')
    } catch {
      toast.error('Nao foi possivel copiar o PIX')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-white">Carregando pedido...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-dark-600 bg-dark-800 p-6 text-center">
          <h1 className="mb-2 text-xl font-bold text-white">Pedido nao encontrado</h1>
          <p className="mb-4 text-sm text-gray-400">{error || 'Nao foi possivel carregar o pedido.'}</p>
          <Button type="button" onClick={() => navigate(`${basePath}/menu`)}>
            Voltar ao cardapio
          </Button>
        </div>
      </div>
    )
  }

  const discountAmount = Number(order.discount_amount || order.discount || 0)
  const mercadoPagoPixActive = isMercadoPagoEnabled(store)
  const showMercadoPagoPix = (
    order.payment_method === 'pix' &&
    mercadoPagoPixActive &&
    order.payment_status === 'pending_payment' &&
    (order.pix_qr_code || order.pix_copy_paste)
  )
  const showPix = order.payment_method === 'pix' && !mercadoPagoPixActive && hasPixConfig(store)

  return (
    <div className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-dark-600 bg-dark-800 p-5 sm:p-8">
          {store && (
            <div className="mb-6 flex items-center justify-center gap-3">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt={store.name || 'Logo'}
                  className="h-12 w-16 object-contain"
                />
              )}
              {store.name && <span className="text-lg font-bold text-white">{store.name}</span>}
            </div>
          )}

          <div className="text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-600">
              <CheckCircle size={40} className="text-white" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">Pedido realizado!</h1>
            <p className="mb-6 text-gray-400">Pedido #{order.order_number || order.id}</p>
          </div>

          <div className="mb-6 rounded-lg border border-green-700 bg-green-900/20 p-5 text-center">
            <p className="text-xl font-bold text-white">Envie o pedido no WhatsApp da loja</p>
            <p className="mx-auto mt-2 max-w-xl text-sm text-green-100/80">
              A conversa abre com a mensagem pronta. Ela leva nome, WhatsApp, endereco,
              itens, forma de pagamento, troco quando tiver e total do pedido.
            </p>
            <a
              href={whatsappLinks?.waMe || whatsappLinks?.web || '#'}
              target="_blank"
              rel="noreferrer"
              onClick={handleSendWhatsapp}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-4 text-base font-bold text-white transition-colors hover:bg-green-500 sm:w-auto sm:px-8"
            >
              <MessageCircle size={20} className="mr-2" />
              Enviar mensagem no WhatsApp
            </a>
          </div>

          {showMercadoPagoPix && (
            <div className="mb-5 rounded-lg border border-yellow-700 bg-yellow-900/20 p-4">
              <MercadoPagoPixPanel
                orderId={order.id}
                qrCode={order.pix_copy_paste || order.pix_qr_code}
                qrCodeBase64={order.pix_qr_code_base64}
                ticketUrl={order.pix_ticket_url}
                testMode={Boolean(order.pix_test_mode)}
                onConfirmed={fetchOrder}
              />
            </div>
          )}

          <div className="rounded-lg bg-dark-900 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Informacoes do pedido</h2>

            <div className="mb-5 grid gap-4 border-b border-dark-700 pb-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-400">Cliente</p>
                <p className="font-semibold text-white">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">WhatsApp</p>
                <p className="font-semibold text-white">{order.customer_whatsapp || order.customer_phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Tipo</p>
                <p className="font-semibold text-white">{ORDER_TYPE_LABELS[order.order_type] || order.order_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Pagamento</p>
                <p className="font-semibold text-white">{paymentLabel(order)}</p>
              </div>
            </div>

            {order.status === 'cancelled' && (
              <div className="mb-5 rounded-lg border border-red-700 bg-red-900/30 p-3 text-sm text-red-200">
                Este pedido foi cancelado.
              </div>
            )}

            {order.address ? (
              <div className="mb-5 rounded-lg border border-dark-700 bg-black/20 p-3">
                <p className="mb-1 text-sm font-semibold text-white">Endereco de entrega</p>
                <p className="text-sm text-gray-400">{formatAddress(order.address)}</p>
              </div>
            ) : (
              <div className="mb-5 rounded-lg border border-dark-700 bg-black/20 p-3">
                <p className="mb-1 text-sm font-semibold text-white">Retirada</p>
                <p className="text-sm text-gray-400">Retirada no local.</p>
              </div>
            )}

            {showPix && (
              <div className="mb-5 rounded-lg border border-blue-700 bg-blue-900/20 p-4">
                <p className="mb-3 text-sm font-semibold text-white">Dados para pagamento PIX</p>
                <div className="space-y-3">
                  {store?.pix_qr_code_url && (
                    <img
                      src={store.pix_qr_code_url}
                      alt="QR Code PIX"
                      className="h-44 w-44 rounded-lg bg-white object-contain p-2"
                    />
                  )}
                  {getPixCopyText(store) && (
                    <div className="rounded-lg border border-dark-700 bg-black/20 p-3">
                      <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                        {getPixMode(store) === 'payload' ? 'PIX copia e cola' : 'Chave PIX'}
                      </p>
                      <p className="break-all text-sm text-gray-200">{getPixCopyText(store)}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-300 sm:grid-cols-2">
                    {store?.pix_receiver_name && (
                      <p>Recebedor: <span className="text-white">{store.pix_receiver_name}</span></p>
                    )}
                    {store?.pix_key_type && (
                      <p>Tipo: <span className="text-white">{PIX_KEY_TYPE_LABELS[store.pix_key_type] || store.pix_key_type}</span></p>
                    )}
                  </div>
                  {getPixCopyText(store) && (
                    <Button type="button" variant="outline" size="sm" onClick={handleCopyPix}>
                      Copiar PIX
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-dark-700 pt-4">
              <h3 className="mb-3 font-semibold text-white">Itens</h3>
              <div className="space-y-3">
                {order.order_items?.map((item, index) => (
                  <div key={`${item.product_name}-${index}`} className="flex justify-between gap-3 text-sm">
                    <div className="text-gray-400">
                      <p>{item.quantity}x {item.product_name}</p>
                      <SelectedOptionsSummary selectedOptions={item.selected_options} />
                      {item.notes && <p className="mt-1 text-xs text-gray-500">Obs: {item.notes}</p>}
                    </div>
                    <span className="text-white">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-dark-700 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">{formatCurrency(order.subtotal)}</span>
              </div>
              {Number(order.delivery_fee || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Taxa de entrega</span>
                  <span className="text-white">{formatCurrency(order.delivery_fee)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Desconto{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-dark-700 pt-2 text-xl font-bold">
                <span className="text-white">Total</span>
                <span className="text-white">{formatCurrency(order.total)}</span>
              </div>
              {order.payment_method === 'money' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Troco</span>
                  <span className="text-white">
                    {order.needs_change ? `Para ${formatCurrency(order.change_for)}` : 'Nao precisa'}
                  </span>
                </div>
              )}
              {order.notes && (
                <div className="rounded-lg border border-dark-700 bg-black/20 p-3 text-sm">
                  <p className="font-semibold text-white">Observacao</p>
                  <p className="mt-1 text-gray-400">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={whatsappLinks?.waMe || whatsappLinks?.web || '#'}
              target="_blank"
              rel="noreferrer"
              onClick={handleSendWhatsapp}
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-500"
            >
              <MessageCircle size={20} className="mr-2" />
              Enviar WhatsApp
            </a>
            <Button variant="outline" onClick={() => navigate(`${basePath}/menu`)}>
              <ShoppingBag size={20} className="mr-2" />
              Fazer Novo Pedido
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Success
