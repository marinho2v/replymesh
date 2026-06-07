import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const STORAGE_KEY = 'orderNotificationSoundEnabled'
const BROWSER_NOTIFICATION_KEY = 'orderBrowserNotificationsEnabled'
const NOTIFIED_KEY_PREFIX = 'notified-order-ids'
const SOUND_URL = '/notification.mp3'

const playBeep = async () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) throw new Error('AudioContext indisponivel')

  const audioContext = new AudioContext()
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  oscillator.frequency.value = 880
  oscillator.type = 'sine'
  gainNode.gain.setValueAtTime(0.45, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.55)
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.55)
}

export const useNotificationSound = (scope = 'global') => {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(() => (
    localStorage.getItem(BROWSER_NOTIFICATION_KEY) === 'true'
  ))
  const [lastError, setLastError] = useState('')
  const [lastBrowserNotificationError, setLastBrowserNotificationError] = useState('')
  const audioRef = useRef(null)
  const browserNotificationsSupported = typeof window !== 'undefined' && 'Notification' in window
  const notifiedIdsRef = useRef(new Set())
  const scopeStorageKey = `${NOTIFIED_KEY_PREFIX}:${scope}`

  useEffect(() => {
    try {
      const savedIds = JSON.parse(sessionStorage.getItem(scopeStorageKey) || '[]')
      notifiedIdsRef.current = new Set(savedIds)
    } catch {
      notifiedIdsRef.current = new Set()
    }

    const audio = new Audio(SOUND_URL)
    audio.preload = 'auto'
    audio.volume = 1
    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [scopeStorageKey])

  const persistNotifiedIds = useCallback(() => {
    const ids = Array.from(notifiedIdsRef.current).slice(-200)
    notifiedIdsRef.current = new Set(ids)
    sessionStorage.setItem(scopeStorageKey, JSON.stringify(ids))
  }, [scopeStorageKey])

  const playSound = useCallback(async (reason = 'test') => {
    setLastError('')
    console.log('[notification-sound] tentando tocar audio', { scope, reason, enabled })

    try {
      const audio = audioRef.current || new Audio(SOUND_URL)
      audio.currentTime = 0
      audio.volume = 1
      await audio.play()
      console.log('[notification-sound] audio mp3 tocou com sucesso', { scope, reason })
      return true
    } catch (audioError) {
      console.warn('[notification-sound] mp3 falhou, tentando beep', {
        scope,
        reason,
        message: audioError?.message,
        name: audioError?.name,
      })

      try {
        await playBeep()
        console.log('[notification-sound] beep tocou com sucesso', { scope, reason })
        return true
      } catch (beepError) {
        const message = beepError?.message || audioError?.message || 'Audio bloqueado pelo navegador'
        setLastError(message)
        console.warn('[notification-sound] audio bloqueado ou indisponivel', { scope, reason, message })
        return false
      }
    }
  }, [enabled, scope])

  const showBrowserNotification = useCallback((order) => {
    if (!browserNotificationsSupported || !browserNotificationsEnabled || !order?.id) {
      return false
    }

    if (Notification.permission !== 'granted') {
      return false
    }

    try {
      const title = `Novo pedido #${order.order_number || ''}`.trim()
      const body = [
        order.customer_name || 'Cliente',
        order.order_type === 'dine_in'
          ? 'Consumo no local'
          : order.order_type === 'pickup'
            ? 'Retirada'
            : 'Entrega',
        order.total ? `Total: R$ ${Number(order.total).toFixed(2).replace('.', ',')}` : null,
      ].filter(Boolean).join(' • ')

      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        tag: `order-${order.id}`,
        renotify: true,
        requireInteraction: false,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return true
    } catch (error) {
      const message = error?.message || 'Nao foi possivel mostrar a notificacao do navegador'
      setLastBrowserNotificationError(message)
      console.warn('[notification-sound] erro ao exibir notificacao do navegador', { scope, message })
      return false
    }
  }, [browserNotificationsEnabled, browserNotificationsSupported, scope])

  const enableSound = useCallback(async () => {
    const ok = await playSound('enable')
    localStorage.setItem(STORAGE_KEY, 'true')
    setEnabled(true)

    if (ok) {
      toast.success('Som das notificacoes ativado')
    } else {
      toast.warning('Som ativado, mas o navegador ainda bloqueou o teste. Clique em Testar som.')
    }
  }, [playSound])

  const enableBrowserNotifications = useCallback(async () => {
    if (!browserNotificationsSupported) {
      const message = 'Este navegador nao suporta notificacoes nativas'
      setLastBrowserNotificationError(message)
      toast.error(message)
      return false
    }

    setLastBrowserNotificationError('')

    try {
      let permission = Notification.permission
      if (permission !== 'granted') {
        permission = await Notification.requestPermission()
      }

      const granted = permission === 'granted'
      localStorage.setItem(BROWSER_NOTIFICATION_KEY, granted ? 'true' : 'false')
      setBrowserNotificationsEnabled(granted)

      if (granted) {
        toast.success('Notificacoes do navegador ativadas')
        return true
      }

      const message = 'Permissao de notificacao negada pelo navegador'
      setLastBrowserNotificationError(message)
      toast.warning(message)
      return false
    } catch (error) {
      const message = error?.message || 'Erro ao ativar notificacoes do navegador'
      setLastBrowserNotificationError(message)
      toast.error(message)
      return false
    }
  }, [browserNotificationsSupported])

  const disableBrowserNotifications = useCallback(() => {
    localStorage.setItem(BROWSER_NOTIFICATION_KEY, 'false')
    setBrowserNotificationsEnabled(false)
    toast.info('Notificacoes do navegador desativadas')
  }, [])

  const disableSound = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'false')
    setEnabled(false)
    toast.info('Som das notificacoes silenciado')
  }, [])

  const testSound = useCallback(async () => {
    const ok = await playSound('manual-test')
    if (ok) {
      toast.success('Teste de som executado')
    } else {
      toast.error('Nao foi possivel tocar o som. Clique novamente ou confira permissao do navegador.')
    }
  }, [playSound])

  const notifyNewOrder = useCallback(async (order) => {
    if (!order?.id) return false

    if (notifiedIdsRef.current.has(order.id)) {
      console.log('[notification-sound] pedido ja notificado, ignorando', { scope, orderId: order.id })
      return false
    }

    notifiedIdsRef.current.add(order.id)
    persistNotifiedIds()
    console.log('[notification-sound] novo pedido detectado', {
      scope,
      orderId: order.id,
      orderNumber: order.order_number,
      enabled,
    })

    toast.success(`Novo pedido #${order.order_number} de ${order.customer_name}`)
    showBrowserNotification(order)

    if (!enabled) {
      console.log('[notification-sound] som desativado; exibindo apenas toast', { scope, orderId: order.id })
      return false
    }

    return playSound(`new-order-${order.id}`)
  }, [enabled, persistNotifiedIds, playSound, scope, showBrowserNotification])

  return {
    enabled,
    browserNotificationsSupported,
    browserNotificationsEnabled,
    lastError,
    lastBrowserNotificationError,
    enableSound,
    enableBrowserNotifications,
    disableBrowserNotifications,
    disableSound,
    testSound,
    notifyNewOrder,
  }
}
