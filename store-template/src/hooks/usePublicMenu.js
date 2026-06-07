import { useCallback, useEffect, useState } from 'react'
import { useCompanySlug } from '../contexts/CompanySlugContext'
import { getPublicMenu } from '../services/publicApi'

const EMPTY_MENU = { categories: [], products: [] }

export const usePublicMenu = (slugOverride) => {
  const contextSlug = useCompanySlug()
  const slug = slugOverride || contextSlug

  const [menu, setMenu] = useState(EMPTY_MENU)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPublicMenu(slug)
      setMenu(data || EMPTY_MENU)
      setError(null)
    } catch (err) {
      setMenu(EMPTY_MENU)
      setError(err.message || 'Erro ao carregar cardapio')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    refetch()
  }, [refetch])

  return {
    categories: menu.categories,
    products: menu.products,
    loading,
    error,
    refetch,
  }
}
