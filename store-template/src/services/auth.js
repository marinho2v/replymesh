import { REPLYMESH_API_URL } from './replymeshApi'
import { STORE_COMPANY_ID, setCurrentStoreCompany } from './storeApi'

const REPLYMESH_AUTH_EVENT = 'replymesh-auth-changed'

const membershipRoleToProfileRole = (role) => {
  if (['store_admin', 'super_admin', 'owner', 'manager'].includes(role)) return 'admin'
  if (role === 'cashier') return 'cashier'
  if (role === 'waiter') return 'waiter'
  if (role === 'kitchen') return 'kitchen'
  if (role === 'motoboy') return 'motoboy'
  return 'attendant'
}

const buildReplymeshProfile = (user, options = {}) => {
  const membership = (user.company_members || []).find((member) => (
    String(member.company_id) === String(options.companyId || localStorage.getItem('replymesh_store_company_id')) ||
    String(member.company_slug) === String(options.companySlug || localStorage.getItem('replymesh_store_company_slug'))
  )) || (user.company_members || [])[0]

  return {
    id: user.id,
    email: user.email,
    full_name: user.name || user.full_name || user.email,
    role: user.global_role === 'super_admin' ? 'admin' : membershipRoleToProfileRole(membership?.role),
    company_member_role: membership?.role,
    company_id: membership?.company_id,
    company_slug: membership?.company_slug,
    provider: 'replymesh',
  }
}

export const signIn = async (email, password, options = {}) => {
  const login = String(email || '').trim()
  if (!login.includes('@')) throw new Error('Informe o e-mail do painel administrativo')

  const response = await fetch(`${REPLYMESH_API_URL}/auth/login`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: login, password }),
  })
  const payload = await response.json()
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || 'Erro ao fazer login na API Rails')
  }

  const profile = buildReplymeshProfile(payload.user, options)
  localStorage.setItem('replymesh_store_token', payload.token)
  localStorage.setItem('replymesh_store_user', JSON.stringify(payload.user))
  localStorage.setItem('replymesh_store_profile', JSON.stringify(profile))
  setCurrentStoreCompany({
    companyId: options.companyId || localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID,
    slug: options.companySlug || localStorage.getItem('replymesh_store_company_slug'),
  })
  window.dispatchEvent(new CustomEvent(REPLYMESH_AUTH_EVENT, { detail: { user: payload.user, profile } }))
  return { provider: 'replymesh', user: payload.user, profile, token: payload.token }
}

export const signOut = async () => {
  localStorage.removeItem('replymesh_store_token')
  localStorage.removeItem('replymesh_store_user')
  localStorage.removeItem('replymesh_store_profile')
  window.dispatchEvent(new CustomEvent(REPLYMESH_AUTH_EVENT))
  return true
}

export const signUp = async () => {
  throw new Error('Cadastre usuarios pelo painel administrativo da loja.')
}

export const getCurrentUser = async () => {
  const raw = localStorage.getItem('replymesh_store_user')
  return raw ? JSON.parse(raw) : null
}

export const getUserProfile = async () => {
  const raw = localStorage.getItem('replymesh_store_profile')
  return raw ? JSON.parse(raw) : null
}

const railsStoreHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('replymesh_store_token')}`,
  'X-Company-Id': localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID,
})

const railsStoreRequest = async (path, options = {}) => {
  const response = await fetch(`${REPLYMESH_API_URL}${path}`, {
    method: options.method || 'GET',
    headers: railsStoreHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const payload = await response.json()
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || payload?.errors?.[0] || 'Erro na API Rails')
  }
  return payload
}

export const getUsers = async () => (await railsStoreRequest('/store/users')).users || []

export const createUser = async (userData) => (
  await railsStoreRequest('/store/users', { method: 'POST', body: { user: userData } })
).user

export const updateUser = async (userId, userData) => (
  await railsStoreRequest(`/store/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: { user: userData },
  })
).user

export const deleteUser = async (userId) => {
  await railsStoreRequest(`/store/users/${encodeURIComponent(userId)}`, { method: 'DELETE' })
  return true
}
