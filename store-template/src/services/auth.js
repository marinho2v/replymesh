import { REPLYMESH_API_URL } from './replymeshApi'
import { STORE_COMPANY_ID, setCurrentStoreCompany } from './storeApi'
import {
  clearStoreAuthSession,
  getStoreAuthToken,
  readStoreAuthSession,
  resolveStoreAuthSlug,
  writeStoreAuthSession,
} from './storeAuthStorage'

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
  const companySlug = options.companySlug || resolveStoreAuthSlug()
  const membership = (user.company_members || []).find((member) => (
    member.status === 'active' && (
    String(member.company_id) === String(options.companyId || localStorage.getItem('replymesh_store_company_id')) ||
    String(member.company_slug) === String(companySlug)
    )
  ))

  if (!membership || membership.company_slug !== companySlug) return null

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
  if (!profile) {
    clearStoreAuthSession(options.companySlug)
    throw new Error('Sua conta nao possui acesso ativo a esta empresa.')
  }
  writeStoreAuthSession(options.companySlug, { token: payload.token, user: payload.user, profile })
  setCurrentStoreCompany({
    companyId: options.companyId || localStorage.getItem('replymesh_store_company_id') || STORE_COMPANY_ID,
    slug: options.companySlug || localStorage.getItem('replymesh_store_company_slug'),
  })
  window.dispatchEvent(new CustomEvent(REPLYMESH_AUTH_EVENT, { detail: { user: payload.user, profile } }))
  return { provider: 'replymesh', user: payload.user, profile, token: payload.token }
}

export const signOut = async () => {
  clearStoreAuthSession()
  window.dispatchEvent(new CustomEvent(REPLYMESH_AUTH_EVENT))
  return true
}

export const validateStoreSessionAccess = async ({ token, companySlug, companyId } = {}) => {
  const slug = companySlug || resolveStoreAuthSlug()
  if (!token || !slug) return false

  const response = await fetch(`${REPLYMESH_API_URL}/store/features`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Company-Slug': slug,
      ...(companyId ? { 'X-Company-Id': companyId } : {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (response.ok && payload?.success !== false) return true

  if (response.status === 401 || payload?.error === 'tenant_forbidden') {
    clearStoreAuthSession(slug)
    sessionStorage.setItem(
      'replymesh:store:auth-message',
      'Sua sessao pertence a outra empresa. Faca login novamente.',
    )
  }

  return false
}

export const signUp = async () => {
  throw new Error('Cadastre usuarios pelo painel administrativo da loja.')
}

export const getCurrentUser = async () => {
  return readStoreAuthSession()?.user || null
}

export const getUserProfile = async () => {
  return readStoreAuthSession()?.profile || null
}

const railsStoreHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getStoreAuthToken()}`,
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
