import { useCallback, useEffect, useState } from 'react'
import {
  addCashMovement,
  closeCashSession,
  getCashMovements,
  getCashSessionSummary,
  getCashSessions,
  getOpenCashSession,
  openCashSession,
} from '../services/cashRegister'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

export const useCashRegister = () => {
  const { user } = useAuth()
  const [openSession, setOpenSession] = useState(null)
  const [sessions, setSessions] = useState([])
  const [movements, setMovements] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      const current = await getOpenCashSession()
      const [sessionList, movementList, sessionSummary] = await Promise.all([
        getCashSessions({ limit: 30 }),
        getCashMovements({ sessionId: current?.id, limit: 200 }),
        getCashSessionSummary(current?.id),
      ])

      setOpenSession(current)
      setSessions(sessionList)
      setMovements(movementList)
      setSummary(sessionSummary)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const openSessionAction = async ({ openingAmount, notes }) => {
    try {
      setActionLoading(true)
      await openCashSession({ openingAmount, notes, userId: user?.id })
      toast.success('Caixa aberto com sucesso')
      await refetch()
      return { success: true }
    } catch (err) {
      toast.error(err.message || 'Erro ao abrir caixa')
      return { success: false, error: err.message }
    } finally {
      setActionLoading(false)
    }
  }

  const addMovementAction = async ({ type, amount, affectsPhysicalCash, notes }) => {
    if (!openSession?.id) {
      toast.error('Abra um caixa antes de registrar movimentacoes')
      return { success: false }
    }

    try {
      setActionLoading(true)
      await addCashMovement({
        cashSessionId: openSession.id,
        type,
        amount,
        affectsPhysicalCash,
        userId: user?.id,
        notes,
      })
      toast.success('Movimentacao registrada')
      await refetch()
      return { success: true }
    } catch (err) {
      toast.error(err.message || 'Erro ao registrar movimentacao')
      return { success: false, error: err.message }
    } finally {
      setActionLoading(false)
    }
  }

  const closeSessionAction = async ({ countedAmount, notes }) => {
    if (!openSession?.id) {
      toast.error('Nao existe caixa aberto')
      return { success: false }
    }

    try {
      setActionLoading(true)
      await closeCashSession({
        cashSessionId: openSession.id,
        countedAmount,
        userId: user?.id,
        notes,
      })
      toast.success('Caixa fechado com sucesso')
      await refetch()
      return { success: true }
    } catch (err) {
      toast.error(err.message || 'Erro ao fechar caixa')
      return { success: false, error: err.message }
    } finally {
      setActionLoading(false)
    }
  }

  return {
    openSession,
    sessions,
    movements,
    summary,
    loading,
    actionLoading,
    error,
    refetch,
    openSessionAction,
    addMovementAction,
    closeSessionAction,
  }
}
