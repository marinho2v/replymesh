import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  assignMotoboyToOrder,
  createMotoboyAdjustment,
  createMotoboy,
  deleteMotoboyAdjustment,
  deleteMotoboy,
  getDeliveryReport,
  listMotoboyAdjustments,
  listDeliveryHistory,
  listMotoboys,
  updateDeliveryStatus,
  updateMotoboy,
} from '../services/motoboys'
import { toast } from 'sonner'

const todayRange = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

export const useMotoboys = (options = {}) => {
  const [motoboys, setMotoboys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMotoboys = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listMotoboys(options)
      setMotoboys(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching motoboys:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(options)])

  useEffect(() => {
    fetchMotoboys()
  }, [fetchMotoboys])

  const saveMotoboy = async (payload) => {
    try {
      const saved = payload.id
        ? await updateMotoboy(payload.id, payload)
        : await createMotoboy(payload)

      setMotoboys(prev => {
        const exists = prev.some(item => item.id === saved.id)
        return exists
          ? prev.map(item => item.id === saved.id ? saved : item)
          : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
      })
      toast.success(payload.id ? 'Motoboy atualizado' : 'Motoboy cadastrado')
      return { success: true, motoboy: saved }
    } catch (err) {
      console.error('Error saving motoboy:', err)
      toast.error('Erro ao salvar motoboy')
      return { success: false }
    }
  }

  const removeMotoboy = async (motoboyId) => {
    try {
      await deleteMotoboy(motoboyId)
      setMotoboys(prev => prev.filter(item => item.id !== motoboyId))
      toast.success('Motoboy removido da lista')
      return { success: true }
    } catch (err) {
      console.error('Error deleting motoboy:', err)
      toast.error('Erro ao remover motoboy')
      return { success: false }
    }
  }

  return { motoboys, loading, error, refetch: fetchMotoboys, saveMotoboy, removeMotoboy }
}

export const useMotoboyOrderActions = () => {
  const [loading, setLoading] = useState(false)

  const assignToOrder = async (orderId, motoboyId, notes) => {
    if (!orderId || !motoboyId || loading) {
      return { success: false }
    }

    try {
      setLoading(true)
      const order = await assignMotoboyToOrder(orderId, motoboyId, notes)
      toast.success('Motoboy vinculado. Mensagem pronta para enviar.')
      return { success: true, order }
    } catch (err) {
      console.error('Error assigning motoboy:', err)
      toast.error('Erro ao vincular motoboy')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  const changeDeliveryStatus = async (orderId, status, notes) => {
    if (!orderId || !status || loading) {
      return { success: false }
    }

    try {
      setLoading(true)
      const order = await updateDeliveryStatus(orderId, status, notes)
      toast.success('Status de entrega atualizado')
      return { success: true, order }
    } catch (err) {
      console.error('Error updating delivery status:', err)
      toast.error('Erro ao atualizar entrega')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  return { assignToOrder, changeDeliveryStatus, loading }
}

export const useDeliveryDashboard = (filters = {}) => {
  const range = useMemo(() => ({
    ...todayRange(),
    ...filters,
  }), [JSON.stringify(filters)])

  const [report, setReport] = useState({ summary: {}, ranking: [] })
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDeliveryData = useCallback(async () => {
    try {
      setLoading(true)
      const [reportData, historyData] = await Promise.all([
        getDeliveryReport(range.startDate, range.endDate),
        listDeliveryHistory({ ...range, limit: 300 }),
      ])

      setReport(reportData || { summary: {}, ranking: [] })
      setHistory(historyData || [])
    } catch (err) {
      console.error('Error fetching delivery dashboard:', err)
      toast.error('Erro ao carregar entregas')
    } finally {
      setLoading(false)
    }
  }, [range.startDate, range.endDate])

  useEffect(() => {
    fetchDeliveryData()
  }, [fetchDeliveryData])

  return {
    summary: report.summary || {},
    ranking: report.ranking || [],
    history,
    loading,
    refetch: fetchDeliveryData,
  }
}

export const useDeliveryHistory = (filters = {}) => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listDeliveryHistory(filters)
      setHistory(data || [])
    } catch (err) {
      console.error('Error fetching delivery history:', err)
      toast.error('Erro ao carregar historico de entregas')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return { history, loading, refetch: fetchHistory }
}

export const useMotoboyAdjustments = (filters = {}) => {
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listMotoboyAdjustments(filters)
      setAdjustments(data || [])
    } catch (err) {
      console.error('Error fetching motoboy adjustments:', err)
      toast.error('Erro ao carregar vales e ajustes')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchAdjustments()
  }, [fetchAdjustments])

  const saveAdjustment = async (payload) => {
    try {
      const saved = await createMotoboyAdjustment(payload)
      setAdjustments(prev => [saved, ...prev])
      toast.success('Lancamento salvo')
      return { success: true, adjustment: saved }
    } catch (err) {
      console.error('Error saving motoboy adjustment:', err)
      toast.error('Erro ao salvar lancamento')
      return { success: false }
    }
  }

  const removeAdjustment = async (adjustmentId) => {
    try {
      await deleteMotoboyAdjustment(adjustmentId)
      setAdjustments(prev => prev.filter(item => item.id !== adjustmentId))
      toast.success('Lancamento removido')
      return { success: true }
    } catch (err) {
      console.error('Error deleting motoboy adjustment:', err)
      toast.error('Erro ao remover lancamento')
      return { success: false }
    }
  }

  return { adjustments, loading, refetch: fetchAdjustments, saveAdjustment, removeAdjustment }
}
