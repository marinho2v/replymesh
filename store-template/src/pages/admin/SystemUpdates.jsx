import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  Megaphone,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { request } from '../../services/replymeshApi'

const FILTERS = [
  ['all', 'Todas'],
  ['news', 'Novidades'],
  ['improvement', 'Melhorias'],
  ['fix', 'Correcoes'],
  ['warning', 'Avisos'],
]

const TYPE = {
  news: { label: 'Novidade', icon: Sparkles, classes: 'bg-purple-500/15 text-purple-300 border-purple-500/25' },
  improvement: { label: 'Melhoria', icon: Megaphone, classes: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  fix: { label: 'Correcao', icon: Wrench, classes: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  warning: { label: 'Aviso', icon: AlertTriangle, classes: 'bg-red-500/15 text-red-300 border-red-500/25' },
  maintenance: { label: 'Manutencao', icon: Clock3, classes: 'bg-gray-500/15 text-gray-300 border-gray-500/25' },
}

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  : ''

function UpdateCard({ item, latest, onRead }) {
  const [open, setOpen] = useState(false)
  const config = TYPE[item.update_type] || TYPE.improvement
  const TypeIcon = config.icon

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next && !item.read) await onRead(item.id)
  }

  return (
    <article className={`overflow-hidden rounded-xl border bg-dark-900 transition ${item.is_featured ? 'border-purple-500/40' : 'border-dark-700'}`}>
      <button type="button" onClick={toggle} className="flex w-full items-start gap-3 p-4 text-left hover:bg-dark-800/60">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${config.classes}`}>
          <TypeIcon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <strong className="text-sm text-white">{item.title}</strong>
            <span className="rounded-full border border-dark-600 px-2 py-0.5 font-mono text-[10px] text-gray-400">{item.version}</span>
            {latest && <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-300">Mais recente</span>}
            {!item.read && <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase text-black">Nao lida</span>}
          </span>
          <span className="mt-1 block text-sm leading-5 text-gray-400">{item.short_description}</span>
          <span className="mt-2 flex items-center gap-2 text-xs text-gray-500"><span className={`rounded-md border px-1.5 py-0.5 ${config.classes}`}>{config.label}</span>{formatDate(item.published_at)}</span>
        </span>
        {open ? <ChevronDown size={18} className="mt-1 shrink-0 text-gray-500" /> : <ChevronRight size={18} className="mt-1 shrink-0 text-gray-500" />}
      </button>

      {open && (
        <div className="border-t border-dark-700 bg-dark-950/40 px-4 py-4">
          {item.image_url && <img src={item.image_url} alt="" className="mb-4 max-h-64 w-full rounded-lg object-cover" />}
          <div className="whitespace-pre-wrap text-sm leading-6 text-gray-300">{item.content}</div>
          {item.link_url && (
            <a href={item.link_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-yellow-300 hover:text-yellow-200">
              Saiba mais <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}
    </article>
  )
}

export default function SystemUpdates() {
  const [updates, setUpdates] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await request('/store/system_updates')
      setUpdates(response.system_updates || [])
      setUnreadCount(response.unread_count || 0)
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar as atualizacoes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const visible = useMemo(
    () => filter === 'all' ? updates : updates.filter((item) => item.update_type === filter),
    [filter, updates],
  )

  const read = async (id) => {
    try {
      await request(`/store/system_updates/${id}/read`, { method: 'POST' })
      setUpdates((items) => items.map((item) => item.id === id ? { ...item, read: true, read_at: new Date().toISOString() } : item))
      setUnreadCount((count) => Math.max(0, count - 1))
      window.dispatchEvent(new CustomEvent('replymesh:notifications-refresh'))
    } catch {
      // O detalhe pode continuar aberto mesmo se a confirmacao de leitura falhar.
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Atualizacoes do sistema</h1>
          <p className="mt-1 text-sm text-gray-400">Novidades, melhorias e correcoes da Replymesh.</p>
        </div>
        {unreadCount > 0 && <span className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black"><Bell size={14} />{unreadCount} nao {unreadCount === 1 ? 'lida' : 'lidas'}</span>}
      </header>

      <div className="flex items-center gap-3 rounded-xl border border-green-700/40 bg-green-900/15 px-4 py-3">
        <CheckCircle2 size={20} className="shrink-0 text-green-400" />
        <div><p className="text-sm font-semibold text-green-300">Sistema atualizado</p><p className="text-xs text-green-400/80">Sua loja esta usando a versao local mais recente da Replymesh.</p></div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-dark-700 pb-3">
        {FILTERS.map(([value, label]) => (
          <button key={value} onClick={() => setFilter(value)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === value ? 'bg-yellow-400 text-black' : 'bg-dark-900 text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dark-700 bg-dark-900 text-gray-400"><span className="h-8 w-8 animate-spin rounded-full border-2 border-dark-600 border-t-yellow-400" /><p className="text-sm">Carregando atualizacoes...</p></div>}
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">{error}<button onClick={load} className="ml-2 font-bold underline">Tentar novamente</button></div>}
      {!loading && !error && visible.length === 0 && <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-dark-600 bg-dark-900 text-center"><Megaphone size={30} className="mb-3 text-gray-600" /><p className="font-semibold text-gray-300">Nenhuma atualizacao encontrada</p><p className="mt-1 text-sm text-gray-500">Novidades desse tipo aparecerao aqui.</p></div>}

      {!loading && !error && <div className="space-y-3">{visible.map((item, index) => <UpdateCard key={item.id} item={item} latest={index === 0 && filter === 'all'} onRead={read} />)}</div>}
    </div>
  )
}
