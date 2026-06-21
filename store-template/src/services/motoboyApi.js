import { REPLYMESH_API_URL, ReplymeshApiError, request } from './replymeshApi'

const TOKEN_KEY = 'replymesh_motoboy_token'
const PROFILE_KEY = 'replymesh_motoboy_profile'
const COMPANY_KEY = 'replymesh_motoboy_company'
const COMPANY_SLUG_KEY = 'replymesh_motoboy_company_slug'

const currentMotoboySlug = () => (
  localStorage.getItem(COMPANY_SLUG_KEY) ||
  localStorage.getItem('replymesh_store_company_slug') ||
  'default'
)

const tenantKey = (suffix, slug = currentMotoboySlug()) => `replymesh:motoboy:${slug}:${suffix}`

export const getMotoboyToken = () => (
  localStorage.getItem(tenantKey('token')) || localStorage.getItem(TOKEN_KEY)
)

export const getStoredMotoboyProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(tenantKey('profile')) || localStorage.getItem(PROFILE_KEY) || 'null')
  } catch {
    return null
  }
}

export const getStoredMotoboyCompany = () => {
  try {
    return JSON.parse(localStorage.getItem(tenantKey('company')) || localStorage.getItem(COMPANY_KEY) || 'null')
  } catch {
    return null
  }
}

export const motoboyLogout = () => {
  const slug = currentMotoboySlug()
  localStorage.removeItem(tenantKey('token', slug))
  localStorage.removeItem(tenantKey('profile', slug))
  localStorage.removeItem(tenantKey('company', slug))
  localStorage.removeItem(COMPANY_SLUG_KEY)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(PROFILE_KEY)
  localStorage.removeItem(COMPANY_KEY)
}

export const motoboyLogin = async ({ phone, password, companySlug }) => {
  const response = await fetch(`${REPLYMESH_API_URL}/motoboy/auth/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth: {
        phone,
        password,
        company_slug: companySlug,
      },
    }),
  })

  const payload = await response.json()
  if (!response.ok || payload?.success === false) {
    throw new ReplymeshApiError(payload?.message || payload?.error || 'Telefone ou senha invalidos', {
      status: response.status,
      payload,
    })
  }

  const resolvedSlug = payload.company?.slug || companySlug || 'default'
  localStorage.setItem(COMPANY_SLUG_KEY, resolvedSlug)
  localStorage.setItem(tenantKey('token', resolvedSlug), payload.token)
  localStorage.setItem(tenantKey('profile', resolvedSlug), JSON.stringify(payload.motoboy))
  localStorage.setItem(tenantKey('company', resolvedSlug), JSON.stringify(payload.company))
  localStorage.setItem(TOKEN_KEY, payload.token)
  localStorage.setItem(PROFILE_KEY, JSON.stringify(payload.motoboy))
  localStorage.setItem(COMPANY_KEY, JSON.stringify(payload.company))
  return payload
}

const motoboyRequest = (path, options = {}) => request(`/motoboy${path}`, {
  ...options,
  token: getMotoboyToken(),
})

export const getMotoboyProfile = () => motoboyRequest('/profile')
export const getMotoboyOrders = () => motoboyRequest('/orders')
export const startMotoboyOrder = (id) => motoboyRequest(`/orders/${id}/start`, { method: 'POST' })
export const completeMotoboyOrder = (id, notes = '') => motoboyRequest(`/orders/${id}/complete`, {
  method: 'POST',
  body: { notes },
})
export const getMotoboyHistory = () => motoboyRequest('/history')
