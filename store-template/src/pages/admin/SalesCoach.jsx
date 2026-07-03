import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Archive, Bot, Calendar, CheckCircle2, Filter, Lightbulb, RefreshCw, Search, Sparkles, ThumbsDown, ThumbsUp, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { getSalesCoach, updateSalesCoachInsight, formatMoney } from '../../services/marketingWhatsapp'

const priorityTone = {
  Critica: 'border-red-500/40 bg-red-500/10 text-red-200',
  Alta: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  Media: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200',
  Baixa: 'border-green-500/40 bg-green-500/10 text-green-200',
}

export default function SalesCoach() {
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [payload, setPayload] = useState(null)
  const [filters, setFilters] = useState({ category: 'Todas', priority: 'Todas', search: '' })

  const loadCoach = async () => {
    try {
      setLoading(true)
      const data = await getSalesCoach()
      setPayload(data)
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel carregar o consultor de vendas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCoach() }, [])

  const updateInsight = async (item, update, successMessage) => {
    if (!item.id) {
      toast.error('Insight ainda nao possui identificador para feedback.')
      return
    }

    try {
      setSavingId(`${item.id}-${Object.keys(update).join('-')}`)
      await updateSalesCoachInsight(item.id, update)
      toast.success(successMessage)
      await loadCoach()
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel salvar o feedback.')
    } finally {
      setSavingId(null)
    }
  }

  const insights = payload?.insights || []
  const summary = payload?.summary || {}
  const advisor = payload?.learning_advisor || {}
  const history = payload?.history || {}
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
          <h1 className="mt-2 text-3xl font-black text-white">Consultor de Vendas</h1>
          <p className="text-gray-400">A Replymesh observa sua operacao, encontra oportunidades e recomenda proximas acoes sem executar nada sozinha.</p>
        </div>
        <Button variant="secondary" onClick={loadCoach} disabled={loading}>
          <RefreshCw size={16} className="mr-2" />
          {loading ? 'Atualizando...' : 'Atualizar analise'}
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-primary-500 p-3 text-dark-950"><Bot size={24} /></span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-300">Analise ativa</p>
              <h2 className="mt-1 text-2xl font-black text-white">{advisor.top_opportunity || summary.biggest_opportunity || 'Aguardando dados da loja'}</h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-300">
                {advisor.greeting || 'A Replymesh esta analisando pedidos, recovery, produtos e oportunidades.'}
                {' '}Nenhuma acao e disparada automaticamente.
              </p>
              {advisor.next_best_action && (
                <p className="mt-3 rounded-xl border border-primary-500/20 bg-dark-950/70 p-3 text-sm font-bold text-primary-200">
                  Proxima melhor acao: {advisor.next_best_action}
                </p>
              )}
            </div>
          </div>
          <div className="grid min-w-[280px] gap-3 rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
            <div>
              <span className="text-sm text-gray-400">Score de venda</span>
              <strong className="block text-3xl text-white">{summary.coach_score ?? advisor.coach_score ?? 0}/100</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-dark-800">
              <div className="h-full rounded-full bg-primary-400" style={{ width: `${Math.min(summary.coach_score ?? advisor.coach_score ?? 0, 100)}%` }} />
            </div>
            <span className="text-xs text-gray-500">{summary.learning_status || advisor.status || 'Coletando dados'}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-black text-white">Recomendacoes principais</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(advisor.opportunities || []).slice(0, 4).map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-2xl border border-dark-700 bg-dark-950 p-3 text-sm text-gray-200">
                  <span className="mr-2 text-primary-300">{index + 1}.</span>{item}
                </div>
              ))}
              {!(advisor.opportunities || []).length && (
                <div className="rounded-2xl border border-dark-700 bg-dark-950 p-3 text-sm text-gray-400">
                  Ainda preciso de mais pedidos ou feedbacks para listar oportunidades.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-5">
            <h3 className="text-lg font-black text-white">Historico de aprendizado</h3>
            <LearningRow label="Aceitas" value={history.accepted || 0} />
            <LearningRow label="Ignoradas" value={history.ignored || 0} />
            <LearningRow label="Funcionaram" value={history.worked || 0} />
            <LearningRow label="Impacto confirmado" value={formatMoney(history.feedback_impact_cents || 0)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={Lightbulb} label="Insights" value={summary.insights_count || 0} />
        <Metric icon={AlertTriangle} label="Prioridade alta" value={summary.high_priority_count || 0} />
        <Metric icon={CheckCircle2} label="Aceitas" value={history.accepted || 0} />
        <Metric icon={ThumbsUp} label="Funcionaram" value={history.worked || 0} />
        <Metric icon={TrendingUp} label="Maior oportunidade" value={summary.biggest_opportunity || '-'} compact />
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
                <InsightCard
                  key={`${item.origin}-${item.title}-${index}`}
                  item={item}
                  savingId={savingId}
                  onUpdate={updateInsight}
                />
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
                O sistema aprende com cada resposta sua: aceite, ignore, marque se funcionou e registre execucao manual.
                Quanto mais feedback, melhor fica a recomendacao para esta empresa.
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

const LearningRow = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-xl border border-dark-700 bg-dark-950 px-3 py-2">
    <span className="text-sm text-gray-400">{label}</span>
    <strong className="text-sm text-white">{value}</strong>
  </div>
)

const statusLabel = {
  new: 'Novo',
  viewed: 'Visualizado',
  accepted: 'Aceito',
  ignored: 'Ignorado',
  archived: 'Arquivado',
  manual_executed: 'Executado manual',
}

const feedbackLabel = {
  worked: 'Funcionou',
  not_worked: 'Nao funcionou',
}

const InsightCard = ({ item, onUpdate, savingId }) => (
  <article className="rounded-2xl border border-dark-700 bg-dark-950 p-4 transition hover:border-primary-500/40">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-black ${priorityTone[item.priority] || priorityTone.Baixa}`}>
            {item.priority}
          </span>
          <span className="rounded-full bg-dark-800 px-2.5 py-1 text-xs font-bold text-gray-300">{item.category}</span>
          <span className="rounded-full bg-dark-800 px-2.5 py-1 text-xs font-bold text-gray-400">{item.confidence}% confianca</span>
          <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-200">{statusLabel[item.status] || item.status || 'Novo'}</span>
          {item.feedback_result && <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-200">{feedbackLabel[item.feedback_result] || item.feedback_result}</span>}
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
    <div className="mt-3 flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" disabled={savingId?.startsWith(item.id)} onClick={() => onUpdate(item, { status: 'viewed' }, 'Insight marcado como visualizado.')}>
        <CheckCircle2 size={14} className="mr-1" /> Visualizei
      </Button>
      <Button size="sm" variant="secondary" disabled={savingId?.startsWith(item.id)} onClick={() => onUpdate(item, { status: 'accepted' }, 'O coach aprendeu que voce aceitou essa sugestao.')}>
        <ThumbsUp size={14} className="mr-1" /> Aceitei
      </Button>
      <Button size="sm" variant="secondary" disabled={savingId?.startsWith(item.id)} onClick={() => onUpdate(item, { status: 'ignored' }, 'Sugestao ignorada registrada.')}>
        <ThumbsDown size={14} className="mr-1" /> Ignorei
      </Button>
      <Button size="sm" variant="secondary" disabled={savingId?.startsWith(item.id)} onClick={() => onUpdate(item, { result: 'worked' }, 'Resultado positivo registrado.')}>
        <TrendingUp size={14} className="mr-1" /> Funcionou
      </Button>
      <Button size="sm" variant="secondary" disabled={savingId?.startsWith(item.id)} onClick={() => onUpdate(item, { result: 'not_worked' }, 'Resultado negativo registrado.')}>
        <AlertTriangle size={14} className="mr-1" /> Nao funcionou
      </Button>
      <Button size="sm" variant="secondary" disabled={savingId?.startsWith(item.id)} onClick={() => onUpdate(item, { status: 'manual_executed' }, 'Execucao manual registrada.')}>
        <Sparkles size={14} className="mr-1" /> Executei manual
      </Button>
      <Button size="sm" variant="ghost" disabled={savingId?.startsWith(item.id)} onClick={() => onUpdate(item, { status: 'archived' }, 'Insight arquivado.')}>
        <Archive size={14} className="mr-1" /> Arquivar
      </Button>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
      <span>Origem: {item.origin}</span>
      <span>Data: {item.date ? new Date(item.date).toLocaleString('pt-BR') : '-'}</span>
      <span>Nao executa automatico</span>
    </div>
  </article>
)
