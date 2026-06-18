import { createContext, useContext, useEffect, useState } from 'react'
import { COMPANY_SLUG, REPLYMESH_API_URL } from '../services/replymeshApi'
import { ensureStoreAuthTenant, readStoreAuthSession } from '../services/storeAuthStorage'

const CompanySlugContext = createContext({
  slug: COMPANY_SLUG,
  basePath: '',
})

export const useCompanySlug    = () => useContext(CompanySlugContext).slug
export const useCompanyBasePath = () => useContext(CompanySlugContext).basePath

const isDomainIdentifier = value => String(value || '').includes('.')

export const CompanySlugProvider = ({ slug, basePath = '', children }) => {
  const companyIdentifier = slug || COMPANY_SLUG
  const [resolvedSlug, setResolvedSlug] = useState(() => {
    const storedSlug = localStorage.getItem('replymesh_store_company_slug')
    if (isDomainIdentifier(companyIdentifier) && storedSlug && !isDomainIdentifier(storedSlug)) {
      return storedSlug
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

    const previousSlug = localStorage.getItem('replymesh_store_company_slug')
    const previousSession = previousSlug ? readStoreAuthSession(previousSlug) : null
    const customDomain = isDomainIdentifier(companyIdentifier)
    let active = true
    let authChangeDispatched = false

    const applyResolvedCompany = (canonicalSlug, companyId = null) => {
      if (!active || !canonicalSlug) return

      setResolvedSlug(canonicalSlug)
      localStorage.setItem('replymesh_store_company_slug', canonicalSlug)
      if (companyId) localStorage.setItem('replymesh_store_company_id', String(companyId))

      if (
        previousSession?.token
        && previousSlug !== canonicalSlug
        && !ensureStoreAuthTenant(canonicalSlug)
        && !authChangeDispatched
      ) {
        authChangeDispatched = true
        window.dispatchEvent(new Event('replymesh-auth-changed'))
      }
    }

    if (!customDomain) applyResolvedCompany(companyIdentifier)

    fetch(`${REPLYMESH_API_URL}/public/${encodeURIComponent(companyIdentifier)}/store`, {
      headers: { Accept: 'application/json' },
    })
      .then(response => (response.ok ? response.json() : null))
      .then(payload => {
        if (!active || !payload?.store) return
        const companyId = payload.store.company_id || payload.store.id
        applyResolvedCompany(payload.store.slug || companyIdentifier, companyId)
      })
      .catch(() => {
        if (!customDomain) applyResolvedCompany(companyIdentifier)
      })

    return () => { active = false }
  }, [companyIdentifier])

  return (
    <CompanySlugContext.Provider value={{ slug: resolvedSlug, basePath }}>
      {children}
    </CompanySlugContext.Provider>
  )
}
