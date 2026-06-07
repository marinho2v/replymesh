import { useEffect, useRef } from 'react'
import { COMPANY_SLUG } from '../../services/replymeshApi'
import { getPublicStoreInfo } from '../../services/publicApi'

const APP_VERSION_KEY = 'replymesh:app-cache-version'
const CHECK_INTERVAL_MS = 120000

const clearTechnicalCache = async () => {
  try {
    Object.keys(sessionStorage)
      .filter(key => (
        key.startsWith('products:') ||
        key.startsWith('categories:') ||
        key.startsWith('delivery-zones:')
      ))
      .forEach(key => sessionStorage.removeItem(key))
  } catch {
    // Ignore storage errors.
  }

  if ('caches' in window) {
    try {
      const names = await window.caches.keys()
      await Promise.all(names.map(name => window.caches.delete(name)))
    } catch {
      // Ignore Cache API errors.
    }
  }

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(registration => registration.unregister()))
    } catch {
      // Ignore service worker errors.
    }
  }
}

const reloadWithVersion = (version) => {
  const url = new URL(window.location.href)
  url.searchParams.set('appv', version)
  window.location.replace(url.toString())
}

const currentCompanySlug = () => {
  const match = window.location.pathname.match(/\/loja\/([^/]+)/)
  return match?.[1] || localStorage.getItem('replymesh_store_company_slug') || COMPANY_SLUG
}

const AppVersionWatcher = () => {
  const checkingRef = useRef(false)

  useEffect(() => {
    const checkVersion = async () => {
      if (checkingRef.current) return
      checkingRef.current = true

      try {
        const settings = await getPublicStoreInfo(currentCompanySlug())
        const nextVersion = String(settings?.app_cache_version || '').trim()
        if (!nextVersion) return

        const currentVersion = localStorage.getItem(APP_VERSION_KEY)

        if (!currentVersion) {
          localStorage.setItem(APP_VERSION_KEY, nextVersion)
          return
        }

        if (currentVersion !== nextVersion) {
          localStorage.setItem(APP_VERSION_KEY, nextVersion)
          await clearTechnicalCache()
          reloadWithVersion(nextVersion)
        }
      } catch {
        // Version checking should never block the app.
      } finally {
        checkingRef.current = false
      }
    }

    checkVersion()
    const intervalId = window.setInterval(checkVersion, CHECK_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [])

  return null
}

export default AppVersionWatcher
