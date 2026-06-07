import {
  buildItemsText,
  buildTemplateContext,
  formatMoneyBRL,
  removeExternalOrderIdentifiers,
  renderWhatsappTemplate,
} from '../utils/whatsappTemplates'

export const formatPhoneNumber = (phone = '') => {
  const cleaned = String(phone || '').replace(/\D/g, '')

  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    return cleaned
  }

  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`
  }

  return cleaned
}

export const buildWhatsAppUrl = (phone, message) => {
  const formattedPhone = formatPhoneNumber(phone)
  if (!formattedPhone) return null

  const cleanMessage = removeExternalOrderIdentifiers(message)
  const encodedMessage = encodeURIComponent(cleanMessage)

  console.log('[whatsapp-service] mensagem antes do encode:', cleanMessage)
  console.log('[whatsapp-service] url gerada para telefone:', formattedPhone)

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

export const buildWhatsAppLinks = (phone, message) => {
  const formattedPhone = formatPhoneNumber(phone)
  if (!formattedPhone) return null

  const cleanMessage = removeExternalOrderIdentifiers(message)
  const encodedMessage = encodeURIComponent(cleanMessage)

  return {
    phone: formattedPhone,
    message: cleanMessage,
    normal: `whatsapp://send?phone=${formattedPhone}&text=${encodedMessage}`,
    business: `whatsapp-business://send?phone=${formattedPhone}&text=${encodedMessage}`,
    web: `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`,
    waMe: `https://wa.me/${formattedPhone}?text=${encodedMessage}`,
  }
}

const isMobileBrowser = () => {
  if (typeof navigator === 'undefined') return false

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
}

export const openWhatsApp = (phone, message) => {
  const url = buildWhatsAppUrl(phone, message)
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

export const generateOrderMessage = (order, template, storeSettings) => {
  const items = order.order_items || []
  const context = buildTemplateContext({ order, items, store: storeSettings })
  const renderedTemplate = renderWhatsappTemplate(template || '', context)
  const itemsText = buildItemsText(items)

  let message = `*Cliente:* ${order.customer_name || 'Cliente'}\n`
  message += `*WhatsApp:* ${order.customer_whatsapp || order.customer_phone || ''}\n\n`

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

  message += `*Forma de Pagamento:* ${context.forma_pagamento}\n`

  if (order.payment_method === 'money' && order.change_for) {
    message += `Troco para: R$ ${formatMoneyBRL(order.change_for)}\n`
  }

  if (order.order_type === 'delivery') {
    message += '\n*Endereco de Entrega:*\n'
    if (order.street || order.number) message += `${order.street || ''}, ${order.number || ''}\n`
    if (order.complement) message += `Complemento: ${order.complement}\n`
    if (order.neighborhood) message += `Bairro: ${order.neighborhood}\n`
    if (order.reference) message += `Referencia: ${order.reference}\n`
  } else {
    message += '\n*Retirada no local*\n'
  }

  if (order.notes) {
    message += `\n*Observacoes:* ${order.notes}\n`
  }

  if (renderedTemplate) {
    message += `\n\n${renderedTemplate}`
  }

  if (storeSettings?.store_name) {
    message += `\n\n${storeSettings.store_name}`
  }

  return removeExternalOrderIdentifiers(message)
}
