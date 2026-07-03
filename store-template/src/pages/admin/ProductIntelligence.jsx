import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Package, RefreshCw, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { getProductIntelligence } from '../../services/storeApi'

const moneyFromCents = (value) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(value) || 0) / 100)
)

const classificationTone = {
  Popular: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  'Em crescimento': 'bg-green-500/10 text-green-300 border-green-500/30',
  Estavel: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  'Em queda': 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  Esquecido: 'bg-red-500/10 text-red-300 border-red-500/30',
  Sazonal: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  Premium: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  Entrada: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  'Campeao de vendas': 'bg-green-500/10 text-green-300 border-green-500/30',
}

const trendTone = {
  Subindo: 'text-green-300',
  Estavel: 'text-gray-300',
  Caindo: 'text-orange-300',
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

export default function ProductIntelligence() {
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState(null)
  const [classificationFilter, setClassificationFilter] = useState('todos')
  const [trendFilter, setTrendFilter] = useState('todos')
  const [categoryFilter, setCategoryFilter] = useState('todos')

  const load = async () => {
    try {
      setLoading(true)
      setPayload(await getProductIntelligence())
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel carregar a inteligencia de produtos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const summary = payload?.summary || {}
  const products = useMemo(() => {
    const list = payload?.products || []
    return list.filter((item) => (
      (classificationFilter === 'todos' || item.classification === classificationFilter) &&
      (trendFilter === 'todos' || item.trend === trendFilter) &&
      (categoryFilter === 'todos' || item.category === categoryFilter)
    ))
  }, [payload, classificationFilter, trendFilter, categoryFilter])

  const classifications = [...new Set((payload?.products || []).map((item) => item.classification).filter(Boolean))]
  const trends = [...new Set((payload?.products || []).map((item) => item.trend).filter(Boolean))]
  const categories = [...new Set((payload?.products || []).map((item) => item.category).filter(Boolean))]
  const bestBundle = summary.best_bundle

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Marketing inteligente</p>
          <h1 className="mt-2 text-3xl font-black text-white">Inteligencia de Produtos</h1>
          <p className="text-gray-400">Desempenho, tendencia, potencial e combinacoes de venda do cardapio.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} className="mr-2" />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={Sparkles} label="Produto campeao" value={summary.champion_product} detail="Maior desempenho recente" />
        <Metric icon={TrendingUp} label="Em crescimento" value={summary.growing_product} detail="Tendencia positiva" />
        <Metric icon={TrendingDown} label="Produto esquecido" value={summary.forgotten_product} detail="Ativo com pouca venda" />
        <Metric icon={BarChart3} label="Maior potencial" value={summary.highest_potential_product} detail={`${summary.average_product_score || 0}/100 score medio`} />
        <Metric icon={Package} label="Mais vendido junto" value={bestBundle?.label} detail={bestBundle ? `${bestBundle.orders} pedido(s)` : 'Aguardando dados'} />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Insights principais</h2>
              <p className="text-sm text-gray-500">Leitura comercial dos produtos, sem alterar preco ou criar promocao.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={classificationFilter} onChange={(event) => setClassificationFilter(event.target.value)} className="rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white outline-none">
                <option value="todos">Todas classificacoes</option>
                {classifications.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={trendFilter} onChange={(event) => setTrendFilter(event.target.value)} className="rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white outline-none">
                <option value="todos">Todas tendencias</option>
                {trends.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white outline-none">
                <option value="todos">Todas categorias</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {(payload?.insights || []).map((item) => (
              <div key={item} className="rounded-xl border border-dark-700 bg-dark-900/70 p-3 text-sm text-gray-300">{item}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-dark-800 p-5">
              <h2 className="text-lg font-black text-white">Produtos analisados</h2>
              <p className="text-sm text-gray-500">Score, tendencia e potencial calculados a partir dos pedidos.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-dark-800 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Produto</th>
                    <th className="px-5 py-3">Classificacao</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Tendencia</th>
                    <th className="px-5 py-3">Potencial</th>
                    <th className="px-5 py-3">Vendas</th>
                    <th className="px-5 py-3">Receita</th>
                    <th className="px-5 py-3">Melhor momento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {products.map((item) => (
                    <tr key={`${item.product_id || item.label}`} className="text-gray-300">
                      <td className="px-5 py-4">
                        <p className="font-black text-white">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.category || 'Sem categoria'}</p>
                      </td>
                      <td className="px-5 py-4"><Badge tone={classificationTone[item.classification]}>{item.classification}</Badge></td>
                      <td className="px-5 py-4 font-black text-white">{item.product_score}/100</td>
                      <td className={`px-5 py-4 font-bold ${trendTone[item.trend] || 'text-gray-300'}`}>{item.trend}</td>
                      <td className="px-5 py-4">{item.potential}</td>
                      <td className="px-5 py-4">{item.sold_quantity || 0} un.</td>
                      <td className="px-5 py-4">{moneyFromCents(item.revenue_cents)}</td>
                      <td className="px-5 py-4">
                        <p>{item.best_period || 'Sem dados'}</p>
                        <p className="text-xs text-gray-500">{item.best_day || 'Sem dados'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && products.length === 0 && (
                <p className="p-6 text-center text-sm text-gray-500">Nenhum produto encontrado para os filtros selecionados.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-black text-white">Vendidos juntos</h2>
              <div className="mt-4 space-y-3">
                {(payload?.bundles || []).slice(0, 8).map((item) => (
                  <div key={item.label} className="rounded-xl border border-dark-800 bg-dark-900/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-white">{item.label}</p>
                      <Badge>{item.percent}%</Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{item.orders} pedido(s) - {moneyFromCents(item.revenue_cents)}</p>
                  </div>
                ))}
                {(payload?.bundles || []).length === 0 && <p className="text-sm text-gray-500">Aguardando combinacoes suficientes.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-black text-white">Produtos esquecidos</h2>
              <div className="mt-4 space-y-3">
                {(payload?.forgotten_products || []).slice(0, 8).map((item) => (
                  <div key={item.label} className="rounded-xl border border-dark-800 bg-dark-900/70 p-3">
                    <p className="font-bold text-white">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.category} - score {item.product_score}/100</p>
                  </div>
                ))}
                {(payload?.forgotten_products || []).length === 0 && <p className="text-sm text-gray-500">Nenhum produto esquecido detectado.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
