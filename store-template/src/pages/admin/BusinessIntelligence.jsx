import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { getBusinessIntelligence } from '../../services/storeApi'

const moneyFromCents = (value) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(value) || 0) / 100)
)

const priorityTone = {
  Critica: 'border-red-500/40 bg-red-500/10 text-red-200',
  Alta: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
  Media: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200',
  Baixa: 'border-green-500/40 bg-green-500/10 text-green-200',
}

const typeIcon = {
  opportunity: TrendingUp,
  warning: AlertTriangle,
  recommendation: Lightbulb,
}

const Section = ({ title, children, action }) => (
  <Card>
    <CardContent className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-white">{title}</h2>
        {action}
      </div>
      {children}
    </CardContent>
  </Card>
)

const InsightList = ({ items = [], empty = 'Sem dados suficientes neste periodo.' }) => {
  if (!items.length) {
    return <p className="rounded-xl border border-dashed border-dark-600 bg-dark-900/70 p-4 text-sm text-gray-400">{empty}</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const Icon = typeIcon[item.type] || Lightbulb
        return (
          <div key={`${item.title}-${index}`} className="rounded-2xl border border-dark-700 bg-dark-900/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-dark-800 text-primary-300">
                  <Icon size={18} />
                </span>
                <div>
                  <h3 className="font-black text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityTone[item.priority] || priorityTone.Baixa}`}>
                {item.priority || 'Baixa'}
              </span>
            </div>
            {item.suggested_action && (
              <p className="mt-3 rounded-xl border border-primary-500/20 bg-primary-500/10 p-3 text-sm font-bold text-primary-200">
                Sugestao: {item.suggested_action}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

const ProductTable = ({ title, rows = [], negative = false }) => (
  <Section title={title}>
    {rows.length ? (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="py-2">Produto</th>
              <th className="py-2">Categoria</th>
              <th className="py-2 text-right">Qtd.</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {rows.map((row, index) => (
              <tr key={`${row.name}-${index}`} className="text-gray-300">
                <td className="py-3 font-bold text-white">{row.name || '-'}</td>
                <td className="py-3">{row.category || '-'}</td>
                <td className="py-3 text-right">{row.quantity || row.current_quantity || 0}</td>
                <td className={`py-3 text-right font-bold ${negative ? 'text-orange-300' : 'text-green-300'}`}>
                  {moneyFromCents(row.total_cents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-sm text-gray-400">Sem dados neste periodo.</p>
    )}
  </Section>
)

export default function BusinessIntelligence() {
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getBusinessIntelligence()
      setPayload(data)
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel carregar a inteligencia do negocio.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const summary = payload?.summary || {}
  const health = payload?.health || {}
  const score = payload?.business_score ?? summary.business_score ?? 0
  const generatedAt = payload?.generated_at ? new Date(payload.generated_at).toLocaleString('pt-BR') : 'Aguardando'
  const combinedInsights = useMemo(() => payload?.insights || [], [payload])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Analise da operacao</p>
          <h1 className="mt-2 text-3xl font-black text-white">Inteligencia do Negocio</h1>
          <p className="text-gray-400">A Replymesh analisa vendas, produtos, clientes, recovery e performance para sugerir proximas acoes.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} className="mr-2" />
          {loading ? 'Atualizando...' : 'Atualizar analise'}
        </Button>
      </div>

      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/15 via-dark-900 to-dark-950">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-500 p-3 text-white"><BarChart3 size={24} /></span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">Business Intelligence ativo</p>
              <h2 className="mt-1 text-2xl font-black text-white">{summary.headline || health.label || 'Coletando dados da loja'}</h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-300">
                Esta tela apenas observa e recomenda. Nenhuma mensagem, pedido, cupom ou campanha e executada automaticamente.
              </p>
            </div>
          </div>
          <div className="grid min-w-[280px] gap-3 rounded-2xl border border-dark-700 bg-dark-950/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Business Score</span>
              <strong className="text-3xl text-white">{score}/100</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-dark-800">
              <div className="h-full rounded-full bg-blue-400" style={{ width: `${Math.min(score, 100)}%` }} />
            </div>
            <span className="text-xs text-gray-500">Ultima analise: {generatedAt}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={ShieldCheck} label="Saude" value={health.label || 'Aguardando dados'} />
        <Metric icon={TrendingUp} label="Oportunidades" value={payload?.opportunities?.length || 0} />
        <Metric icon={AlertTriangle} label="Alertas" value={payload?.warnings?.length || 0} />
        <Metric icon={Lightbulb} label="Recomendacoes" value={payload?.recommendations?.length || 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title="Oportunidades">
          <InsightList items={payload?.opportunities || []} />
        </Section>
        <Section title="Alertas">
          <InsightList items={payload?.warnings || []} />
        </Section>
        <Section title="Recomendacoes">
          <InsightList items={payload?.recommendations || []} />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ProductTable title="Produtos em alta" rows={payload?.top_products || []} />
        <ProductTable title="Produtos com baixa venda" rows={payload?.worst_products || []} negative />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Melhor horario e dia">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniInfo icon={Clock} label="Melhor horario" value={payload?.best_time?.label || 'Aguardando dados'} />
            <MiniInfo icon={Calendar} label="Melhor dia" value={payload?.best_day?.label || 'Aguardando dados'} />
          </div>
        </Section>
        <Section title="Categorias">
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniList title="Melhores" rows={payload?.best_categories || []} />
            <MiniList title="Pontos de atencao" rows={payload?.worst_categories || []} />
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Analysis title="Recovery" data={payload?.recovery_analysis} />
        <Analysis title="Cupons" data={payload?.coupon_analysis} />
        <Analysis title="Clientes" data={payload?.customer_analysis} />
        <Analysis title="Entrega" data={payload?.delivery_analysis} />
        <Analysis title="Performance" data={payload?.performance_analysis} />
        <Section title="Todos os insights">
          <InsightList items={combinedInsights.slice(0, 8)} />
        </Section>
      </div>
    </div>
  )
}

const Metric = ({ icon: Icon, label, value }) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-900 text-blue-300"><Icon size={18} /></span>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-xl font-black text-white">{value}</p>
      </div>
    </CardContent>
  </Card>
)

const MiniInfo = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-dark-700 bg-dark-900/70 p-4">
    <Icon size={18} className="mb-3 text-blue-300" />
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-lg font-black text-white">{value}</p>
  </div>
)

const MiniList = ({ title, rows = [] }) => (
  <div className="rounded-2xl border border-dark-700 bg-dark-900/70 p-4">
    <p className="mb-3 text-sm font-black text-white">{title}</p>
    {rows.length ? rows.slice(0, 5).map((row, index) => (
      <div key={`${row.name}-${index}`} className="flex items-center justify-between gap-3 border-t border-dark-800 py-2 first:border-t-0">
        <span className="text-sm text-gray-300">{row.name || '-'}</span>
        <span className="text-xs font-bold text-gray-500">{row.quantity || 0}</span>
      </div>
    )) : <p className="text-sm text-gray-500">Sem dados.</p>}
  </div>
)

const Analysis = ({ title, data = {} }) => (
  <Section title={title}>
    <div className="space-y-2">
      {Object.entries(data || {}).length ? Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-dark-700 bg-dark-900/70 px-3 py-2 text-sm">
          <span className="text-gray-500">{key.replaceAll('_', ' ')}</span>
          <span className="max-w-[55%] truncate text-right font-bold text-gray-200">{String(value ?? '-')}</span>
        </div>
      )) : (
        <p className="text-sm text-gray-500">Sem dados suficientes.</p>
      )}
    </div>
  </Section>
)
