import { resolveDefaultCompanySlug } from '../utils/companyDomain'

const DEFAULT_API_URL = 'http://127.0.0.1:3000/api/v1'

export const REPLYMESH_API_URL = (
  import.meta.env.VITE_REPLYMESH_API_URL || DEFAULT_API_URL
).replace(/\/$/, '')

export const COMPANY_SLUG = resolveDefaultCompanySlug(
  import.meta.env.VITE_COMPANY_SLUG || 'empresa-teste'
)

const buildUrl = (path, params = {}) => {
  const url = new URL(`${REPLYMESH_API_URL}${path}`)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  return url.toString()
}

export const currentStoreCompanySlug = () => (
  localStorage.getItem('replymesh_store_company_slug') || COMPANY_SLUG
)

export class ReplymeshApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message)
    this.name = 'ReplymeshApiError'
    this.status = status
    this.payload = payload
  }
}

const clearStoreSession = () => {
  if (localStorage.getItem('replymesh_impersonation_token')) {
    localStorage.removeItem('replymesh_impersonation_token')
    localStorage.removeItem('replymesh_impersonation_user')
    localStorage.removeItem('replymesh_impersonation_profile')
    localStorage.removeItem('replymesh_master_impersonation')
  } else {
    localStorage.removeItem('replymesh_store_token')
    localStorage.removeItem('replymesh_store_user')
    localStorage.removeItem('replymesh_store_profile')
  }
  window.dispatchEvent(new Event('replymesh-auth-changed'))
}

const readJsonStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

const clearImpersonationSession = () => {
  localStorage.removeItem('replymesh_impersonation_token')
  localStorage.removeItem('replymesh_impersonation_user')
  localStorage.removeItem('replymesh_impersonation_profile')
  localStorage.removeItem('replymesh_master_impersonation')
}

export const getReplymeshAuthToken = () => {
  const impersonationToken = localStorage.getItem('replymesh_impersonation_token')
  const impersonation = readJsonStorage('replymesh_master_impersonation')
  const currentCompanyId = localStorage.getItem('replymesh_store_company_id')
  const currentCompanySlug = localStorage.getItem('replymesh_store_company_slug')

  if (impersonationToken && impersonation) {
    const expired = impersonation.expires_at && new Date(impersonation.expires_at).getTime() <= Date.now()
    const sameCompany = !currentCompanyId || String(impersonation.company_id) === String(currentCompanyId)
    const sameSlug = !currentCompanySlug || String(impersonation.company_slug) === String(currentCompanySlug)

    if (!expired && sameCompany && sameSlug) return impersonationToken
    clearImpersonationSession()
  }

  return localStorage.getItem('replymesh_store_token')
}

export const request = async (path, options = {}) => {
  const {
    method = 'GET',
    body,
    params,
    token = getReplymeshAuthToken(),
    headers = {},
  } = options

  const effectiveHeaders = { ...headers }
  const tenantHeaders = path.startsWith('/store')
    ? { 'X-Company-Slug': currentStoreCompanySlug() }
    : {}

  if (path.startsWith('/store') && tenantHeaders['X-Company-Slug']) {
    delete effectiveHeaders['X-Company-Id']
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...tenantHeaders,
      ...effectiveHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok || payload?.success === false) {
    if (response.status === 401 && token) {
      clearStoreSession()
    } else if (response.status === 403 && payload?.error === 'Sessao master vinculada a outra empresa') {
      clearImpersonationSession()
      window.dispatchEvent(new Event('replymesh-auth-changed'))
    }

    throw new ReplymeshApiError(
      payload?.error || payload?.errors?.[0] || 'Erro ao comunicar com a API Replymesh',
      { status: response.status, payload }
    )
  }

  return payload
}

export const revokeMasterImpersonation = (sessionToken) => request(
  `/master/impersonation/${encodeURIComponent(sessionToken)}`,
  { method: 'DELETE', token: localStorage.getItem('replymesh_impersonation_token') }
)

export const centsToCurrency = (value) => Number(value || 0) / 100
