import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import { scheduleAdaptivePoll } from '../utils/adaptivePolling'
import {
  closeTableSession,
  createDiningTable,
  deleteDiningTable,
  getTableSession,
  listDiningTables,
  openTableSession,
  requestTableClosure,
  saveTableOrderItems,
  sendTableOrderToKitchen,
  regenerateTableQrToken,
  setTableQrEnabled,
  transferTableSession,
  toggleDiningTableActive,
  updateDiningTable,
} from '../services/tables'

export const useDiningTables = () => {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef(null)

  const refetch = useCallback(async () => {
    try {
      setLoading(true)
      setTables(await listDiningTables())
    } catch (error) {
      console.error('Error loading tables:', error)
      toast.error('Erro ao carregar mesas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    pollRef.current = scheduleAdaptivePoll({
      run: refetch,
      visibleMs: 8000,
      hiddenMs: 45000,
      maxMs: 60000,
    })

    return () => {
      if (pollRef.current) {
        pollRef.current()
        pollRef.current = null
      }
    }
  }, [refetch])

  return { tables, loading, refetch }
}

export const useTableActions = () => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)

  const run = async (action, successMessage) => {
    try {
      setLoading(true)
      const data = await action()
      if (successMessage) toast.success(successMessage)
      return { success: true, data }
    } catch (error) {
      console.error('Table action error:', error)
      toast.error(error.message || 'Erro na acao da mesa')
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createTable: (table) => run(() => createDiningTable(table), 'Mesa criada'),
    updateTable: (tableId, table) => run(() => updateDiningTable(tableId, table), 'Mesa atualizada'),
    toggleTable: (tableId, isActive) => run(() => toggleDiningTableActive(tableId, isActive), isActive ? 'Mesa ativada' : 'Mesa desativada'),
    deleteTable: (tableId) => run(() => deleteDiningTable(tableId), 'Mesa excluida'),
    openSession: (tableId) => run(() => openTableSession({ tableId, attendantId: profile?.id, role: profile?.role }), 'Mesa aberta'),
    loadSession: (sessionId) => run(() => getTableSession(sessionId)),
    saveItems: (session, items, notes) => run(() => saveTableOrderItems({ session, items, attendantId: profile?.id, role: profile?.role, notes }), 'Comanda salva'),
    sendKitchen: (session) => run(() => sendTableOrderToKitchen({ session, attendantId: profile?.id, role: profile?.role }), 'Pedido enviado para cozinha'),
    transferSession: (sessionId, targetUserId) => run(
      () => transferTableSession({ sessionId, targetUserId, currentUserId: profile?.id, role: profile?.role }),
      'Mesa transferida'
    ),
    setQrEnabled: (tableId, enabled) => run(
      () => setTableQrEnabled({ tableId, enabled, userId: profile?.id }),
      enabled ? 'QR Code ativado' : 'QR Code desativado'
    ),
    regenerateQr: (tableId) => run(
      () => regenerateTableQrToken({ tableId, userId: profile?.id }),
      'QR Code regenerado'
    ),
    requestClosure: (sessionId) => run(() => requestTableClosure(sessionId), 'Fechamento solicitado'),
    closeSession: (session, paymentMethod, discountAmount, serviceFee, notes) => run(
      () => closeTableSession({ session, paymentMethod, discountAmount, serviceFee, userId: profile?.id, role: profile?.role, notes }),
      'Mesa fechada e liberada'
    ),
  }
}
