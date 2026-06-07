import { useCallback, useEffect, useRef, useState } from 'react'
import { request } from '../services/replymeshApi'
import { useCompanySlug } from '../contexts/CompanySlugContext'

const POLL_INTERVAL_MS = 5_000  // 5 segundos
const MAX_POLLS        = 120    // até 10 minutos

export const usePixPayment = (orderId, { enabled = false } = {}) => {
  const [status, setStatus]         = useState('pending_payment')
  const [orderStatus, setOrderStatus] = useState('pending')
  const [expiresAt, setExpiresAt] = useState(null)
  const [expired, setExpired] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [confirmed, setConfirmed]   = useState(false)
  const slug = useCompanySlug()
  const pollCount = useRef(0)
  const timer     = useRef(null)

  const check = useCallback(async () => {
    if (!orderId || !enabled) return
    if (pollCount.current >= MAX_POLLS) {
      clearInterval(timer.current)
      return
    }
    pollCount.current += 1
    try {
      const data = await request(`/public/${slug}/payments/${orderId}/status`, { token: null })
      setStatus(data.payment_status)
      setOrderStatus(data.order_status)
      setExpiresAt(data.expires_at || null)
      setExpired(Boolean(data.expired || data.payment_status === 'expired'))
      setCancelled(Boolean(data.cancelled || data.order_status === 'cancelled'))
      if (data.payment_status === 'paid' || data.order_status === 'accepted') {
        setConfirmed(true)
        clearInterval(timer.current)
      } else if (data.expired || data.cancelled || ['expired', 'cancelled', 'failed'].includes(data.payment_status)) {
        clearInterval(timer.current)
      }
    } catch {
      // silencioso
    }
  }, [orderId, enabled, slug])

  useEffect(() => {
    if (!enabled || !orderId) return
    check()
    timer.current = setInterval(check, POLL_INTERVAL_MS)
    return () => clearInterval(timer.current)
  }, [check, enabled, orderId])

  const refresh = useCallback(() => check(), [check])

  return { status, orderStatus, confirmed, expired, cancelled, expiresAt, refresh }
}
