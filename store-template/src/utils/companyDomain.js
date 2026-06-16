const PLATFORM_DOMAIN = 'replymesh.cloud'
const RESERVED_SUBDOMAINS = new Set(['admin', 'api', 'app', 'www', 'mail', 'ftp', 'root', 'support', 'master', 'suporte'])

export const companySlugFromHostname = (hostname = window.location.hostname) => {
  const normalizedHost = String(hostname || '').toLowerCase().split(':')[0]
  const suffix = `.${PLATFORM_DOMAIN}`

  if (!normalizedHost.endsWith(suffix)) return null

  const slug = normalizedHost.slice(0, -suffix.length)
  return slug && !RESERVED_SUBDOMAINS.has(slug) ? slug : null
}

export const resolveDefaultCompanySlug = (fallback) =>
  companySlugFromHostname() || fallback

export const companyBasePath = (slug, hostname = window.location.hostname) => {
  const hostSlug = companySlugFromHostname(hostname)
  return hostSlug && hostSlug === slug ? '' : `/loja/${slug}`
}

export const cleanLegacyCompanyPath = (pathname, slug) => {
  const prefix = `/loja/${slug}`
  if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) return pathname

  return pathname.slice(prefix.length) || '/'
}
