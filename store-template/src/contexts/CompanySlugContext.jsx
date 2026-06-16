import { createContext, useContext, useEffect } from 'react'
import { COMPANY_SLUG, REPLYMESH_API_URL } from '../services/replymeshApi'
import { ensureStoreAuthTenant } from '../services/storeAuthStorage'

const CompanySlugContext = createContext({
  slug: COMPANY_SLUG,
  basePath: '',
})

export const useCompanySlug    = () => useContext(CompanySlugContext).slug
export const useCompanyBasePath = () => useContext(CompanySlugContext).basePath

export const CompanySlugProvider = ({ slug, basePath = '', children }) => {
  const resolvedSlug = slug || COMPANY_SLUG

  useEffect(() => {
    const isDomainIdentifier = String(resolvedSlug || '').includes('.')
    if (resolvedSlug && !isDomainIdentifier && !ensureStoreAuthTenant(resolvedSlug)) {
      window.dispatchEvent(new Event('replymesh-auth-changed'))
    }
    localStorage.removeItem('replymesh_store_company_id')

    if (!resolvedSlug) {
      localStorage.removeItem('replymesh_store_company_slug')
      return undefined
    }

    localStorage.setItem('replymesh_store_company_slug', resolvedSlug)
    let active = true

    fetch(`${REPLYMESH_API_URL}/public/${encodeURIComponent(resolvedSlug)}/store`, {
      headers: { Accept: 'application/json' },
    })
      .then(response => (response.ok ? response.json() : null))
      .then(payload => {
        if (!active || !payload?.store) return
        const companyId = payload.store.company_id || payload.store.id
        if (companyId) localStorage.setItem('replymesh_store_company_id', String(companyId))
        if (payload.store.slug) localStorage.setItem('replymesh_store_company_slug', payload.store.slug)
      })
      .catch(() => {
        // O slug continua no contexto; a API bloqueia company_id divergente.
      })

    return () => { active = false }
  }, [resolvedSlug])

  return (
    <CompanySlugContext.Provider value={{ slug: resolvedSlug, basePath }}>
      {children}
    </CompanySlugContext.Provider>
  )
}
