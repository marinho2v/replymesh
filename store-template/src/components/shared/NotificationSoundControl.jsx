import { Bell, BellOff, Volume2 } from 'lucide-react'
import { Button } from '../ui/Button'

const NotificationSoundControl = ({
  enabled,
  browserNotificationsSupported,
  browserNotificationsEnabled,
  lastError,
  lastBrowserNotificationError,
  onEnable,
  onEnableBrowserNotifications,
  onDisableBrowserNotifications,
  onDisable,
  onTest,
  className = '',
}) => (
  <div className={`rounded-lg border border-dark-700 bg-dark-900 p-3 ${className}`}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${enabled ? 'bg-green-900/40 text-green-300' : 'bg-yellow-900/40 text-yellow-300'}`}>
          {enabled ? <Bell size={20} /> : <BellOff size={20} />}
        </span>
        <div>
          <p className="font-semibold text-white">
            Som de novos pedidos {enabled ? 'ativo' : 'desativado'}
          </p>
          <p className="text-sm text-gray-400">
            Ative uma vez neste navegador para liberar o audio das notificacoes.
          </p>
          {lastError && (
            <p className="mt-1 text-xs text-yellow-300">{lastError}</p>
          )}
          {browserNotificationsSupported && (
            <p className="mt-1 text-sm text-gray-400">
              Notificacao do navegador {browserNotificationsEnabled ? 'ativa' : 'desativada'} para avisar mesmo com a aba em segundo plano.
            </p>
          )}
          {lastBrowserNotificationError && (
            <p className="mt-1 text-xs text-yellow-300">{lastBrowserNotificationError}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {enabled ? (
          <Button type="button" variant="outline" size="sm" onClick={onDisable}>
            <BellOff size={16} className="mr-2" />
            Silenciar
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={onEnable}>
            <Bell size={16} className="mr-2" />
            Ativar som
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={onTest}>
          <Volume2 size={16} className="mr-2" />
          Testar som
        </Button>
        {browserNotificationsSupported && (
          browserNotificationsEnabled ? (
            <Button type="button" variant="outline" size="sm" onClick={onDisableBrowserNotifications}>
              Desativar aviso do navegador
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={onEnableBrowserNotifications}>
              Ativar aviso do navegador
            </Button>
          )
        )}
      </div>
    </div>
  </div>
)

export default NotificationSoundControl
