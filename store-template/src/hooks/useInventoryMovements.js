import { useState, useEffect } from 'react'
import {
  listInventoryMovements,
  getMovementById,
  createInventoryMovement,
  applyInventoryEntry,
  applyInventoryExit,
  applyInventoryAdjustment,
  applyOrderInventoryDeduction,
  restoreInventoryFromCancelledOrder,
  getMovementsByItem,
  getMovementsByOrder,
} from '../services/inventoryMovements'
import { validateInventoryMovement } from '../utils/inventory'
import { toast } from 'sonner'

export const useInventoryMovements = (filters = {}) => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMovements = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listInventoryMovements(filters)
      setMovements(data)
    } catch (err) {
      setError(err.message)
      toast.error('Erro ao carregar movimentações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovements()
  }, [JSON.stringify(filters)])

  return {
    movements,
    loading,
    error,
    refetch: fetchMovements,
  }
}

export const useMovement = (id) => {
  const [movement, setMovement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMovement = async () => {
      if (!id) {
        setMovement(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await getMovementById(id)
        setMovement(data)
      } catch (err) {
        setError(err.message)
        toast.error('Erro ao carregar movimentação')
      } finally {
        setLoading(false)
      }
    }

    fetchMovement()
  }, [id])

  return {
    movement,
    loading,
    error,
    refetch: () => {
      if (id) {
        getMovementById(id).then(setMovement)
      }
    },
  }
}

export const useMovementActions = () => {
  const [loading, setLoading] = useState(false)

  const createMovement = async (movementData) => {
    setLoading(true)
    try {
      const validation = validateInventoryMovement(movementData)
      if (!validation.isValid) {
        validation.errors.forEach(err => toast.error(err))
        return { success: false, errors: validation.errors }
      }

      const data = await createInventoryMovement(movementData)
      toast.success('Movimentação registrada com sucesso')
      return { success: true, data }
    } catch (err) {
      toast.error('Erro ao registrar movimentação')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const applyEntry = async (stockItemId, quantity, metadata = {}) => {
    setLoading(true)
    try {
      await applyInventoryEntry(stockItemId, quantity, metadata)
      toast.success('Entrada registrada com sucesso')
      return { success: true }
    } catch (err) {
      toast.error(err.message || 'Erro ao registrar entrada')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const applyExit = async (stockItemId, quantity, metadata = {}) => {
    setLoading(true)
    try {
      await applyInventoryExit(stockItemId, quantity, metadata)
      toast.success('Saída registrada com sucesso')
      return { success: true }
    } catch (err) {
      toast.error(err.message || 'Erro ao registrar saída')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const applyAdjustment = async (stockItemId, finalQuantity, metadata = {}) => {
    setLoading(true)
    try {
      await applyInventoryAdjustment(stockItemId, finalQuantity, metadata)
      toast.success('Ajuste realizado com sucesso')
      return { success: true }
    } catch (err) {
      toast.error(err.message || 'Erro ao realizar ajuste')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const applyOrderDeduction = async (orderId, userId) => {
    setLoading(true)
    try {
      await applyOrderInventoryDeduction(orderId, userId)
      return { success: true }
    } catch (err) {
      console.error('Error applying order deduction:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const restoreFromCancellation = async (orderId, userId) => {
    setLoading(true)
    try {
      await restoreInventoryFromCancelledOrder(orderId, userId)
      toast.success('Estoque restaurado após cancelamento')
      return { success: true }
    } catch (err) {
      toast.error('Erro ao restaurar estoque')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createMovement,
    applyEntry,
    applyExit,
    applyAdjustment,
    applyOrderDeduction,
    restoreFromCancellation,
  }
}

export const useItemMovements = (stockItemId, limit = 50) => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMovements = async () => {
      if (!stockItemId) {
        setMovements([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getMovementsByItem(stockItemId, limit)
        setMovements(data)
      } catch (err) {
        console.error('Error fetching item movements:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMovements()
  }, [stockItemId, limit])

  return {
    movements,
    loading,
  }
}

export const useOrderMovements = (orderId) => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMovements = async () => {
      if (!orderId) {
        setMovements([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getMovementsByOrder(orderId)
        setMovements(data)
      } catch (err) {
        console.error('Error fetching order movements:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMovements()
  }, [orderId])

  return {
    movements,
    loading,
  }
}
