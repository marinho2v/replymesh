import { useEffect, useState } from 'react'
import { BarChart3, CalendarDays, Megaphone, RefreshCw, ShieldAlert, Target } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { getMarketingIntelligence } from '../../services/storeApi'

const moneyFromCents = (value) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(value) || 0) / 100)
)

const priorityTone = {
  Critica: 'bg-red-500/10 text-red-300 border-red-500/30',
  Alta: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  Media: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  Baixa: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
}

const Badge = ({ children, tone = 'border-dark-700 bg-dark-900 text-gray-300' }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${tone}`}>
    {children}
  </span>
)

const Metric = ({ icon: Icon, label, value, detail }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="mt-1 text-xl font-black text-white">{value || '-'}</p>
          {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
        </div>
        <span className="rounded-xl bg-dark-800 p-2 text-gray-300"><Icon size={18} /></span>
      </div>
    </CardContent>
  </Card>
)

export default function MarketingIntelligence() {
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setPayload(await getMarketingIntelligence())
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel carregar a inteligencia de marketing.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const summary = payload?.summary || {}
  const recommendations = payload?.recommendations || []
  const productOpportunities = payload?.product_opportunities || []
  const customerSegments = payload?.customer_segments || []
  const campaignOptions = payload?.campaign_options || []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Cerebro da ReplyMesh</p>
          <h1 className="mt-2 text-3xl font-black text-white">Inteligencia de Marketing</h1>
          <p className="text-gray-400">Recomendacoes comerciais baseadas nas inteligencias da loja, sem disparos automaticos.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} className="mr-2" />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={BarChart3} label="Marketing Score" value={`${summary.marketing_score || 0}/100`} detail={`Confianca ${summary.confidence || 0}%`} />
        <Metric icon={Megaphone} label="Melhor campanha" value={summary.best_campaign} detail={summary.recommended_campaign} />
        <Metric icon={Target} label="Produto indicado" value={summary.product_to_promote} detail={`Proteger: ${summary.product_to_protect || 'Aguardando dados'}`} />
        <Metric icon={CalendarDays} label="Melhor momento" value={summary.best_time} detail={summary.best_day} />
        <Metric icon={ShieldAlert} label="Risco" value={summary.risk_level} detail={`Potencial: ${summary.conversion_potential || 'Baixo'}`} />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Resumo executivo</h2>
              <p className="text-sm text-gray-500">O sistema recomenda apenas quando existe sinal comercial suficiente.</p>
            </div>
            <Badge>{moneyFromCents(summary.estimated_potential_cents)} potencial estimado</Badge>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {(payload?.quick_insights || []).map((item) => (
              <div key={item} className="rounded-xl border border-dark-700 bg-dark-900/70 p-3 text-sm text-gray-300">{item}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-dark-800 p-5">
              <h2 className="text-lg font-black text-white">Recomendacoes comerciais</h2>
              <p className="text-sm text-gray-500">Somente leitura. Nenhuma campanha e enviada ou criada automaticamente.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="border-b border-dark-800 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Recomendacao</th>
                    <th className="px-5 py-3">Campanha</th>
                    <th className="px-5 py-3">Prioridade</th>
                    <th className="px-5 py-3">Confianca</th>
                    <th className="px-5 py-3">Potencial</th>
                    <th className="px-5 py-3">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {recommendations.map((item) => (
                    <tr key={`${item.title}-${item.campaign_type}`} className="text-gray-300">
                      <td className="px-5 py-4">
                        <p className="font-black text-white">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </td>
                      <td className="px-5 py-4">{item.campaign_type}</td>
                      <td className="px-5 py-4"><Badge tone={priorityTone[item.priority]}>{item.priority}</Badge></td>
                      <td className="px-5 py-4 font-black text-white">{item.confidence || 0}%</td>
                      <td className="px-5 py-4">{moneyFromCents(item.estimated_value_cents)}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && recommendations.length === 0 && (
                <p className="p-6 text-center text-sm text-gray-500">Aguardando dados suficientes para recomendações.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-black text-white">Tipos de campanha</h2>
              <div className="mt-4 space-y-3">
                {campaignOptions.map((item) => (
                  <div key={item.label} className="rounded-xl border border-dark-800 bg-dark-900/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-white">{item.label}</p>
                      {item.recommended && <Badge tone="border-green-500/30 bg-green-500/10 text-green-300">Recomendado</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Risco {item.risk} - {item.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-black text-white">Clientes prioritarios</h2>
              <div className="mt-4 space-y-3">
                {customerSegments.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-dark-800 bg-dark-900/70 p-3">
                    <div>
                      <p className="font-bold text-white">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.priority ? 'Prioritario no snapshot atual' : 'Monitoramento'}</p>
                    </div>
                    <p className="text-lg font-black text-white">{item.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-black text-white">Produtos recomendados</h2>
            <div className="mt-4 divide-y divide-dark-800">
              {productOpportunities.map((item) => (
                <div key={`${item.label}-${item.reason}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-bold text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.category || 'Sem categoria'} - {item.reason}</p>
                  </div>
                  <Badge>{item.score || 0}/100</Badge>
                </div>
              ))}
              {productOpportunities.length === 0 && <p className="py-4 text-sm text-gray-500">Aguardando dados de produtos.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-black text-white">Calendario comercial</h2>
            <div className="mt-4 space-y-3">
              {(payload?.commercial_calendar || []).map((item) => (
                <div key={item.label} className="rounded-xl border border-dark-800 bg-dark-900/70 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                  <p className="mt-1 font-black text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
