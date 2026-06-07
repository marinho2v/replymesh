import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ShoppingBag, LifeBuoy, Megaphone, MessageSquare, Package, Wallet, AlertTriangle, Trash2, X } from 'lucide-react'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'

const TYPE_ICON = {
  order:         <ShoppingBag size={15} />,
  ticket:        <LifeBuoy size={15} />,
  system_update: <Megaphone size={15} />,
  whatsapp:      <MessageSquare size={15} />,
  stock:         <Package size={15} />,
  cash:          <Wallet size={15} />,
  system_alert:  <AlertTriangle size={15} />,
  billing:       <AlertTriangle size={15} />,
}

const TYPE_COLOR = {
  order:         'bg-blue-500/15 text-blue-400',
  ticket:        'bg-yellow-500/15 text-yellow-400',
  system_update: 'bg-purple-500/15 text-purple-400',
  whatsapp:      'bg-green-500/15 text-green-400',
  stock:         'bg-orange-500/15 text-orange-400',
  cash:          'bg-emerald-500/15 text-emerald-400',
  system_alert:  'bg-red-500/15 text-red-400',
  billing:       'bg-red-500/15 text-red-400',
}

const relativeTime = (iso) => {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

const NotificationsDropdown = ({ open, onClose, notifications, unreadCount, onMarkRead, onMarkAllRead, onClearAll }) => {
  const ref = useRef(null)
  const navigate = useNavigate()
  const basePath = useCompanyBasePath()

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleClick = (notification) => {
    if (!notification.read) onMarkRead(notification.id)
    if (notification.link_url) {
      onClose()
      const url = notification.link_url.startsWith('/admin')
        ? `${basePath}${notification.link_url}`
        : notification.link_url
      navigate(url)
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Limpar todas as notificacoes deste painel?')) return
    await onClearAll()
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-dark-600 bg-dark-800 shadow-2xl"
      style={{ maxHeight: '480px', display: 'flex', flexDirection: 'column' }}
    >
      {/* header */}
      <div className="flex items-center justify-between border-b border-dark-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-gray-400" />
          <span className="text-sm font-bold text-white">Notificações</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              onClick={handleClear}
              title="Limpar notificacoes"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
            >
              <Trash2 size={13} />
              Limpar
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              title="Marcar todas como lidas"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 hover:bg-dark-700 hover:text-white transition-colors"
            >
              <CheckCheck size={13} />
              Todas lidas
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell size={28} className="mb-2 text-gray-600" />
            <p className="text-sm text-gray-400">Nenhuma notificação</p>
          </div>
        ) : (
          notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full flex items-start gap-3 border-b border-dark-700/60 px-4 py-3 text-left transition-colors hover:bg-dark-700/50 ${
                !n.read ? 'bg-dark-700/20' : ''
              }`}
            >
              <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TYPE_COLOR[n.notification_type] || 'bg-gray-500/15 text-gray-400'}`}>
                {TYPE_ICON[n.notification_type] || <Bell size={15} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-semibold leading-snug ${n.read ? 'text-gray-300' : 'text-white'}`}>
                    {n.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-gray-500">{relativeTime(n.created_at)}</span>
                </div>
                {n.message && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{n.message}</p>
                )}
              </div>
              {!n.read && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-yellow-400" />
              )}
            </button>
          ))
        )}
      </div>

      {/* footer */}
      <div className="border-t border-dark-700 p-2">
        <button
          onClick={() => { navigate(`${basePath}/admin/updates`); onClose() }}
          className="w-full rounded-lg px-3 py-2 text-center text-xs text-gray-400 hover:bg-dark-700 hover:text-white transition-colors"
        >
          Ver atualizações do sistema
        </button>
      </div>
    </div>
  )
}

export default NotificationsDropdown
