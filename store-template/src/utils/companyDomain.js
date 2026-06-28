const PLATFORM_DOMAIN = 'replymesh.cloud'
const RESERVED_SUBDOMAINS = new Set(['admin', 'api', 'app', 'www', 'mail', 'ftp', 'root', 'support', 'master', 'suporte'])
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])

export const normalizedHostname = (hostname = window.location.hostname) =>
  String(hostname || '').toLowerCase().replace(/^\[/, '').replace(/\]$/, '').split(':')[0]

export const companySlugFromHostname = (hostname = window.location.hostname) => {
  const normalizedHost = normalizedHostname(hostname)
  const suffix = `.${PLATFORM_DOMAIN}`

  if (!normalizedHost.endsWith(suffix)) return null

  const slug = normalizedHost.slice(0, -suffix.length)
  return slug && !RESERVED_SUBDOMAINS.has(slug) ? slug : null
}

export const customDomainFromHostname = (hostname = window.location.hostname) => {
  const normalizedHost = normalizedHostname(hostname)
  if (!normalizedHost || LOCAL_HOSTS.has(normalizedHost)) return null
  if (normalizedHost === PLATFORM_DOMAIN || normalizedHost.endsWith(`.${PLATFORM_DOMAIN}`)) return null
  if (!normalizedHost.includes('.')) return null

  return normalizedHost
}

export const resolveDefaultCompanySlug = (fallback) =>
  companySlugFromHostname() || customDomainFromHostname() || fallback

export const companyBasePath = (slug, hostname = window.location.hostname) => {
  const hostSlug = companySlugFromHostname(hostname)
  const customDomain = customDomainFromHostname(hostname)
  if (customDomain) return ''
  return hostSlug && hostSlug === slug ? '' : `/loja/${slug}`
}

export const officialStoreUrl = (slug) => {
  const cleanSlug = String(slug || '').trim().toLowerCase()
  return cleanSlug ? `https://${cleanSlug}.${PLATFORM_DOMAIN}` : ''
}

export const cleanLegacyCompanyPath = (pathname, slug) => {
  const prefix = `/loja/${slug}`
  if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) return pathname

  return pathname.slice(prefix.length) || '/'
}
