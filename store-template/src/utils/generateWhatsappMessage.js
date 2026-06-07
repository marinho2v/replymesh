import {
  buildItemsText,
  buildTemplateContext,
  buildWheelSpinNotice,
  formatPaymentForDelivery,
  formatMoneyBRL,
  removeExternalOrderIdentifiers,
  renderWhatsappTemplate,
} from './whatsappTemplates'

export const buildWhatsappMessageFromTemplate = (template, order, items, store = {}) => {
  if (!order) return ''

  const context = buildTemplateContext({ order, items, store })
  const renderedTemplate = renderWhatsappTemplate(template || '', context)
  const itemsText = buildItemsText(items || order.order_items || [])

  let message = `*Cliente:* ${order.customer_name || 'Cliente'}\n`
  if (order.customer_whatsapp || order.customer_phone) {
    message += `*WhatsApp:* ${order.customer_whatsapp || order.customer_phone}\n`
  }
  message += '\n'

  if (itemsText) {
    message += `*Itens do Pedido:*\n${itemsText}\n\n`
  }

  message += '*Resumo:*\n'
  message += `Subtotal: R$ ${formatMoneyBRL(order.subtotal)}\n`
  if ((order.discount_amount || 0) > 0) {
    message += `Desconto: -R$ ${formatMoneyBRL(order.discount_amount)}\n`
  }
  message += `Taxa de Entrega: R$ ${formatMoneyBRL(order.delivery_fee)}\n`
  message += `*Total: R$ ${formatMoneyBRL(order.total)}*\n\n`

  message += `*Forma de Pagamento:* ${formatPaymentForDelivery(order)}\n`

  if (order.payment_method === 'money' && order.change_for) {
    message += `Troco para: R$ ${formatMoneyBRL(order.change_for)}\n`
  }

  if (order.order_type === 'delivery') {
    message += '\n*Endereco de Entrega:*\n'
    const street = order.delivery_street || order.street
    const number = order.delivery_number || order.number
    const complement = order.delivery_complement || order.complement
    const neighborhood = order.delivery_neighborhood || order.neighborhood
    const reference = order.delivery_reference || order.reference

    if (street && number) {
      message += `${street}, ${number}\n`
    }
    if (complement) message += `Complemento: ${complement}\n`
    if (neighborhood) message += `Bairro: ${neighborhood}\n`
    if (reference) message += `Referencia: ${reference}\n`
  } else {
    message += '\n*Retirada no local*\n'
  }

  if (order.notes) {
    message += `\n*Observacoes:* ${order.notes}\n`
  }

  if (renderedTemplate) {
    message += `\n\n${renderedTemplate}`
  }

  return removeExternalOrderIdentifiers(message)
}

export const buildTemplateOnlyMessage = (template, order, items, store = {}, motoboy = {}) => {
  const context = buildTemplateContext({ order, items, store, motoboy })
  const rendered = renderWhatsappTemplate(template || '', context)
  const wheelNotice = order?.status === 'completed' ? buildWheelSpinNotice(order) : ''
  const shouldAppendWheelNotice = wheelNotice && !/roleta/i.test(rendered)

  return removeExternalOrderIdentifiers([
    rendered,
    shouldAppendWheelNotice ? wheelNotice : '',
  ].filter(Boolean).join('\n\n'))
}

export const openWhatsAppWithTemplate = (order, items, template, phoneNumber, store = {}) => {
  const message = buildWhatsappMessageFromTemplate(template, order, items, store)
  return openWhatsAppMessage(phoneNumber, message)
}

export const buildWhatsAppUrl = (phoneNumber, message) => {
  if (!phoneNumber) return null

  const digits = String(phoneNumber).replace(/\D/g, '')
  if (!digits) return null

  const formattedPhone = digits.startsWith('55') && digits.length >= 12
    ? digits
    : `55${digits}`

  const cleanMessage = removeExternalOrderIdentifiers(message)
  const encodedMessage = encodeURIComponent(cleanMessage)

  console.log('[whatsapp-url] mensagem antes do encode:', cleanMessage)
  console.log('[whatsapp-url] url gerada para telefone:', formattedPhone)

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

const isMobileBrowser = () => {
  if (typeof navigator === 'undefined') return false

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
}

export const openWhatsAppMessage = (phoneNumber, message) => {
  const url = buildWhatsAppUrl(phoneNumber, message)
  if (!url) {
    console.error('WhatsApp number is invalid')
    return false
  }

  if (isMobileBrowser()) {
    window.location.href = url
    return true
  }

  window.open(url, '_blank')
  return true
}
