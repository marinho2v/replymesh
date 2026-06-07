import { COMPANY_SLUG, centsToCurrency, request } from './replymeshApi'

const publicPath = (slug, path) => `/public/${encodeURIComponent(slug || COMPANY_SLUG)}${path}`

export const getQrTableContext = async (qrToken, companySlug = COMPANY_SLUG) => {
  const payload = await request(publicPath(companySlug, `/tables/qr/${encodeURIComponent(qrToken)}`), { token: null })
  return payload
}

export const openQrTableSession = async ({ qrToken, customerName, companySlug = COMPANY_SLUG }) => {
  const payload = await request(publicPath(companySlug, `/tables/qr/${encodeURIComponent(qrToken)}/session`), {
    method: 'POST',
    token: null,
    body: { customer_name: customerName },
  })
  return payload
}

export const createQrTableOrder = async ({ qrToken, sessionId, items, notes, companySlug = COMPANY_SLUG }) => {
  const payload = await request(publicPath(companySlug, `/tables/qr/${encodeURIComponent(qrToken)}/orders`), {
    method: 'POST',
    token: null,
    body: {
      session_id: sessionId,
      notes: notes || null,
      items: (items || []).map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity || 1),
        notes: item.notes || null,
      })),
    },
  })
  return payload
}

export const getQrTableOrders = async (sessionId, { qrToken, companySlug = COMPANY_SLUG } = {}) => {
  if (!qrToken) return { success: true, orders: [], session: { id: sessionId } }

  const payload = await request(publicPath(companySlug, `/tables/qr/${encodeURIComponent(qrToken)}/orders`), { token: null })
  return {
    ...payload,
    orders: (payload.orders || []).map((order) => ({
      ...order,
      total: order.total ?? centsToCurrency(order.total_cents),
    })),
  }
}
