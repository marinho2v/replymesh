import { useCallback, useEffect, useMemo, useState } from 'react'
import { railsGetProducts } from '../services/storeApi'

const CACHE_VERSION = 'rails_v1'

const readCache = (key) => {
  try {
    const cached = sessionStorage.getItem(key)
    return cached ? JSON.parse(cached) : []
  } catch {
    return []
  }
}

const writeCache = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data || []))
  } catch {}
}

export const useProducts = (filters = {}) => {
  const railsParams = {}
  if (filters.activeOnly === true)  railsParams.active = 'true'
  if (filters.activeOnly === false) {}  // fetch all — default
  if (filters.category_id)         railsParams.category_id = filters.category_id

  const filtersKey = JSON.stringify(filters)
  const cacheKey = useMemo(() => `products:${CACHE_VERSION}:${filtersKey}`, [filtersKey])
  const [products, setProducts] = useState(() => readCache(cacheKey))
  const [loading, setLoading] = useState(() => readCache(cacheKey).length === 0)
  const [error, setError] = useState(null)

  const fetchProducts = useCallback(async () => {
    const cached = readCache(cacheKey)
    try {
      if (cached.length === 0) setLoading(true)
      const data = await railsGetProducts(railsParams)
      const next = data || []
      writeCache(cacheKey, next)
      setProducts(next)
      setError(null)
    } catch (err) {
      setError(err.message)
      setProducts(cached)
    } finally {
      setLoading(false)
    }
  }, [cacheKey, filtersKey])

  useEffect(() => {
    let active = true
    const cached = readCache(cacheKey)

    if (cached.length > 0) {
      setProducts(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    const timeoutId = setTimeout(() => {
      if (!active) return
      setError('Tempo esgotado ao carregar produtos.')
      setLoading(false)
    }, 10000)

    railsGetProducts(railsParams).then(data => {
      if (!active) return
      const next = data || []
      writeCache(cacheKey, next)
      setProducts(next)
      setError(null)
    }).catch(err => {
      if (!active) return
      setError(err.message)
      setProducts(cached)
    }).finally(() => {
      if (!active) return
      clearTimeout(timeoutId)
      setLoading(false)
    })

    return () => { active = false; clearTimeout(timeoutId) }
  }, [cacheKey, filtersKey])

  return { products, loading, error, refetch: fetchProducts }
}
