import { createContext, useContext, useEffect, useState } from 'react'
import { COMPANY_SLUG, REPLYMESH_API_URL } from '../services/replymeshApi'
import { ensureStoreAuthTenant } from '../services/storeAuthStorage'
import { primePublicStoreCache } from '../services/publicApi'

const CompanySlugContext = createContext({
  slug: COMPANY_SLUG,
  basePath: '',
})

export const useCompanySlug    = () => useContext(CompanySlugContext).slug
export const useCompanyBasePath = () => useContext(CompanySlugContext).basePath

const isDomainIdentifier = value => String(value || '').includes('.')
const domainSlugStorageKey = identifier => `replymesh_store_company_slug:${identifier}`

export const CompanySlugProvider = ({ slug, basePath = '', children }) => {
  const companyIdentifier = slug || COMPANY_SLUG
  const [resolvedSlug, setResolvedSlug] = useState(() => {
    if (isDomainIdentifier(companyIdentifier)) {
      const storedSlug = localStorage.getItem(domainSlugStorageKey(companyIdentifier))
      return storedSlug && !isDomainIdentifier(storedSlug) ? storedSlug : null
    }
    return companyIdentifier
  })

  useEffect(() => {
    localStorage.removeItem('replymesh_store_company_id')

    if (!companyIdentifier) {
      localStorage.removeItem('replymesh_store_company_slug')
      setResolvedSlug(null)
      return undefined
    }

    const customDomain = isDomainIdentifier(companyIdentifier)
    const storedSlug = customDomain
      ? localStorage.getItem(domainSlugStorageKey(companyIdentifier))
      : localStorage.getItem('replymesh_store_company_slug')
    let active = true

    const applyResolvedCompany = (canonicalSlug, companyId = null, payload = null) => {
      if (!active || !canonicalSlug) return

      if (payload) {
        primePublicStoreCache(companyIdentifier, payload)
        primePublicStoreCache(canonicalSlug, payload)
      }

      if (!ensureStoreAuthTenant(canonicalSlug)) {
        window.dispatchEvent(new Event('replymesh-auth-changed'))
      }

      setResolvedSlug(canonicalSlug)
      localStorage.setItem('replymesh_store_company_slug', canonicalSlug)
      if (customDomain) {
        localStorage.setItem(domainSlugStorageKey(companyIdentifier), canonicalSlug)
      }
      if (companyId) localStorage.setItem('replymesh_store_company_id', String(companyId))
    }

    if (!customDomain) {
      applyResolvedCompany(companyIdentifier)
      return () => { active = false }
    }

    if (storedSlug && !isDomainIdentifier(storedSlug)) {
      applyResolvedCompany(storedSlug)
      return () => { active = false }
    }

    fetch(`${REPLYMESH_API_URL}/public/${encodeURIComponent(companyIdentifier)}/store`, {
      headers: { Accept: 'application/json' },
    })
      .then(response => (response.ok ? response.json() : null))
      .then(payload => {
        if (!active || !payload?.store) return
        const companyId = payload.store.company_id || payload.store.id
        applyResolvedCompany(payload.store.slug || companyIdentifier, companyId, payload)
      })
      .catch(() => {
        applyResolvedCompany(companyIdentifier)
      })

    return () => { active = false }
  }, [companyIdentifier])

  return (
    <CompanySlugContext.Provider value={{ slug: resolvedSlug, basePath }}>
      {children}
    </CompanySlugContext.Provider>
  )
}
