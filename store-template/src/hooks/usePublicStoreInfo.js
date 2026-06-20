import { useCallback, useEffect, useState } from 'react'
import { useCompanySlug } from '../contexts/CompanySlugContext'
import { getPublicStoreBundle } from '../services/publicApi'

const DEFAULT_PUBLIC_STORE = {
  store: null,
  banners: [],
  businessHours: [],
  businessHourExceptions: [],
  deliveryZones: [],
}

export const usePublicStoreInfo = (slugOverride) => {
  const contextSlug = useCompanySlug()
  const slug = slugOverride || contextSlug

  const [store, setStore] = useState(null)
  const [banners, setBanners] = useState([])
  const [businessHours, setBusinessHours] = useState([])
  const [businessHourExceptions, setBusinessHourExceptions] = useState([])
  const [deliveryZones, setDeliveryZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!slug) {
      setLoading(true)
      return
    }

    try {
      setLoading(true)
      const bundle = await getPublicStoreBundle(slug)
      setStore(bundle.store)
      setBanners(bundle.banners || [])
      setBusinessHours(bundle.business_hours || [])
      setBusinessHourExceptions(bundle.exceptions || [])
      setDeliveryZones(bundle.delivery_zones || [])
      setError(null)
    } catch (err) {
      setStore(DEFAULT_PUBLIC_STORE.store)
      setBanners(DEFAULT_PUBLIC_STORE.banners)
      setBusinessHours(DEFAULT_PUBLIC_STORE.businessHours)
      setBusinessHourExceptions(DEFAULT_PUBLIC_STORE.businessHourExceptions)
      setDeliveryZones(DEFAULT_PUBLIC_STORE.deliveryZones)
      setError(err.message || 'Erro ao carregar loja')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    store,
    banners,
    businessHours,
    businessHourExceptions,
    deliveryZones,
    loading,
    error,
    refetch,
  }
}
