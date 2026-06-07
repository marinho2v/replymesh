import { COMPANY_SLUG, centsToCurrency, currentStoreCompanySlug, request } from './replymeshApi'
import { normalizePhone } from './customers'
import { STORE_COMPANY_ID } from './storeApi'

const currentCompanyId = () => localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID
const storeHeaders = () => (currentCompanyId() ? { 'X-Company-Id': currentCompanyId() } : {})
const publicPath = (path, slug = currentStoreCompanySlug()) => `/public/${encodeURIComponent(slug || COMPANY_SLUG)}${path}`
const toCents = (value) => Math.round(Number(value || 0) * 100)

const normalizePrize = (prize = {}) => ({
  ...prize,
  discount_value: Number(prize.discount_value || 0),
  probability_weight: Number(prize.probability_weight || 0),
  coupon_valid_days: Number(prize.coupon_valid_days || 7),
  minimum_order_amount: prize.minimum_order_amount ?? centsToCurrency(prize.minimum_order_cents),
  max_total_wins: prize.max_total_wins ?? null,
  current_wins: Number(prize.current_wins || 0),
})

const normalizeSpin = (spin = {}) => ({
  ...spin,
  customer_name: spin.customer_name || spin.customer?.full_name || spin.customer?.name,
  customer_phone: spin.customer_phone || spin.customer?.phone,
  prize_name: spin.prize_name || spin.prize?.name,
  prize_type: spin.prize_type || spin.prize?.prize_type,
  coupon_code: spin.coupon_code || spin.coupon?.code,
  coupon_used_count: spin.coupon_used_count ?? spin.coupon?.used_count,
  coupon_is_active: spin.coupon_is_active ?? spin.coupon?.is_active,
  order_number: spin.order_number || spin.order?.order_number,
})

const normalizePrizePayload = (prizeData) => ({
  name: String(prizeData.name || '').trim(),
  description: String(prizeData.description || '').trim() || null,
  prize_type: prizeData.prize_type,
  discount_value: Number(prizeData.discount_value || 0),
  probability_weight: Number(prizeData.probability_weight || 0),
  coupon_valid_days: Number(prizeData.coupon_valid_days || 1),
  minimum_order_cents: prizeData.minimum_order_cents ?? toCents(prizeData.minimum_order_amount),
  max_total_wins: prizeData.max_total_wins === '' || prizeData.max_total_wins === null
    ? null
    : Number(prizeData.max_total_wins),
  badge: String(prizeData.badge || prizeData.name || '').trim(),
  color: String(prizeData.color || '#6b7280').trim(),
  sort_order: Number(prizeData.sort_order || 0),
  is_active: Boolean(prizeData.is_active),
})

export const spinCustomerWheel = async (phone, slug) => {
  const payload = await request(publicPath('/wheel/spin', slug), {
    method: 'POST',
    token: null,
    body: { phone: normalizePhone(phone) },
  })

  return {
    ...payload,
    prize: payload.prize ? normalizePrize(payload.prize) : null,
  }
}

export const getWheelPrizes = async (slug) => {
  const payload = await request(publicPath('/wheel/prizes', slug), { token: null })
  return (payload.prizes || []).map(normalizePrize)
}

export const getAdminWheelSummary = async () => {
  const payload = await request('/store/wheel/summary', { headers: storeHeaders() })
  return {
    ...payload,
    prizes: (payload.prizes || []).map(normalizePrize),
    recent_spins: (payload.recent_spins || []).map(normalizeSpin),
  }
}

export const getAdminWheelSpinHistory = async (filters = {}) => {
  const payload = await request('/store/wheel/spins', {
    params: {
      startDate: filters.startDate || null,
      endDate: filters.endDate || null,
      search: filters.search || null,
      prizeId: filters.prizeId || null,
      status: filters.status || null,
      limit: Number(filters.limit || 200),
    },
    headers: storeHeaders(),
  })

  return Array.isArray(payload.spins) ? payload.spins.map(normalizeSpin) : []
}

export const updateWheelPrize = async (prizeId, prizeData) => {
  const payload = await request(`/store/wheel_prizes/${encodeURIComponent(prizeId)}`, {
    method: 'PATCH',
    headers: storeHeaders(),
    body: { wheel_prize: normalizePrizePayload(prizeData) },
  })
  return normalizePrize(payload.prize || {})
}

export const createWheelPrize = async (prizeData) => {
  const payload = await request('/store/wheel_prizes', {
    method: 'POST',
    headers: storeHeaders(),
    body: { wheel_prize: normalizePrizePayload(prizeData) },
  })
  return normalizePrize(payload.prize || {})
}
