import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bot, CheckCircle2, ChevronLeft, Clock3, RefreshCw, ShoppingBag } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { railsGetStoreAiLogs } from '../../services/storeApi'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'

const periods = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7days', label: '7 dias' },
]

const statusStyle = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  handoff: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  fallback: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  blocked: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
}

const formatDate = (value) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

const StoreAiLogs = () => {
  const basePath = useCompanyBasePath()
  const [period, setPeriod] = useState('today')
  const [logs, setLogs] = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = await railsGetStoreAiLogs(period)
      setLogs(payload.logs || [])
      setCompany(payload.company || null)
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar os logs da IA.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [period])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to={`${basePath}/admin/ai`} className="mb-3 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <ChevronLeft size={16} />
            Voltar para Inteligencia Artificial
          </Link>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Logs da Inteligencia Artificial</h1>
          <p className="mt-1 text-sm text-gray-400">
            Acompanhe conversas, respostas, pedidos e falhas da IA de {company?.name || 'sua empresa'}.
          </p>
        </div>
        <Button type="button" onClick={load} loading={loading}>
          <RefreshCw size={17} className="mr-2" />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {periods.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setPeriod(item.value)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  period === item.value
                    ? 'bg-white text-black'
                    : 'border border-dark-600 text-gray-300 hover:border-dark-400'
                }`}
              >
                {item.label}
              </button>
            ))}
            <span className="ml-auto rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-xs text-gray-400">
              Empresa: {company?.name || 'carregando...'}
            </span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}

      <div className="space-y-3">
        {!loading && logs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-gray-400">Nenhuma conversa encontrada neste periodo.</CardContent>
          </Card>
        )}

        {logs.map((log) => {
          const tone = statusStyle[log.status] || 'border-dark-600 bg-dark-900 text-gray-300'
          return (
            <Card key={log.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${tone}`}>
                        {log.status || 'success'}
                      </span>
                      {log.order_created && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
                          <ShoppingBag size={13} />
                          Pedido #{log.order_number}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-dark-700 bg-dark-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Cliente</p>
                        <p className="mt-1 font-semibold text-white">{log.customer || 'Cliente WhatsApp'} · {log.phone}</p>
                        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">Pergunta</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-200">{log.question || '-'}</p>
                      </div>
                      <div className="rounded-xl border border-dark-700 bg-dark-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Resposta</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-200">{log.answer || '-'}</p>
                        {(log.error || log.reason) && (
                          <div className="mt-4 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                            <AlertTriangle size={15} className="shrink-0" />
                            <span>{log.reason || log.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid min-w-[220px] grid-cols-2 gap-2 xl:grid-cols-1">
                    <div className="rounded-xl border border-dark-700 bg-dark-900 p-3 text-sm">
                      <p className="flex items-center gap-2 text-gray-500"><Bot size={15} /> Provider</p>
                      <p className="mt-1 font-semibold text-white">{log.provider || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-dark-700 bg-dark-900 p-3 text-sm">
                      <p className="flex items-center gap-2 text-gray-500"><Clock3 size={15} /> Tempo</p>
                      <p className="mt-1 font-semibold text-white">{log.response_time_ms || 0} ms</p>
                    </div>
                    <div className="rounded-xl border border-dark-700 bg-dark-900 p-3 text-sm">
                      <p className="flex items-center gap-2 text-gray-500"><CheckCircle2 size={15} /> Tokens</p>
                      <p className="mt-1 font-semibold text-white">{log.tokens || 0}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default StoreAiLogs
