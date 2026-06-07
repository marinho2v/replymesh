import { useCallback, useEffect, useState } from 'react'
import { useCompanySlug } from '../contexts/CompanySlugContext'
import {
  getPublicBanners,
  getPublicBusinessHours,
  getPublicDeliveryZones,
  getPublicStoreInfo,
} from '../services/publicApi'

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
    try {
      setLoading(true)
      const [storeData, bannersData, hoursData, deliveryZonesData] = await Promise.all([
        getPublicStoreInfo(slug),
        getPublicBanners(slug),
        getPublicBusinessHours(slug),
        getPublicDeliveryZones(slug),
      ])
      setStore(storeData)
      setBanners(bannersData || [])
      setBusinessHours(hoursData?.business_hours || [])
      setBusinessHourExceptions(hoursData?.exceptions || [])
      setDeliveryZones(deliveryZonesData || [])
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
