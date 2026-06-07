import { useEffect, useState } from 'react'
import { railsGetWhatsappLogs } from '../../services/storeApi'
import { toast } from 'sonner'

const levelClass = {
  ok: 'border-green-500/40 text-green-300',
  info: 'border-blue-500/40 text-blue-300',
  warn: 'border-yellow-500/40 text-yellow-300',
  err: 'border-red-500/40 text-red-300',
}

const WhatsappLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    railsGetWhatsappLogs()
      .then(setLogs)
      .catch((error) => toast.error(error.message || 'Erro ao carregar logs'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Logs WhatsApp</h1>
        <p className="text-sm text-gray-400">Eventos da empresa atual, com dados sensiveis mascarados no backend.</p>
      </div>

      <div className="rounded-xl border border-dark-700 bg-dark-900">
        <div className="divide-y divide-dark-700">
          {loading ? (
            <p className="p-5 text-gray-400">Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="p-5 text-gray-400">Nenhum log WhatsApp encontrado.</p>
          ) : logs.map((log) => (
            <div key={log.id} className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${levelClass[log.level] || 'border-dark-600 text-gray-300'}`}>
                  {log.level}
                </span>
                <span className="text-sm text-gray-500">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                {log.instance_name && <span className="text-sm text-gray-400">{log.instance_name}</span>}
              </div>
              <p className="mt-3 text-white">{log.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default WhatsappLogs
