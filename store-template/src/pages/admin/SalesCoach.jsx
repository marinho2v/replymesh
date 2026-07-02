import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bot, Calendar, Filter, Lightbulb, RefreshCw, Search, Sparkles, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { getSalesCoach, formatMoney } from '../../services/marketingWhatsapp'

const priorityTone = {
  Critica: 'border-red-500/40 bg-red-500/10 text-red-200',
  Alta: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  Media: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200',
  Baixa: 'border-green-500/40 bg-green-500/10 text-green-200',
}

export default function SalesCoach() {
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState(null)
  const [filters, setFilters] = useState({ category: 'Todas', priority: 'Todas', search: '' })

  const loadCoach = async () => {
    try {
      setLoading(true)
      const data = await getSalesCoach()
      setPayload(data)
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel carregar o AI Sales Coach.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCoach() }, [])

  const insights = payload?.insights || []
  const summary = payload?.summary || {}
  const categories = ['Todas', ...(payload?.filters?.categories || [])]
  const priorities = ['Todas', ...(payload?.filters?.priorities || [])]

  const filteredInsights = useMemo(() => (
    insights.filter((item) => {
      const matchesCategory = filters.category === 'Todas' || item.category === filters.category
      const matchesPriority = filters.priority === 'Todas' || item.priority === filters.priority
      const term = filters.search.trim().toLowerCase()
      const matchesSearch = !term || [item.title, item.description, item.suggested_action, item.origin].join(' ').toLowerCase().includes(term)
      return matchesCategory && matchesPriority && matchesSearch
    })
  ), [insights, filters])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-400">Marketing inteligente</p>
          <h1 className="mt-2 text-3xl font-black text-white">AI Sales Coach</h1>
          <p className="text-gray-400">A IA observa sua operacao, encontra oportunidades e recomenda proximas acoes sem executar nada sozinha.</p>
        </div>
        <Button variant="secondary" onClick={loadCoach} disabled={loading}>
          <RefreshCw size={16} className="mr-2" />
          {loading ? 'Atualizando...' : 'Atualizar analise'}
        </Button>
      </div>

      <Card className="border-primary-500/30 bg-gradient-to-br from-primary-500/15 via-dark-900 to-dark-950">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-primary-500 p-3 text-dark-950"><Bot size={24} /></span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-300">Coach ativo</p>
              <h2 className="mt-1 text-2xl font-black text-white">{summary.biggest_opportunity || 'Aguardando dados da loja'}</h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-300">
                Ultima analise: {summary.last_analysis_at ? new Date(summary.last_analysis_at).toLocaleString('pt-BR') : 'ainda nao executada'}.
                Nesta fase o coach apenas recomenda; nenhuma acao e disparada automaticamente.
              </p>
            </div>
          </div>
          <div className="grid min-w-[280px] gap-2 rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
            <span className="text-sm text-gray-400">Impacto estimado</span>
            <strong className="text-2xl text-white">{summary.estimated_impact || formatMoney(0)}</strong>
            <span className="text-xs text-gray-500">{summary.insights_count || 0} insight(s) encontrados</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={Lightbulb} label="Insights" value={summary.insights_count || 0} />
        <Metric icon={AlertTriangle} label="Prioridade alta" value={summary.high_priority_count || 0} />
        <Metric icon={TrendingUp} label="Maior oportunidade" value={summary.biggest_opportunity || '-'} compact />
        <Metric icon={AlertTriangle} label="Maior risco" value={summary.biggest_risk || '-'} compact />
        <Metric icon={Calendar} label="Ultima analise" value={summary.last_analysis_at ? new Date(summary.last_analysis_at).toLocaleTimeString('pt-BR') : '-'} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-dark-700 bg-dark-950 px-3 py-2 text-gray-300">
              <Search size={16} />
              <input
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
                placeholder="Buscar insight, origem ou acao..."
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400"><Filter size={16} />Filtros</div>
            <Select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
              {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-dark-800" />)}
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="rounded-2xl border border-dark-700 bg-dark-950 p-8 text-center text-gray-400">
              Nenhum insight encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredInsights.map((item, index) => (
                <InsightCard key={`${item.origin}-${item.title}-${index}`} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="mt-1 text-primary-400" />
            <div>
              <h3 className="text-lg font-black text-white">Aprendizado preparado</h3>
              <p className="mt-1 text-sm text-gray-400">
                A estrutura ja esta pronta para futuramente registrar sugestoes aplicadas, ignoradas e impacto em vendas.
                Nesta fase o painel apenas observa, analisa e recomenda.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const Metric = ({ icon: Icon, label, value, compact = false }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-primary-500/15 p-2 text-primary-300"><Icon size={18} /></span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.12em] text-gray-500">{label}</p>
          <p className={`mt-1 font-black text-white ${compact ? 'truncate text-sm' : 'text-xl'}`}>{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

const InsightCard = ({ item }) => (
  <article className="rounded-2xl border border-dark-700 bg-dark-950 p-4 transition hover:border-primary-500/40">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${priorityTone[item.priority] || priorityTone.Baixa}`}>
            {item.priority}
          </span>
          <span className="rounded-full bg-dark-800 px-2.5 py-1 text-xs font-bold text-gray-300">{item.category}</span>
          <span className="rounded-full bg-dark-800 px-2.5 py-1 text-xs font-bold text-gray-400">{item.confidence}% confianca</span>
        </div>
        <h2 className="mt-3 text-lg font-black text-white">{item.title}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-400">{item.description}</p>
      </div>
      <div className="rounded-xl border border-dark-700 bg-dark-900 px-3 py-2 text-right">
        <p className="text-xs text-gray-500">Impacto</p>
        <p className="font-black text-white">{item.impact}</p>
      </div>
    </div>
    <div className="mt-4 rounded-xl border border-primary-500/20 bg-primary-500/10 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-300">Sugestao</p>
      <p className="mt-1 text-sm text-gray-200">{item.suggested_action}</p>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
      <span>Origem: {item.origin}</span>
      <span>Data: {item.date ? new Date(item.date).toLocaleString('pt-BR') : '-'}</span>
      <span>Nao executa automatico</span>
    </div>
  </article>
)
