import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ShoppingBag, Ticket, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import SelectedOptionsSummary from '../../components/shared/SelectedOptionsSummary'
import { useCart } from '../../hooks/useCart'
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'
import {
  createPublicOrder,
  deletePublicCustomerAddress,
  lookupPublicCustomer,
} from '../../services/publicApi'
import { validateCoupon } from '../../services/coupons'
import { useCompanySlug, useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { DISCOUNT_TYPES, ORDER_TYPES, PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../../lib/constants'
import { formatCurrency } from '../../utils/currency'
import { getEffectiveStoreStatus } from '../../utils/storeSchedule'
import {
  copyPixToClipboard,
  getPixCopyText,
  getPixMode,
  hasPixConfig,
  isMercadoPagoEnabled,
  PIX_KEY_TYPE_LABELS,
} from '../../utils/pix'
import MercadoPagoPixPanel from '../../components/shared/MercadoPagoPixPanel'

const CUSTOMER_DATA_KEY = 'replymesh_customer_data'

const initialFormData = {
  fullName: '',
  whatsapp: '',
  street: '',
  number: '',
  complement: '',
  reference: '',
  orderType: ORDER_TYPES.DELIVERY,
  paymentMethod: PAYMENT_METHODS.MONEY,
  needsChange: false,
  changeFor: '',
  notes: '',
}

const digitsOnly = (value) => String(value || '').replace(/\D/g, '')

const zoneDeliveryFee = (zone) => {
  if (!zone) return 0
  if (zone.delivery_fee !== undefined && zone.delivery_fee !== null) return Number(zone.delivery_fee)
  return Number(zone.delivery_fee_cents || 0) / 100
}

const Checkout = () => {
  const navigate = useNavigate()
  const { cart, coupon, discount, getSubtotal, clearCart, applyCoupon, removeCoupon } = useCart()
  const { store, deliveryZones, businessHours, loading: storeLoading } = usePublicStoreInfo()
  const slug = useCompanySlug()
  const basePath = useCompanyBasePath()

  const [formData, setFormData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_DATA_KEY) || '{}')
      return { ...initialFormData, fullName: saved.fullName || '', whatsapp: saved.whatsapp || '' }
    } catch {
      return initialFormData
    }
  })
  const [selectedDeliveryZoneId, setSelectedDeliveryZoneId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lookupStatus, setLookupStatus] = useState('idle')
  const [lookupMessage, setLookupMessage] = useState('')
  const [customerProfile, setCustomerProfile] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [saveCustomerData, setSaveCustomerData] = useState(false)
  const [deletingAddressId, setDeletingAddressId] = useState(null)
  const [mpPixData, setMpPixData] = useState(null) // { pix_payment_id, pix_qr_code, pix_qr_code_base64, pix_ticket_url, order_id }
  const lookupAbortRef = useRef(null)

  // Persist customer name + phone when saveCustomerData is checked
  useEffect(() => {
    if (!saveCustomerData) {
      localStorage.removeItem(CUSTOMER_DATA_KEY)
      return
    }
    localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify({
      fullName: formData.fullName,
      whatsapp: formData.whatsapp,
    }))
  }, [saveCustomerData, formData.fullName, formData.whatsapp])

  // Auto-debounce WhatsApp lookup (600ms)
  useEffect(() => {
    const phone = digitsOnly(formData.whatsapp)
    if (phone.length < 10) {
      setCustomerProfile(null)
      setLookupStatus('idle')
      setLookupMessage('')
      return
    }

    if (lookupAbortRef.current) clearTimeout(lookupAbortRef.current)

    setLookupStatus('loading')
    setLookupMessage('Buscando cliente pelo WhatsApp...')

    let active = true
    lookupAbortRef.current = setTimeout(async () => {
      try {
        const result = await lookupPublicCustomer(phone, slug)
        if (!active) return

        if (!result.found || !result.customer) {
          setCustomerProfile(null)
          setLookupStatus('not_found')
          setLookupMessage('Cliente nao encontrado. Preencha os dados normalmente.')
          return
        }

        const customer = result.customer
        setCustomerProfile(customer)
        setFormData(prev => ({ ...prev, fullName: customer.full_name || prev.fullName }))
        setLookupStatus('found')
        setLookupMessage(`Ola, ${customer.full_name}! Encontramos seu cadastro.`)

        // Auto-aplicar último endereço se campos estiverem vazios
        if (!formData.street && customer.last_address) {
          applyLookupAddress(customer.last_address)
        }
      } catch (error) {
        if (!active) return
        setCustomerProfile(null)
        setLookupStatus('error')
        setLookupMessage(error.message || 'Nao foi possivel buscar o cliente agora.')
      }
    }, 600)

    return () => {
      active = false
      clearTimeout(lookupAbortRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.whatsapp, slug])

  const selectedDeliveryZone = useMemo(
    () => deliveryZones.find(zone => String(zone.id) === String(selectedDeliveryZoneId)),
    [deliveryZones, selectedDeliveryZoneId]
  )

  const deliveryZoneOptions = useMemo(() => [
    { value: '', label: 'Selecione uma regiao atendida' },
    ...deliveryZones.map(zone => ({
      value: zone.id,
      label: `${zone.name}${zone.city ? ` - ${zone.city}` : ''} (${formatCurrency(zoneDeliveryFee(zone))})`,
    })),
  ], [deliveryZones])

  const subtotal = getSubtotal()
  const previewDeliveryFee = formData.orderType === ORDER_TYPES.DELIVERY
    ? zoneDeliveryFee(selectedDeliveryZone)
    : 0
  const hasFreeShippingCoupon = coupon?.discount_type === DISCOUNT_TYPES.FREE_SHIPPING
  const hasFreeItemCoupon = coupon?.discount_type === DISCOUNT_TYPES.FREE_ITEM
  const effectiveDiscount = hasFreeShippingCoupon ? previewDeliveryFee : (hasFreeItemCoupon ? 0 : discount)
  const previewTotal = Math.max(subtotal + previewDeliveryFee - effectiveDiscount, 0)
  const customerCoupons = customerProfile?.coupons || []
  const todayStatus = useMemo(() => getEffectiveStoreStatus(store, businessHours), [businessHours, store])
  const storeClosed = store?.block_orders_when_closed !== false && !todayStatus.isOpen
  const storeClosedMessage = store?.closed_message || todayStatus.message || 'Loja fechada no momento'
  const mercadoPagoPixActive = isMercadoPagoEnabled(store)

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const findDeliveryZoneForAddress = useCallback((address) => (
    deliveryZones.find(zone => (
      String(zone.name || '').toLowerCase() === String(address?.neighborhood || '').toLowerCase() ||
      String(zone.slug || '').toLowerCase() === String(address?.neighborhood || '').toLowerCase().replace(/\s+/g, '-')
    ))
  ), [deliveryZones])

  const applyLookupAddress = useCallback((address) => {
    if (!address) return

    setFormData(prev => ({
      ...prev,
      street: address.street || '',
      number: address.number || '',
      complement: address.complement || '',
      reference: address.reference || '',
    }))

    const matchedZone = deliveryZones.find(zone => (
      String(zone.name || '').toLowerCase() === String(address?.neighborhood || '').toLowerCase()
    ))
    if (matchedZone) setSelectedDeliveryZoneId(String(matchedZone.id))
  }, [deliveryZones])

  const handleDeleteSavedAddress = async (address) => {
    if (!address?.id || deletingAddressId) return
    if (!window.confirm('Remover este endereco salvo?')) return

    setDeletingAddressId(address.id)
    try {
      await deletePublicCustomerAddress(digitsOnly(formData.whatsapp), address.id, slug)

      const result = await lookupPublicCustomer(digitsOnly(formData.whatsapp), slug)
      setCustomerProfile(result.found ? result.customer : null)
      toast.success('Endereco removido')
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel remover o endereco')
    } finally {
      setDeletingAddressId(null)
    }
  }

  const handleOrderTypeChange = (orderType) => {
    updateFormData('orderType', orderType)
    if (orderType === ORDER_TYPES.PICKUP) {
      setSelectedDeliveryZoneId('')
    }
  }

  const handleCopyPix = async () => {
    try {
      const copied = await copyPixToClipboard(store)
      toast[copied ? 'success' : 'error'](copied ? 'PIX copiado' : 'PIX ainda nao configurado')
    } catch {
      toast.error('Nao foi possivel copiar o PIX')
    }
  }

  const validateForm = () => {
    if (storeClosed) return storeClosedMessage
    if (cart.length === 0) return 'Carrinho vazio'
    if (!formData.fullName.trim()) return 'Informe o nome completo'
    if (digitsOnly(formData.whatsapp).length < 10) return 'Informe um WhatsApp valido'
    if (formData.paymentMethod === PAYMENT_METHODS.MONEY && formData.needsChange) {
      const changeForCents = Math.round(Number(String(formData.changeFor).replace(',', '.') || 0) * 100)
      if (!changeForCents || changeForCents <= 0) return 'Informe o valor para troco'
    }
    if (formData.orderType === ORDER_TYPES.DELIVERY) {
      if (!selectedDeliveryZoneId) return 'Selecione a regiao de entrega'
      if (!formData.street.trim()) return 'Informe a rua'
      if (!formData.number.trim()) return 'Informe o numero'
    }
    return null
  }

  const buildOrderPayload = () => ({
    order_type: formData.orderType,
    payment_method: formData.paymentMethod,
    delivery_zone_id: formData.orderType === ORDER_TYPES.DELIVERY ? selectedDeliveryZoneId : null,
    needs_change: formData.paymentMethod === PAYMENT_METHODS.MONEY && formData.needsChange,
    coupon_code: coupon?.code || null,
    change_for_cents: formData.paymentMethod === PAYMENT_METHODS.MONEY && formData.needsChange
      ? Math.round(Number(String(formData.changeFor).replace(',', '.') || 0) * 100)
      : null,
    customer: {
      full_name: formData.fullName.trim(),
      phone: digitsOnly(formData.whatsapp),
      whatsapp: digitsOnly(formData.whatsapp),
    },
    address: formData.orderType === ORDER_TYPES.DELIVERY ? {
      street: formData.street.trim(),
      number: formData.number.trim(),
      complement: formData.complement.trim(),
      neighborhood: selectedDeliveryZone?.name || '',
      city: selectedDeliveryZone?.city || store?.city || '',
      state: selectedDeliveryZone?.state || store?.state || '',
      reference: formData.reference.trim(),
    } : {},
    notes: formData.notes.trim(),
    items: cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      selected_options: item.selected_options || [],
      notes: item.notes || '',
    })),
  })

  const calculateCouponDiscount = (couponData) => {
    if (!couponData) return 0
    if (subtotal < Number(couponData.minimum_order_cents || 0) / 100) return 0
    if (couponData.discount_type === DISCOUNT_TYPES.FREE_SHIPPING) return previewDeliveryFee
    if (couponData.discount_type === DISCOUNT_TYPES.FREE_ITEM) return 0
    if (couponData.discount_type === DISCOUNT_TYPES.PERCENTAGE) return subtotal * (Number(couponData.discount_value || 0) / 100)
    if (couponData.discount_type === DISCOUNT_TYPES.FIXED) return Math.min(Number(couponData.discount_value || 0), subtotal)
    return 0
  }

  const handleApplyCoupon = async (couponToApply = null) => {
    const selectedCoupon = couponToApply || customerCoupons.find(item => (
      String(item.code).toUpperCase() === couponCode.trim().toUpperCase()
    ))

    if (!selectedCoupon && couponCode.trim()) {
      const result = await validateCoupon(couponCode.trim(), subtotal + previewDeliveryFee, formData.whatsapp, previewDeliveryFee)
      if (!result.valid || !result.coupon) {
        toast.error(result.message || 'Cupom nao encontrado')
        return
      }

      applyCoupon(result.coupon, result.discountAmount)
      setCouponCode('')
      toast.success('Cupom aplicado')
      return
    }

    if (!selectedCoupon) {
      toast.error('Cupom nao encontrado')
      return
    }
    applyCoupon(selectedCoupon, calculateCouponDiscount(selectedCoupon))
    setCouponCode('')
    toast.success('Cupom aplicado')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const errorMessage = validateForm()
    if (errorMessage) {
      toast.error(errorMessage)
      return
    }

    setSubmitting(true)
    try {
      const order = await createPublicOrder(buildOrderPayload(), slug)
      const publicOrderReference = order.public_reference || order.public_token || order.id
      clearCart()

      // Pix Mercado Pago — exibe painel de pagamento antes de navegar
      if (order.pix_payment_id && order.pix_qr_code) {
        setMpPixData({
          pix_payment_id:     order.pix_payment_id,
          pix_qr_code:        order.pix_copy_paste || order.pix_qr_code,
          pix_qr_code_base64: order.pix_qr_code_base64,
          pix_ticket_url:     order.pix_ticket_url,
          pix_test_mode:      Boolean(order.pix_test_mode),
          order_id:           publicOrderReference,
        })
        toast.success('Pedido criado! Aguardando pagamento Pix.')
        return
      }

      toast.success('Pedido criado com sucesso')
      navigate(`${basePath}/success/${publicOrderReference}`, { state: { order } })
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel criar o pedido')
    } finally {
      setSubmitting(false)
    }
  }

  if (storeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-white">Carregando checkout...</p>
      </div>
    )
  }

  // Painel de pagamento MP Pix — exibido enquanto aguarda confirmação
  if (mpPixData) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-white">Pague com Pix</h1>
          <MercadoPagoPixPanel
            orderId={mpPixData.order_id}
            qrCode={mpPixData.pix_qr_code}
            qrCodeBase64={mpPixData.pix_qr_code_base64}
            ticketUrl={mpPixData.pix_ticket_url}
            testMode={mpPixData.pix_test_mode}
            onConfirmed={() => navigate(`${basePath}/success/${mpPixData.order_id}`)}
            onCancelled={() => navigate(`${basePath}/cart`)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Finalizar Pedido</h1>
            <p className="mt-2 text-sm text-gray-400">
              Informe seu WhatsApp para buscar seus dados salvos ou preencha um novo cadastro.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate(`${basePath}/menu`)}>
            <ShoppingBag size={18} className="mr-2" />
            Cardapio
          </Button>
        </div>

        {cart.length === 0 && (
          <div className="mb-6 rounded-lg border border-yellow-700 bg-yellow-900/30 p-4 text-yellow-100">
            Seu carrinho esta vazio. Volte ao cardapio para adicionar produtos.
          </div>
        )}

        {storeClosed && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-900/30 p-4 text-red-100">
            {storeClosedMessage}. Nao e possivel fazer pedidos agora.
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── COLUNA ESQUERDA ── */}
          <div className="space-y-6">
            {/* Dados do Cliente */}
            <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Dados do Cliente</h2>
              <div className="space-y-4">
                <div>
                  <Input
                    label="WhatsApp"
                    required
                    placeholder="(00) 00000-0000"
                    value={formData.whatsapp}
                    onChange={(event) => {
                      updateFormData('whatsapp', event.target.value)
                      setLookupStatus('idle')
                      setLookupMessage('')
                      setCustomerProfile(null)
                    }}
                  />
                  {lookupMessage && (
                    <p className={`mt-2 rounded-lg border px-3 py-2 text-sm ${
                      lookupStatus === 'found'
                        ? 'border-green-700 bg-green-900/25 text-green-200'
                        : lookupStatus === 'error'
                          ? 'border-red-700 bg-red-900/25 text-red-200'
                          : 'border-dark-600 bg-dark-900 text-gray-300'
                    }`}>
                      {lookupMessage}
                    </p>
                  )}
                </div>

                <Input
                  label="Nome completo"
                  required
                  value={formData.fullName}
                  onChange={(event) => updateFormData('fullName', event.target.value)}
                />

                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={saveCustomerData}
                    onChange={(event) => setSaveCustomerData(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-dark-700 text-primary-600 focus:ring-primary-500"
                  />
                  Salvar meus dados para proximos pedidos
                </label>
              </div>
            </div>

            {/* Tipo de Pedido */}
            <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Tipo de Pedido</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleOrderTypeChange(ORDER_TYPES.DELIVERY)}
                  className={`rounded-lg border-2 p-4 transition-colors ${formData.orderType === ORDER_TYPES.DELIVERY ? 'border-white bg-gray-700/20' : 'border-dark-600 hover:border-dark-500'}`}
                >
                  <p className="font-semibold text-white">Entrega</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleOrderTypeChange(ORDER_TYPES.PICKUP)}
                  className={`rounded-lg border-2 p-4 transition-colors ${formData.orderType === ORDER_TYPES.PICKUP ? 'border-white bg-gray-700/20' : 'border-dark-600 hover:border-dark-500'}`}
                >
                  <p className="font-semibold text-white">Retirada</p>
                </button>
              </div>

              {formData.orderType === ORDER_TYPES.PICKUP && store?.address && (
                <div className="mt-4 rounded-lg border border-gray-600 bg-gray-700/20 p-4">
                  <p className="mb-1 text-sm text-gray-300">Endereco de retirada:</p>
                  <p className="font-semibold text-white">{store.display_address || store.address}</p>
                </div>
              )}
            </div>

            {/* Endereco de Entrega */}
            {formData.orderType === ORDER_TYPES.DELIVERY && (
              <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
                <h2 className="mb-2 text-xl font-bold text-white">Endereco de Entrega</h2>
                <div className="mb-4 rounded-lg border border-yellow-700 bg-yellow-900/30 p-3 text-sm text-yellow-100">
                  <div className="flex gap-2">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <p>ATENCAO: confira seu endereco antes de finalizar. O pedido sera entregue exatamente no endereco informado.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Enderecos salvos */}
                  {customerProfile?.addresses?.length > 0 && (
                    <div className="rounded-lg border border-dark-600 bg-dark-900 p-3">
                      <p className="mb-3 text-sm font-semibold text-white">Enderecos salvos</p>
                      <div className="space-y-2">
                        {customerProfile.addresses.map((address, index) => (
                          <div
                            key={address.id || index}
                            className="grid grid-cols-[1fr_auto] items-stretch rounded-lg border border-dark-600 transition-colors hover:border-white"
                          >
                            <button
                              type="button"
                              onClick={() => applyLookupAddress(address)}
                              className="min-w-0 p-3 text-left text-sm"
                            >
                              <p className="font-semibold text-white">
                                {address.street || 'Rua nao informada'}, {address.number || 's/n'}
                              </p>
                              <p className="text-gray-400">
                                {address.neighborhood || 'Regiao nao informada'}{address.reference ? ` - Ref.: ${address.reference}` : ''}
                              </p>
                            </button>
                            <button
                              type="button"
                              aria-label="Remover endereco salvo"
                              title="Remover endereco salvo"
                              onClick={() => handleDeleteSavedAddress(address)}
                              disabled={deletingAddressId === address.id}
                              className="flex w-12 items-center justify-center border-l border-dark-600 text-gray-400 transition-colors hover:bg-red-900/30 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Select
                    label="Regiao atendida"
                    options={deliveryZoneOptions}
                    value={selectedDeliveryZoneId}
                    onChange={(event) => setSelectedDeliveryZoneId(event.target.value)}
                  />
                  <Input
                    label="Rua"
                    required
                    value={formData.street}
                    onChange={(event) => updateFormData('street', event.target.value)}
                  />
                  <Input
                    label="Numero"
                    required
                    value={formData.number}
                    onChange={(event) => updateFormData('number', event.target.value)}
                  />
                  <Input
                    label="Complemento"
                    value={formData.complement}
                    onChange={(event) => updateFormData('complement', event.target.value)}
                  />
                  <Input
                    label="Ponto de referencia"
                    value={formData.reference}
                    onChange={(event) => updateFormData('reference', event.target.value)}
                  />

                  {selectedDeliveryZone && (
                    <div className="rounded-lg border border-green-700 bg-green-900/30 p-3 text-green-200">
                      Area encontrada: {selectedDeliveryZone.name}. Taxa de entrega: {formatCurrency(previewDeliveryFee)}.
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          {/* ── COLUNA DIREITA ── */}
          <div className="space-y-6">
            {/* Forma de Pagamento */}
            <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Forma de Pagamento</h2>
              <div className="space-y-3">
                {Object.values(PAYMENT_METHODS).map(method => (
                  <div key={method}>
                    <label
                      className={`flex cursor-pointer items-center rounded-lg border-2 p-4 transition-colors ${formData.paymentMethod === method ? 'border-white bg-gray-700/20' : 'border-dark-600 hover:border-dark-500'}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={formData.paymentMethod === method}
                        onChange={(event) => updateFormData('paymentMethod', event.target.value)}
                        className="mr-3"
                      />
                      <span className="text-white">{PAYMENT_METHOD_LABELS[method]}</span>
                    </label>

                    {/* Troco — apenas quando Dinheiro selecionado */}
                    {method === PAYMENT_METHODS.MONEY && formData.paymentMethod === PAYMENT_METHODS.MONEY && (
                      <div className="mt-2 rounded-lg border border-dark-600 bg-dark-900 p-4">
                        <p className="mb-3 text-sm font-semibold text-white">Precisa de troco?</p>
                        <div className="space-y-3">
                          <label className="flex cursor-pointer items-center gap-3 text-gray-300">
                            <input
                              type="radio"
                              name="needsChange"
                              checked={!formData.needsChange}
                              onChange={() => { updateFormData('needsChange', false); updateFormData('changeFor', '') }}
                            />
                            Nao preciso de troco
                          </label>
                          <label className="flex cursor-pointer items-center gap-3 text-gray-300">
                            <input
                              type="radio"
                              name="needsChange"
                              checked={formData.needsChange}
                              onChange={() => updateFormData('needsChange', true)}
                            />
                            Sim, preciso de troco
                          </label>
                          {formData.needsChange && (
                            <Input
                              label="Troco para quanto?"
                              placeholder="Ex: 50,00"
                              value={formData.changeFor}
                              onChange={(event) => updateFormData('changeFor', event.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* PIX — exibe dados quando selecionado */}
                    {method === PAYMENT_METHODS.PIX && formData.paymentMethod === PAYMENT_METHODS.PIX && (
                      <div className="mt-2 rounded-lg border border-dark-600 bg-dark-900 p-4">
                        {mercadoPagoPixActive ? (
                          <div className="space-y-2 rounded-lg border border-yellow-700/60 bg-yellow-950/25 p-3 text-sm text-yellow-100">
                            <p className="font-semibold">Pix automático Mercado Pago</p>
                            <p>O QR Code e o Pix copia e cola serão gerados depois de confirmar o pedido.</p>
                            <p className="text-xs text-yellow-200/80">Status inicial: Aguardando pagamento.</p>
                          </div>
                        ) : hasPixConfig(store) ? (
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
                              {store?.pix_receiver_city && (
                                <p>Cidade: <span className="text-white">{store.pix_receiver_city}</span></p>
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
                        ) : (
                          <p className="text-sm text-yellow-300">
                            PIX ainda nao foi configurado. A loja vai enviar os dados apos confirmar o pedido.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cupom de Desconto */}
            <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Cupom de Desconto</h2>

              {customerCoupons.length > 0 && (
                <div className="mb-4 rounded-lg border border-dark-600 bg-dark-900 p-3">
                  <p className="mb-3 text-sm font-semibold text-white">Seus cupons disponiveis</p>
                  <div className="space-y-2">
                    {customerCoupons.map((customerCoupon) => {
                      const isApplied = coupon?.code === customerCoupon.code
                      const couponLabel = customerCoupon.discount_type === DISCOUNT_TYPES.FREE_SHIPPING
                        ? 'Frete gratis'
                        : customerCoupon.discount_type === DISCOUNT_TYPES.FREE_ITEM
                          ? `Brinde: ${(customerCoupon.title || customerCoupon.description || 'Item gratis').replace(/^Premio da roleta - /i, '')}`
                          : customerCoupon.discount_type === DISCOUNT_TYPES.PERCENTAGE
                            ? `${Number(customerCoupon.discount_value || 0)}% de desconto`
                            : formatCurrency(Number(customerCoupon.discount_value || 0))

                      return (
                        <button
                          type="button"
                          key={customerCoupon.id || customerCoupon.code}
                          onClick={() => handleApplyCoupon(customerCoupon)}
                          disabled={isApplied}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                            isApplied ? 'border-green-700 bg-green-900/30' : 'border-dark-600 hover:border-white'
                          } disabled:cursor-not-allowed disabled:opacity-70`}
                        >
                          <div className="flex items-center gap-3">
                            <Ticket size={18} className="text-gray-400" />
                            <div>
                              <p className="font-bold text-white">{customerCoupon.code}</p>
                              <p className="text-xs text-gray-400">
                                {couponLabel}
                                {customerCoupon.expires_at
                                  ? ` - vence ${new Date(customerCoupon.expires_at).toLocaleDateString('pt-BR')}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 rounded-lg bg-white px-3 py-1 text-xs font-bold text-black">
                            {isApplied ? 'Aplicado' : 'Usar'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {coupon && (
                <div className="mb-4 rounded-lg border border-green-700 bg-green-900/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-green-300">{coupon.code}</p>
                      <p className="text-sm text-green-200">
                        {coupon.discount_type === DISCOUNT_TYPES.FREE_SHIPPING
                          ? 'Frete gratis'
                          : coupon.discount_type === DISCOUNT_TYPES.FREE_ITEM
                            ? `Brinde: ${(coupon.title || coupon.description || 'Item gratis').replace(/^Premio da roleta - /i, '')}`
                            : coupon.discount_type === DISCOUNT_TYPES.PERCENTAGE
                              ? `${coupon.discount_value}% de desconto`
                              : `${formatCurrency(Number(coupon.discount_value || 0))} de desconto`}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => { removeCoupon(); toast.success('Cupom removido') }}>
                      Remover
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Digite o codigo do cupom"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                />
                <Button type="button" onClick={() => handleApplyCoupon()}>
                  Aplicar
                </Button>
              </div>
            </div>

            {/* Resumo do Pedido */}
            <div className="rounded-xl border border-dark-600 bg-dark-800 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Resumo do Pedido</h2>
              <div className="mb-4 space-y-3">
                {cart.map((item, index) => (
                  <div key={`${item.product_id}-${index}`} className="flex justify-between gap-3 text-sm">
                    <div className="text-gray-400">
                      <p>{item.quantity}x {item.product_name}</p>
                      <SelectedOptionsSummary selectedOptions={item.selected_options} />
                    </div>
                    <span className="text-white">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-dark-600 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">{formatCurrency(subtotal)}</span>
                </div>
                {formData.orderType === ORDER_TYPES.DELIVERY && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Taxa de entrega</span>
                    <span className="text-white">{formatCurrency(previewDeliveryFee)}</span>
                  </div>
                )}
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>{hasFreeShippingCoupon ? `Frete gratis (${coupon?.code})` : `Desconto (${coupon?.code})`}</span>
                    <span>-{formatCurrency(effectiveDiscount)}</span>
                  </div>
                )}
                {hasFreeItemCoupon && (
                  <div className="flex justify-between gap-3 text-green-400">
                    <span>Brinde ({coupon?.code})</span>
                    <span className="text-right text-sm">
                      {(coupon.title || coupon.description || 'Item gratis').replace(/^Premio da roleta - /i, '')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dark-600 pt-2 text-xl font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-white">{formatCurrency(previewTotal)}</span>
                </div>
                {formData.paymentMethod === PAYMENT_METHODS.MONEY && (
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Troco</span>
                    <span>
                      {formData.needsChange
                        ? `Para ${formatCurrency(Number(String(formData.changeFor).replace(',', '.') || 0))}`
                        : 'Nao precisa'}
                    </span>
                  </div>
                )}
                <p className="rounded-lg border border-dark-600 bg-dark-900 p-3 text-xs text-gray-400">
                  O total exibido e uma previa. O servidor recalcula produtos, adicionais, entrega e descontos antes de gravar o pedido.
                </p>
              </div>
            </div>

            <Textarea
              label="Observacoes do pedido"
              placeholder="Alguma observacao especial?"
              value={formData.notes}
              onChange={(event) => updateFormData('notes', event.target.value)}
              rows={3}
            />

            <Button
              type="submit"
              size="lg"
              loading={submitting}
              disabled={cart.length === 0 || storeClosed}
              className="w-full"
            >
              Confirmar Pedido
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Checkout
