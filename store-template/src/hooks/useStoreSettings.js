import { useState, useEffect } from 'react'
import { getStoreSettings, getPublicStoreSettings, getBusinessHours, isStoreOpen } from '../services/settings'

export const ORDER_STATUS_FLOW_UPDATED_EVENT = 'order-status-flow-updated'

const settingsCache = {
  private: null,
  public: null,
}
const settingsPromises = {
  private: null,
  public: null,
}

const loadCachedSettings = async (publicOnly = false) => {
  const cacheKey = publicOnly ? 'public' : 'private'
  const loader = publicOnly ? getPublicStoreSettings : getStoreSettings

  if (settingsCache[cacheKey]) return settingsCache[cacheKey]
  if (!settingsPromises[cacheKey]) {
    settingsPromises[cacheKey] = loader()
      .then((data) => {
        settingsCache[cacheKey] = data
        return data
      })
      .finally(() => {
        settingsPromises[cacheKey] = null
      })
  }

  return settingsPromises[cacheKey]
}

export const useStoreSettings = ({ publicOnly = false } = {}) => {
  const cacheKey = publicOnly ? 'public' : 'private'
  const loader = publicOnly ? getPublicStoreSettings : getStoreSettings
  const [settings, setSettings] = useState(settingsCache[cacheKey])
  const [loading, setLoading] = useState(!settingsCache[cacheKey])

  const fetchSettings = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const data = silent ? await loadCachedSettings(publicOnly) : await loader()
      settingsCache[cacheKey] = data
      setSettings(data)
    } catch (error) {
      console.error('Error fetching store settings:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    const handleFlowUpdated = (event) => {
      if (event?.detail?.settings) {
        settingsCache.private = event.detail.settings
        if (!publicOnly) setSettings(event.detail.settings)
        return
      }

      if (!publicOnly) {
        setSettings(settingsCache.private)
        return
      }
    }

    loadCachedSettings(publicOnly)
      .then((data) => {
        setSettings(data)
      })
      .catch(error => console.error('Error fetching store settings:', error))
      .finally(() => setLoading(false))

    window.addEventListener(ORDER_STATUS_FLOW_UPDATED_EVENT, handleFlowUpdated)

    return () => {
      window.removeEventListener(ORDER_STATUS_FLOW_UPDATED_EVENT, handleFlowUpdated)
    }
  }, [publicOnly])

  return { settings, loading, refetch: fetchSettings }
}

export const useBusinessHours = () => {
  const [hours, setHours] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHours = async () => {
      try {
        setLoading(true)
        const data = await getBusinessHours()
        setHours(data)
      } catch (error) {
        console.error('Error fetching business hours:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHours()
  }, [])

  return { hours, loading }
}

export const useStoreStatus = () => {
  const [status, setStatus] = useState({ isOpen: true, message: '' })
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    try {
      setLoading(true)
      const result = await isStoreOpen()
      setStatus(result)
    } catch (error) {
      console.error('Error checking store status:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  return { status, loading, refetch: checkStatus }
}
