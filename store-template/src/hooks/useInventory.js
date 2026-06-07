import { useState, useEffect } from 'react'
import {
  listInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  toggleInventoryItemStatus,
  deleteInventoryItem,
  getLowStockItems,
  getInventoryStats,
  getInventoryCategories,
} from '../services/inventory'
import { generateSlugFromName, validateInventoryItem } from '../utils/inventory'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

export const useInventory = (filters = {}) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listInventoryItems(filters)
      setItems(data)
    } catch (err) {
      setError(err.message)
      toast.error('Erro ao carregar itens de estoque')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [JSON.stringify(filters)])

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
  }
}

export const useInventoryItem = (id) => {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) {
        setItem(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await getInventoryItemById(id)
        setItem(data)
      } catch (err) {
        setError(err.message)
        toast.error('Erro ao carregar item de estoque')
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [id])

  return {
    item,
    loading,
    error,
    refetch: () => {
      if (id) {
        getInventoryItemById(id).then(setItem)
      }
    },
  }
}

export const useInventoryActions = () => {
  const [loading, setLoading] = useState(false)
  const { profile } = useAuth()

  const createItem = async (itemData) => {
    setLoading(true)
    try {
      const slug = itemData.slug || generateSlugFromName(itemData.name)
      const validation = validateInventoryItem({ ...itemData, slug })
      if (!validation.isValid) {
        validation.errors.forEach(err => toast.error(err))
        return { success: false, errors: validation.errors }
      }

      const data = await createInventoryItem({
        ...itemData,
        slug,
        user_id: profile?.id || null,
      })
      toast.success('Item de estoque criado com sucesso')
      return { success: true, data }
    } catch (err) {
      toast.error('Erro ao criar item de estoque')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (id, itemData) => {
    setLoading(true)
    try {
      const validation = validateInventoryItem(itemData)
      if (!validation.isValid) {
        validation.errors.forEach(err => toast.error(err))
        return { success: false, errors: validation.errors }
      }

      const data = await updateInventoryItem(id, {
        ...itemData,
        user_id: profile?.id || null,
      })
      toast.success('Item de estoque atualizado com sucesso')
      return { success: true, data }
    } catch (err) {
      toast.error('Erro ao atualizar item de estoque')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id, isActive) => {
    setLoading(true)
    try {
      await toggleInventoryItemStatus(id, isActive)
      toast.success(`Item ${isActive ? 'ativado' : 'desativado'} com sucesso`)
      return { success: true }
    } catch (err) {
      toast.error('Erro ao alterar status do item')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id) => {
    setLoading(true)
    try {
      await deleteInventoryItem(id)
      toast.success('Item de estoque excluído com sucesso')
      return { success: true }
    } catch (err) {
      toast.error('Erro ao excluir item de estoque')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createItem,
    updateItem,
    toggleStatus,
    deleteItem,
  }
}

export const useLowStockItems = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLowStock = async () => {
    try {
      setLoading(true)
      const data = await getLowStockItems()
      setItems(data)
    } catch (err) {
      toast.error('Erro ao carregar itens com estoque baixo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLowStock()
  }, [])

  return {
    items,
    loading,
    refetch: fetchLowStock,
  }
}

export const useInventoryStats = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await getInventoryStats()
      setStats(data)
    } catch (err) {
      toast.error('Erro ao carregar estatísticas de estoque')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    refetch: fetchStats,
  }
}

export const useInventoryCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const data = await getInventoryCategories()
        setCategories(data)
      } catch (err) {
        console.error('Error fetching categories:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return {
    categories,
    loading,
  }
}
