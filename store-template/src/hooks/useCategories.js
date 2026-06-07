import { useEffect, useState } from 'react'
import { railsGetCategories } from '../services/storeApi'

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

export const useCategories = (activeOnly = true) => {
  const cacheKey = `categories:${CACHE_VERSION}:${activeOnly ? 'active' : 'all'}`
  const [categories, setCategories] = useState(() => readCache(cacheKey))
  const [loading, setLoading] = useState(() => readCache(cacheKey).length === 0)
  const [error, setError] = useState(null)

  const refetch = async () => {
    const cached = readCache(cacheKey)
    try {
      if (cached.length === 0) setLoading(true)
      const data = await railsGetCategories()
      const all = data || []
      const next = activeOnly ? all.filter(c => c.is_active) : all
      writeCache(cacheKey, next)
      setCategories(next)
      setError(null)
    } catch (err) {
      setError(err.message)
      setCategories(cached)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const cached = readCache(cacheKey)

    if (cached.length > 0) {
      setCategories(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }

    const timeoutId = setTimeout(() => {
      if (!active) return
      setError('Tempo esgotado ao carregar categorias.')
      setLoading(false)
    }, 10000)

    railsGetCategories().then(data => {
      if (!active) return
      const all = data || []
      const next = activeOnly ? all.filter(c => c.is_active) : all
      writeCache(cacheKey, next)
      setCategories(next)
      setError(null)
    }).catch(err => {
      if (!active) return
      setError(err.message)
      setCategories(cached)
    }).finally(() => {
      if (!active) return
      clearTimeout(timeoutId)
      setLoading(false)
    })

    return () => { active = false; clearTimeout(timeoutId) }
  }, [activeOnly, cacheKey])

  return { categories, setCategories, loading, error, refetch }
}
