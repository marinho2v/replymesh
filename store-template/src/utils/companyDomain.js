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
