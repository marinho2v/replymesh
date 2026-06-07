import { COMPANY_SLUG, centsToCurrency, request } from './replymeshApi'
import { normalizePhone } from './customers'
import { STORE_COMPANY_ID } from './storeApi'

const currentCompanyId = () => localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID
const storeHeaders = () => (currentCompanyId() ? { 'X-Company-Id': currentCompanyId() } : {})
const publicPath = (path) => `/public/${encodeURIComponent(COMPANY_SLUG)}${path}`
const toCents = (value) => Math.round(Number(value || 0) * 100)

const normalizeCoupon = (coupon = {}) => ({
  ...coupon,
  discount_value: Number(coupon.discount_value || 0),
  minimum_order_amount: coupon.minimum_order_amount ?? centsToCurrency(coupon.minimum_order_cents),
  applies_to_all: true,
})

const couponToRails = (couponData = {}, { partial = false } = {}) => {
  const coupon = {}

  if (!partial || couponData.code !== undefined) coupon.code = String(couponData.code || '').trim().toUpperCase()
  if (!partial || couponData.title !== undefined) coupon.title = couponData.title || couponData.code || 'Cupom'
  if (!partial || couponData.description !== undefined) coupon.description = couponData.description || null
  if (!partial || couponData.discount_type !== undefined) coupon.discount_type = couponData.discount_type
  if (!partial || couponData.discount_value !== undefined) coupon.discount_value = Number(couponData.discount_value || 0)
  if (!partial || couponData.minimum_order_amount !== undefined || couponData.minimum_order_cents !== undefined) {
    coupon.minimum_order_cents = couponData.minimum_order_cents ?? toCents(couponData.minimum_order_amount)
  }
  if (!partial || couponData.max_uses !== undefined) coupon.max_uses = couponData.max_uses === '' ? null : couponData.max_uses
  if (!partial || couponData.starts_at !== undefined) coupon.starts_at = couponData.starts_at || null
  if (!partial || couponData.expires_at !== undefined) coupon.expires_at = couponData.expires_at || null
  if (!partial || couponData.is_active !== undefined) coupon.is_active = couponData.is_active !== false
  if (!partial || couponData.is_single_use_per_customer !== undefined) {
    coupon.is_single_use_per_customer = Boolean(couponData.is_single_use_per_customer)
  }

  return coupon
}

export const getCoupons = async (activeOnly = true, source = null) => {
  const payload = await request('/store/coupons', {
    params: {
      ...(activeOnly ? { active: 'true' } : {}),
      ...(source ? { source } : {}),
    },
    headers: storeHeaders(),
  })
  return (payload.coupons || []).map(normalizeCoupon)
}

export const getCouponByCode = async (code) => {
  const coupons = await getCoupons(true)
  return coupons.find(coupon => String(coupon.code).toUpperCase() === String(code).toUpperCase()) || null
}

export const getCouponById = async (couponId) => {
  const payload = await request(`/store/coupons/${encodeURIComponent(couponId)}`, {
    headers: storeHeaders(),
  })
  return normalizeCoupon(payload.coupon || {})
}

export const createCoupon = async (couponData) => {
  const payload = await request('/store/coupons', {
    method: 'POST',
    headers: storeHeaders(),
    body: { coupon: couponToRails(couponData) },
  })
  return normalizeCoupon(payload.coupon || {})
}

export const updateCoupon = async (couponId, couponData) => {
  const payload = await request(`/store/coupons/${encodeURIComponent(couponId)}`, {
    method: 'PATCH',
    headers: storeHeaders(),
    body: { coupon: couponToRails(couponData, { partial: true }) },
  })
  return normalizeCoupon(payload.coupon || {})
}

export const deleteCoupon = async (couponId) => {
  await request(`/store/coupons/${encodeURIComponent(couponId)}`, {
    method: 'DELETE',
    headers: storeHeaders(),
  })
  return true
}

export const validateCoupon = async (code, orderTotal, customerPhone, deliveryFee = 0) => {
  try {
    const payload = await request(publicPath('/coupons/validate'), {
      method: 'POST',
      token: null,
      body: {
        code,
        order_total: Number(orderTotal || 0),
        customer_phone: normalizePhone(customerPhone),
        delivery_fee: Number(deliveryFee || 0),
      },
    })

    return {
      valid: Boolean(payload.valid),
      message: payload.message,
      coupon: payload.coupon ? normalizeCoupon(payload.coupon) : null,
      discountAmount: Number(payload.discountAmount || 0),
    }
  } catch (error) {
    console.error('Error validating coupon:', error)
    return { valid: false, message: 'Erro ao validar cupom' }
  }
}
