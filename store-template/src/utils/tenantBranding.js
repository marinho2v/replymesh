export const NEUTRAL_FAVICON_URL = '/replymesh-favicon.svg'

const removeManagedIcons = () => {
  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .forEach((node) => node.remove())
}

const versionedAssetUrl = (url, version) => {
  if (!url) return NEUTRAL_FAVICON_URL

  try {
    const parsed = new URL(url, window.location.origin)
    if (version) parsed.searchParams.set('v', String(version))
    return parsed.toString()
  } catch {
    return url
  }
}

export const updateTenantFavicon = (store = null) => {
  removeManagedIcons()

  const source = store?.favicon_url || store?.logo_url || NEUTRAL_FAVICON_URL
  const href = versionedAssetUrl(source, store?.updated_at)

  const icon = document.createElement('link')
  icon.rel = 'icon'
  icon.href = href
  icon.dataset.replymeshTenantIcon = 'true'
  document.head.appendChild(icon)

  const appleTouchIcon = document.createElement('link')
  appleTouchIcon.rel = 'apple-touch-icon'
  appleTouchIcon.href = href
  appleTouchIcon.dataset.replymeshTenantIcon = 'true'
  document.head.appendChild(appleTouchIcon)
}
