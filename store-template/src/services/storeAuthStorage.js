import { companySlugFromHostname } from '../utils/companyDomain'

const LEGACY_KEYS = {
  token: 'replymesh_store_token',
  user: 'replymesh_store_user',
  profile: 'replymesh_store_profile',
}

const parseJson = (value) => {
  try {
    return JSON.parse(value || 'null')
  } catch {
    return null
  }
}

export const resolveStoreAuthSlug = (slug = null) => (
  companySlugFromHostname() || slug || localStorage.getItem('replymesh_store_company_slug')
)

export const storeAuthKey = (slug, field) => `replymesh:store:${slug}:auth:${field}`

const removeLegacySession = () => {
  Object.values(LEGACY_KEYS).forEach(key => localStorage.removeItem(key))
}

export const clearStoreAuthSession = (slug = resolveStoreAuthSlug()) => {
  if (slug) {
    Object.keys(LEGACY_KEYS).forEach(field => localStorage.removeItem(storeAuthKey(slug, field)))
  }
  removeLegacySession()
}

export const readStoreAuthSession = (slug = resolveStoreAuthSlug()) => {
  if (!slug) return null

  const session = {
    token: localStorage.getItem(storeAuthKey(slug, 'token')),
    user: parseJson(localStorage.getItem(storeAuthKey(slug, 'user'))),
    profile: parseJson(localStorage.getItem(storeAuthKey(slug, 'profile'))),
  }

  if (session.token && session.user && session.profile?.company_slug === slug) return session

  const legacyProfile = parseJson(localStorage.getItem(LEGACY_KEYS.profile))
  const legacyToken = localStorage.getItem(LEGACY_KEYS.token)
  const legacyUser = parseJson(localStorage.getItem(LEGACY_KEYS.user))

  if (legacyToken && legacyUser && legacyProfile?.company_slug === slug) {
    writeStoreAuthSession(slug, { token: legacyToken, user: legacyUser, profile: legacyProfile })
    removeLegacySession()
    return { token: legacyToken, user: legacyUser, profile: legacyProfile }
  }

  if (legacyToken || legacyUser || legacyProfile) removeLegacySession()
  clearStoreAuthSession(slug)
  return null
}

export const writeStoreAuthSession = (slug, { token, user, profile }) => {
  if (!slug || profile?.company_slug !== slug) {
    throw new Error('Sessao pertence a outra empresa')
  }

  localStorage.setItem(storeAuthKey(slug, 'token'), token)
  localStorage.setItem(storeAuthKey(slug, 'user'), JSON.stringify(user))
  localStorage.setItem(storeAuthKey(slug, 'profile'), JSON.stringify(profile))
  removeLegacySession()
}

export const getStoreAuthToken = (slug = resolveStoreAuthSlug()) => (
  readStoreAuthSession(slug)?.token || null
)

export const ensureStoreAuthTenant = (slug) => {
  const session = readStoreAuthSession(slug)
  if (!session) return false

  if (session.profile?.company_slug !== slug) {
    clearStoreAuthSession(slug)
    return false
  }

  return true
}
