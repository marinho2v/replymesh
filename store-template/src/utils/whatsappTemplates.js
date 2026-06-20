import { PAYMENT_METHOD_LABELS } from '../lib/constants'
import { formatSelectedOptions } from './productOptions'

export const WHATSAPP_TEMPLATE_TYPES = [
  { value: 'order_accepted', label: 'Pedido aceito' },
  { value: 'order_preparing', label: 'Pedido em preparo' },
  { value: 'order_ready', label: 'Pedido pronto' },
  { value: 'order_out_for_delivery', label: 'Saiu para entrega' },
  { value: 'order_completed', label: 'Pedido finalizado' },
  { value: 'order_delivered', label: 'Pedido entregue' },
  { value: 'order_canceled', label: 'Pedido cancelado' },
  { value: 'motoboy_assigned', label: 'Mensagem para motoboy' },
  { value: 'store_closed', label: 'Loja fechada' },
  { value: 'custom', label: 'Personalizado' },
]

export const WHATSAPP_VARIABLES = [
  { key: 'nome_cliente', label: 'Nome do cliente' },
  { key: 'cliente', label: 'Nome do cliente (atalho)' },
  { key: 'telefone_cliente', label: 'Telefone do cliente' },
  { key: 'status_pedido', label: 'Status do pedido' },
  { key: 'valor_total', label: 'Valor total' },
  { key: 'total', label: 'Valor total (atalho)' },
  { key: 'forma_pagamento', label: 'Forma de pagamento' },
  { key: 'endereco', label: 'Endereco completo' },
  { key: 'referencia', label: 'Referencia' },
  { key: 'observacoes', label: 'Observacoes do pedido' },
  { key: 'nome_loja', label: 'Nome da loja' },
  { key: 'telefone_loja', label: 'Telefone da loja' },
  { key: 'nome_motoboy', label: 'Nome do motoboy' },
  { key: 'telefone_motoboy', label: 'Telefone do motoboy' },
  { key: 'link_maps', label: 'Link Google Maps' },
  { key: 'link_waze', label: 'Link Waze' },
  { key: 'horario_funcionamento', label: 'Horario de funcionamento' },
  { key: 'giros_roleta', label: 'Giros ganhos na roleta' },
  { key: 'aviso_roleta', label: 'Aviso automatico da roleta' },
]

export const formatMoneyBRL = (value) => (
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
)

export const cleanMessageText = (message = '') => (
  String(message || '')
    .replace(/S\uFFFDo Gon\uFFFDao/gi, 'Sao Goncalo')
    .replace(/S\uFFFDo/gi, 'Sao')
    .replace(/Gon\uFFFDao/gi, 'Goncalo')
    .replace(/\uFFFD/g, '')
    .replace(/ðŸš€/g, '\u{1F680}')
    .replace(/ðŸ›’/g, '\u{1F6D2}')
    .replace(/ðŸ‘¤/g, '\u{1F464}')
    .replace(/ðŸ“±/g, '\u{1F4F1}')
    .replace(/ðŸ“¦/g, '\u{1F4E6}')
    .replace(/ðŸ’°/g, '\u{1F4B0}')
    .replace(/ðŸ’³/g, '\u{1F4B3}')
    .replace(/ðŸ“/g, '\u{1F4CD}')
    .replace(/ðŸ“/g, '\u{1F4DD}')
    .replace(/CartÃ£o/g, 'Cartao')
    .replace(/EndereÃ§o/g, 'Endereco')
    .replace(/ReferÃªncia/g, 'Referencia')
    .replace(/ObservaÃ§Ãµes/g, 'Observacoes')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
)

export const removeExternalOrderIdentifiers = (message = '') => (
  cleanMessageText(message)
    .replace(/#\{\s*(?:numero_pedido|pedido|order_number|order_id|pedido_id|id)\s*\}/gi, '')
    .replace(/\{\{?\s*(?:numero_pedido|pedido|order_number|order_id|pedido_id|id)\s*\}?\}/gi, '')
    .replace(/\bSeu pedido\s*(?:n[ºo.]?|#|:)?\s*\d+\b/gi, 'Seu pedido')
    .replace(/\bPedido\s*(?:n[ºo.]?|#|:)?\s*\d+\b/gi, 'Pedido')
    .replace(/\bPedido\s*(?:n[ºo.]?|#|:)\s*$/gim, 'Pedido')
    .replace(/^\s*Pedido\s*$/gim, '')
    .replace(/[ \t]+([,.!?:;])/g, '$1')
    .replace(/\s+#/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
)

export const processTemplate = (template = '', data = {}, { keepMissing = false } = {}) => {
  const normalizedData = Object.entries(data || {}).reduce((acc, [key, value]) => {
    acc[String(key).trim()] = value
    return acc
  }, {})

  const original = removeExternalOrderIdentifiers(template)
  const finalMessage = removeExternalOrderIdentifiers(original.replace(/\{\{?\s*([a-zA-Z0-9_]+)\s*\}?\}/g, (match, rawKey) => {
    const key = String(rawKey || '').trim()
    const value = normalizedData[key]
    if (value === undefined || value === null) return keepMissing ? match : ''
    return String(value)
  }))

  console.log('[whatsapp-template] original:', original)
  console.log('[whatsapp-template] data:', normalizedData)
  console.log('[whatsapp-template] final:', finalMessage)

  return finalMessage
}

export const normalizeTemplate = (template = {}) => ({
  ...template,
  key: template.key || template.template_key,
  name: template.name || template.title || template.key || template.template_key || 'Template',
  type: template.type || template.key || template.template_key || 'custom',
  content: template.content || template.message || '',
  active: template.active !== undefined ? template.active !== false : template.enabled !== false,
})

export const buildAddress = (order = {}) => {
  const line = [
    order.delivery_street || order.street,
    order.delivery_number || order.number,
    order.delivery_complement || order.complement,
    order.delivery_neighborhood || order.neighborhood,
    (order.delivery_city || order.city) && (order.delivery_state || order.state)
      ? `${order.delivery_city || order.city} - ${order.delivery_state || order.state}`
      : order.delivery_city || order.delivery_state || order.city || order.state,
    order.delivery_cep || order.zip_code,
  ].filter(Boolean)

  return line.join(', ')
}

export const buildNavigationLinks = (order = {}) => {
  if (order.google_maps_url || order.waze_url) {
    return {
      maps: order.google_maps_url || '',
      waze: order.waze_url || '',
    }
  }

  const latitude = Number(order.delivery_latitude)
  const longitude = Number(order.delivery_longitude)

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return {
      maps: `https://www.google.com/maps?q=${latitude},${longitude}`,
      waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
    }
  }

  const address = buildAddress(order)
  const encodedAddress = encodeURIComponent(address)

  return {
    maps: address ? `https://www.google.com/maps/search/?api=1&query=${encodedAddress}` : '',
    waze: address ? `https://waze.com/ul?q=${encodedAddress}&navigate=yes` : '',
  }
}

export const formatPaymentForDelivery = (order = {}) => {
  if (order.payment_method === 'pix_online' && order.payment_status === 'paid') {
    return 'Pix online - ja pago'
  }

  const labels = {
    pix_delivery: 'Pix na entrega',
    pix: 'Pix na entrega',
    card_delivery: 'Cartao na entrega',
    card_on_delivery: 'Cartao na entrega',
    cash: 'Dinheiro',
    money: 'Dinheiro',
  }

  return labels[order.payment_method] || PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method || ''
}

export const buildItemsText = (items = []) => (
  (items || [])
    .map(item => {
      const name = item.product_name || item.name || item.products?.name || 'Produto'
      const optionsText = formatSelectedOptions(item.selected_options)
        .map(line => `  ${line}`)
        .join('\n')
      return [
        `${item.quantity || 1}x ${name} - R$ ${formatMoneyBRL(item.total_price || item.price || 0)}`,
        optionsText,
      ].filter(Boolean).join('\n')
    })
    .join('\n')
)

export const getWheelSpinCountForOrder = (order = {}) => {
  const subtotal = Number(
    order.subtotal ?? Math.max(Number(order.total || 0) - Number(order.delivery_fee || 0), 0)
  )

  if (!Number.isFinite(subtotal) || subtotal < 25) return 0
  return Math.floor(subtotal / 25)
}

export const buildWheelSpinNotice = (order = {}) => {
  const spins = getWheelSpinCountForOrder(order)
  if (spins <= 0) return ''

  return [
    `Voce ganhou ${spins} ${spins === 1 ? 'giro' : 'giros'} na roleta de premios!`,
    '',
    'Acesse o site da loja e use seus giros.',
    '',
    'Os cupons da roleta sao validos por 7 dias.',
  ].join('\n')
}

export const buildTemplateContext = ({ order = {}, items = [], store = {}, motoboy = {} } = {}) => {
  const links = buildNavigationLinks(order)
  const customerName = order.customer_name || 'Cliente'
  const customerPhone = order.customer_phone || order.customer_whatsapp || ''
  const paymentMethod = formatPaymentForDelivery(order)
  const total = formatMoneyBRL(order.total)
  const subtotal = formatMoneyBRL(order.subtotal)
  const deliveryFee = formatMoneyBRL(order.delivery_fee)
  const discount = formatMoneyBRL(order.discount_amount)
  const address = buildAddress(order)
  const itemsText = buildItemsText(items.length ? items : order.order_items || [])
  const wheelSpins = getWheelSpinCountForOrder(order)
  const wheelNotice = buildWheelSpinNotice(order)
  const statusLabels = {
    pending: 'Pedido recebido',
    accepted: 'Aceito',
    preparing: 'Em preparo',
    ready: 'Pronto',
    out_for_delivery: 'Saiu para entrega',
    completed: 'Finalizado',
    cancelled: 'Cancelado',
  }

  return {
    nome_cliente: customerName,
    cliente: customerName,
    telefone_cliente: customerPhone,
    telefone: customerPhone,
    numero_pedido: '',
    pedido: '',
    order_number: '',
    order_id: '',
    pedido_id: '',
    id: '',
    status_pedido: statusLabels[order.status] || order.status || '',
    status: statusLabels[order.status] || order.status || '',
    valor_total: total,
    total,
    subtotal,
    taxa_entrega: deliveryFee,
    desconto: discount,
    cupom: order.coupon_code || '',
    itens: itemsText,
    endereco: address,
    bairro: order.delivery_neighborhood || order.neighborhood || '',
    referencia: order.delivery_reference || order.reference || '',
    reference: order.delivery_reference || order.reference || '',
    observacoes: order.notes || '',
    obs: order.notes || '',
    forma_pagamento: paymentMethod,
    pagamento: paymentMethod,
    nome_loja: store.store_name || store.name || '',
    telefone_loja: store.phone || store.whatsapp || store.whatsapp_number || '',
    nome_motoboy: motoboy.name || '',
    motoboy: motoboy.name || '',
    telefone_motoboy: motoboy.phone || '',
    link_maps: links.maps,
    link_waze: links.waze,
    horario_funcionamento: store.business_hours_text || '',
    giros: wheelSpins,
    giros_roleta: wheelSpins,
    aviso_roleta: wheelNotice,
  }
}

export const renderWhatsappTemplate = (content = '', context = {}) => (
  processTemplate(content, context)
)

export const buildMockTemplateContext = () => buildTemplateContext({
  order: {
    order_number: 123,
    customer_name: 'Wesley Marinho',
    customer_phone: '21999999999',
    status: 'accepted',
    total: 35.9,
    subtotal: 32,
    delivery_fee: 3.9,
    discount_amount: 0,
    street: 'Rua Exemplo',
    number: '100',
    complement: 'Casa 2',
    neighborhood: 'Centro',
    city: 'Sao Goncalo',
    state: 'RJ',
    reference: 'Proximo a padaria',
    payment_method: 'pix',
    notes: 'Sem cebola',
  },
  items: [
    { quantity: 1, product_name: 'Hamburguer', total_price: 25.9 },
    { quantity: 1, product_name: 'Refrigerante', total_price: 10 },
  ],
  store: {
    store_name: 'Demo Store',
    whatsapp_number: '',
    business_hours_text: 'Segunda a sabado, 18:00 as 23:00',
  },
  motoboy: {
    name: 'Carlos Entregas',
    phone: '21988888888',
  },
})

export const buildDefaultMotoboyTemplate = () => [
  `Nova entrega ${'\u{1F680}'}`,
  'Cliente: {nome_cliente}',
  'Telefone: {telefone_cliente}',
  'Endereco: {endereco}',
  'Referencia: {referencia}',
  'Pagamento: {forma_pagamento}',
  'Valor: R$ {valor_total}',
  '',
  'Google Maps',
  '{link_maps}',
  '',
  'Waze',
  '{link_waze}',
  '',
  'Observacoes',
  '{observacoes}',
].join('\n')

const shouldUseMotoboyDefaultTemplate = (templateContent) => {
  const content = cleanMessageText(templateContent)
  if (!content) return true

  return (
    content.includes('Pedido: #{numero_pedido}') ||
    content.includes('Pedido #{numero_pedido}') ||
    content.includes('{numero_pedido}') ||
    content.includes('{pedido}') ||
    content.includes('{order_number}') ||
    content.includes('{order_id}') ||
    (!content.includes('{forma_pagamento}') && !content.includes('{pagamento}'))
  )
}

export const buildMotoboyDeliveryMessage = (order, motoboy, templateContent, store) => {
  const context = buildTemplateContext({ order, motoboy, store })
  const template = shouldUseMotoboyDefaultTemplate(templateContent)
    ? buildDefaultMotoboyTemplate()
    : templateContent

  return removeExternalOrderIdentifiers(renderWhatsappTemplate(template, context))
}

export const buildMotoboyMessage = buildMotoboyDeliveryMessage
