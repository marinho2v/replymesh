import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { getStoreStrategy } from '../../services/storeApi'

const moneyFromCents = (value) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(value) || 0) / 100)
)

const priorityTone = {
  Critica: 'border-red-500/40 bg-red-500/10 text-red-200',
  Alta: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  Media: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200',
  Baixa: 'border-green-500/40 bg-green-500/10 text-green-200',
}

const indicatorTone = (value) => {
  const number = Number(value) || 0
  if (number >= 80) return 'bg-green-400'
  if (number >= 55) return 'bg-yellow-400'
  return 'bg-red-400'
}

export default function Strategy() {
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getStoreStrategy()
      setPayload(data)
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel carregar a estrategia da loja.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const summary = payload?.summary || {}
  const indicators = payload?.indicators || {}
  const priorities = useMemo(() => payload?.priorities || [], [payload])
  const generatedAt = payload?.generated_at ? new Date(payload.generated_at).toLocaleString('pt-BR') : 'Aguardando'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-green-300">Prioridades consolidadas</p>
          <h1 className="mt-2 text-3xl font-black text-white">Estrategia da Loja</h1>
          <p className="text-gray-400">A Replymesh organiza Consultor, Analise do Negocio, Recovery e Cerebro em poucas prioridades claras.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} className="mr-2" />
          {loading ? 'Atualizando...' : 'Atualizar estrategia'}
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-5 p-6 xl:grid-cols-[1fr_360px] xl:items-center">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-dark-800 p-3 text-green-300"><Target size={24} /></span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-300">Resumo executivo</p>
              <h2 className="mt-1 text-2xl font-black text-white">{summary.biggest_priority || 'Aguardando dados da loja'}</h2>
              <div className="mt-3 space-y-1 text-sm text-gray-300">
                {(payload?.executive_summary || ['Coletando dados para montar a estrategia.']).map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-3 rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
            <MiniLine label="Maior oportunidade" value={summary.biggest_opportunity || 'Aguardando'} />
            <MiniLine label="Maior risco" value={summary.biggest_risk || 'Nenhum risco critico'} />
            <MiniLine label="Confianca" value={`${summary.confidence ?? 0}%`} />
            <MiniLine label="Ultima atualizacao" value={generatedAt} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Indicator icon={Compass} label="Strategic Score" value={indicators.strategic_score ?? summary.strategic_score ?? 0} />
        <Indicator icon={ShieldCheck} label="Saude operacional" value={indicators.operational_health ?? summary.operational_health ?? 0} />
        <Indicator icon={TrendingUp} label="Oportunidade" value={indicators.sales_opportunity ?? summary.sales_opportunity ?? 0} />
        <Indicator icon={AlertTriangle} label="Nivel de risco" value={indicators.risk_level ?? summary.risk_level ?? 0} invert />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Section title="Prioridades">
          {loading ? (
            <SkeletonRows />
          ) : priorities.length ? (
            <div className="space-y-3">
              {priorities.map((item, index) => <PriorityCard key={item.id || index} item={item} index={index} />)}
            </div>
          ) : (
            <EmptyState text="Ainda nao ha dados suficientes para montar prioridades." />
          )}
        </Section>

        <div className="space-y-6">
          <Section title="Mudancas recentes">
            <SimpleList
              items={payload?.recent_changes || []}
              render={(item) => (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-white">{item.label || 'Atualizacao'}</span>
                    <Badge priority={item.priority || 'Baixa'} />
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{item.description}</p>
                </>
              )}
            />
          </Section>

          <Section title="Historico">
            <SimpleList
              items={payload?.timeline || []}
              render={(item) => (
                <>
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dark-800 text-xs font-black text-green-300">
                      {item.step || 1}
                    </span>
                    <div>
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.origin || 'Replymesh Strategy'}</p>
                    </div>
                  </div>
                </>
              )}
            />
          </Section>
        </div>
      </div>

      <Section title="Recomendacoes consolidadas">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(payload?.recommendations || []).slice(0, 6).map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge priority={item.priority} />
                <span className="text-xs text-gray-500">{item.confidence || 0}% confianca</span>
              </div>
              <h3 className="font-black text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{item.suggested_action}</p>
            </div>
          ))}
          {!(payload?.recommendations || []).length && <EmptyState text="Sem recomendacoes por enquanto." />}
        </div>
      </Section>

      <Section title="Fontes da analise">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Source name="Consultor de Vendas" data={payload?.sources?.sales_coach} />
          <Source name="Analise do Negocio" data={payload?.sources?.business_intelligence} />
          <Source name="Recovery Intelligence" data={payload?.sources?.recovery_intelligence} />
          <Source name="Cerebro Replymesh" data={payload?.sources?.replymesh_brain} />
        </div>
      </Section>
    </div>
  )
}

const Section = ({ title, children }) => (
  <Card>
    <CardContent className="p-5">
      <h2 className="mb-4 text-lg font-black text-white">{title}</h2>
      {children}
    </CardContent>
  </Card>
)

const Indicator = ({ icon: Icon, label, value, invert = false }) => {
  const safeValue = Math.max(0, Math.min(Number(value) || 0, 100))
  const barValue = invert ? 100 - safeValue : safeValue
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-xl bg-dark-800 p-2 text-gray-200"><Icon size={18} /></span>
          <strong className="text-2xl text-white">{safeValue}/100</strong>
        </div>
        <p className="mt-3 text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-dark-800">
          <div className={`h-full rounded-full ${indicatorTone(barValue)}`} style={{ width: `${barValue}%` }} />
        </div>
      </CardContent>
    </Card>
  )
}

const PriorityCard = ({ item, index }) => (
  <div className="rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dark-800 text-sm font-black text-green-300">
          {index + 1}
        </span>
        <div>
          <h3 className="font-black text-white">{item.title}</h3>
          <p className="mt-1 text-sm text-gray-400">{item.description}</p>
        </div>
      </div>
      <Badge priority={item.priority} />
    </div>
    <div className="mt-4 grid gap-3 border-t border-dark-800 pt-4 md:grid-cols-3">
      <MiniLine label="Impacto" value={moneyFromCents(item.impact_cents)} />
      <MiniLine label="Confianca" value={`${item.confidence || 0}%`} />
      <MiniLine label="Origem" value={item.origin || (item.origins || []).join(', ') || '-'} />
    </div>
    <p className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm font-bold text-green-200">
      Acao sugerida: {item.suggested_action}
    </p>
  </div>
)

const MiniLine = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-black text-white">{value || '-'}</p>
  </div>
)

const Badge = ({ priority = 'Baixa' }) => (
  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityTone[priority] || priorityTone.Baixa}`}>
    {priority}
  </span>
)

const SimpleList = ({ items = [], render }) => (
  items.length ? (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.title || item.label}-${index}`} className="rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
          {render(item)}
        </div>
      ))}
    </div>
  ) : <EmptyState text="Sem historico disponivel." />
)

const Source = ({ name, data = {} }) => (
  <div className="rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
    <div className="mb-3 flex items-center gap-2">
      {data?.available ? <CheckCircle2 size={16} className="text-green-400" /> : <Clock size={16} className="text-gray-500" />}
      <span className="font-black text-white">{name}</span>
    </div>
    <p className="text-sm text-gray-400">{data?.available ? `${data.insights || 0} leitura(s) consideradas.` : 'Aguardando dados suficientes.'}</p>
  </div>
)

const EmptyState = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-dark-700 bg-dark-950/70 p-5 text-sm text-gray-400">
    {text}
  </div>
)

const SkeletonRows = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-dark-800" />)}
  </div>
)
