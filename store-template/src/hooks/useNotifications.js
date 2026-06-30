import { useCallback, useEffect, useState } from 'react'
import { request } from '../services/replymeshApi'
import { scheduleAdaptivePoll } from '../utils/adaptivePolling'

const POLL_INTERVAL_MS = 60_000 // 1 minuto
const HIDDEN_POLL_INTERVAL_MS = 5 * 60_000

export const useNotifications = ({ enabled = true } = {}) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!enabled) return
    try {
      setLoading(true)
      const data = await request('/store/notifications')
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count ?? 0)
    } catch {
      // silencioso — não quebra o painel
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    fetch()
    const stopPolling = scheduleAdaptivePoll({
      run: fetch,
      visibleMs: POLL_INTERVAL_MS,
      hiddenMs: HIDDEN_POLL_INTERVAL_MS,
      maxMs: HIDDEN_POLL_INTERVAL_MS,
      enabled,
    })
    window.addEventListener('replymesh:notifications-refresh', fetch)
    return () => {
      stopPolling()
      window.removeEventListener('replymesh:notifications-refresh', fetch)
    }
  }, [fetch, enabled])

  const markRead = useCallback(async (id) => {
    try {
      await request(`/store/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* silencioso */ }
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await request('/store/notifications/read_all', { method: 'PATCH' })
      setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })))
      setUnreadCount(0)
    } catch { /* silencioso */ }
  }, [])

  const clearAll = useCallback(async () => {
    await request('/store/notifications/clear_all', { method: 'DELETE' })
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return { notifications, unreadCount, loading, refetch: fetch, markRead, markAllRead, clearAll }
}
