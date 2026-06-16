import { useCallback, useEffect, useState } from 'react'
import { useCompanySlug } from '../contexts/CompanySlugContext'
import { useSharedPublicStoreInfo } from '../contexts/PublicStoreInfoContext'
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

export const usePublicStoreInfoLoader = (slugOverride, enabled = true) => {
  const contextSlug = useCompanySlug()
  const slug = slugOverride || contextSlug

  const [store, setStore] = useState(null)
  const [banners, setBanners] = useState([])
  const [businessHours, setBusinessHours] = useState([])
  const [businessHourExceptions, setBusinessHourExceptions] = useState([])
  const [deliveryZones, setDeliveryZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadedSlug, setLoadedSlug] = useState(null)

  const refetch = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setLoadedSlug(null)
      setStore(null)
      setBanners([])
      setBusinessHours([])
      setBusinessHourExceptions([])
      setDeliveryZones([])
      setError(null)
      const storeData = await getPublicStoreInfo(slug)
      const [bannersData, hoursData, deliveryZonesData] = await Promise.all([
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
      setLoadedSlug(slug)
    } catch (err) {
      setStore(DEFAULT_PUBLIC_STORE.store)
      setBanners(DEFAULT_PUBLIC_STORE.banners)
      setBusinessHours(DEFAULT_PUBLIC_STORE.businessHours)
      setBusinessHourExceptions(DEFAULT_PUBLIC_STORE.businessHourExceptions)
      setDeliveryZones(DEFAULT_PUBLIC_STORE.deliveryZones)
      setError(err)
      setLoadedSlug(slug)
    } finally {
      setLoading(false)
    }
  }, [enabled, slug])

  useEffect(() => {
    if (!enabled) return undefined
    refetch()
    return undefined
  }, [enabled, refetch])

  const hasCurrentSlug = loadedSlug === slug

  return {
    store: hasCurrentSlug ? store : null,
    banners: hasCurrentSlug ? banners : [],
    businessHours: hasCurrentSlug ? businessHours : [],
    businessHourExceptions: hasCurrentSlug ? businessHourExceptions : [],
    deliveryZones: hasCurrentSlug ? deliveryZones : [],
    loading: loading || !hasCurrentSlug,
    error: hasCurrentSlug ? error : null,
    refetch,
  }
}

export const usePublicStoreInfo = (slugOverride) => {
  const shared = useSharedPublicStoreInfo()
  const local = usePublicStoreInfoLoader(slugOverride, !shared)
  return shared || local
}
