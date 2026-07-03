import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, ShieldAlert, Star, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { getCustomerIntelligence } from '../../services/storeApi'

const moneyFromCents = (value) => (
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(value) || 0) / 100)
)

const riskTone = {
  Baixa: 'bg-green-500/10 text-green-300 border-green-500/30',
  Media: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  Alta: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  'Muito Alta': 'bg-red-500/10 text-red-300 border-red-500/30',
}

const profileTone = {
  Novo: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  Ativo: 'bg-green-500/10 text-green-300 border-green-500/30',
  Recorrente: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  VIP: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  'Em risco': 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  Inativo: 'bg-red-500/10 text-red-300 border-red-500/30',
  Perdido: 'bg-red-700/20 text-red-200 border-red-700/40',
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
          <p className="mt-1 text-2xl font-black text-white">{value}</p>
          {detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}
        </div>
        <span className="rounded-xl bg-dark-800 p-2 text-gray-300"><Icon size={18} /></span>
      </div>
    </CardContent>
  </Card>
)

export default function CustomerIntelligence() {
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState(null)
  const [profileFilter, setProfileFilter] = useState('todos')
  const [riskFilter, setRiskFilter] = useState('todos')

  const load = async () => {
    try {
      setLoading(true)
      setPayload(await getCustomerIntelligence())
    } catch (error) {
      toast.error(error.message || 'Nao foi possivel carregar a inteligencia de clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const summary = payload?.summary || {}
  const profiles = useMemo(() => {
    const list = payload?.profiles || []
    return list.filter((item) => (
      (profileFilter === 'todos' || item.profile === profileFilter) &&
      (riskFilter === 'todos' || item.risk_level === riskFilter)
    ))
  }, [payload, profileFilter, riskFilter])

  const profileOptions = Object.keys(payload?.segments || {})
  const riskOptions = Object.keys(payload?.risk_distribution || {})

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-300">Marketing inteligente</p>
          <h1 className="mt-2 text-3xl font-black text-white">Inteligencia de Clientes</h1>
          <p className="text-gray-400">Perfis, risco e oportunidades da base de clientes da loja.</p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} className="mr-2" />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={Star} label="Clientes VIP" value={summary.vip_customers || 0} detail="Maior valor e recorrencia" />
        <Metric icon={ShieldAlert} label="Clientes em risco" value={summary.at_risk_customers || 0} detail="Risco medio ou alto" />
        <Metric icon={Users} label="Recorrentes" value={summary.recurring_customers || 0} detail="Compraram mais de uma vez" />
        <Metric icon={Users} label="Novos" value={summary.new_customers || 0} detail="Base recente/sem historico" />
        <Metric icon={TrendingUp} label="Score medio" value={`${summary.average_customer_score || 0}/100`} detail={summary.biggest_opportunity || 'Aguardando dados'} />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Insights principais</h2>
              <p className="text-sm text-gray-500">Leitura comercial da base, sem disparos ou automacoes.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={profileFilter} onChange={(event) => setProfileFilter(event.target.value)} className="rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white outline-none">
                <option value="todos">Todos os perfis</option>
                {profileOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="rounded-lg border border-dark-700 bg-dark-900 px-3 py-2 text-sm text-white outline-none">
                <option value="todos">Todos os riscos</option>
                {riskOptions.map((item) => <option key={item} value={item}>{item}</option>)}
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
              <h2 className="text-lg font-black text-white">Perfis calculados</h2>
              <p className="text-sm text-gray-500">Lista limitada aos clientes recentes, com dados comerciais agregados.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-dark-800 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Perfil</th>
                    <th className="px-5 py-3">Score</th>
                    <th className="px-5 py-3">Risco</th>
                    <th className="px-5 py-3">Potencial</th>
                    <th className="px-5 py-3">Ticket</th>
                    <th className="px-5 py-3">Atributos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {profiles.map((item) => (
                    <tr key={item.customer_id} className="text-gray-300">
                      <td className="px-5 py-4">
                        <p className="font-black text-white">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.total_orders || 0} pedido(s) • {moneyFromCents(item.total_spent_cents)}</p>
                      </td>
                      <td className="px-5 py-4"><Badge tone={profileTone[item.profile]}>{item.profile}</Badge></td>
                      <td className="px-5 py-4 font-black text-white">{item.customer_score}/100</td>
                      <td className="px-5 py-4"><Badge tone={riskTone[item.risk_level]}>{item.risk_level}</Badge></td>
                      <td className="px-5 py-4 text-gray-200">{item.opportunity_level}</td>
                      <td className="px-5 py-4">{moneyFromCents(item.average_ticket_cents)}</td>
                      <td className="px-5 py-4">
                        <div className="flex max-w-md flex-wrap gap-1">
                          {(item.attributes || []).slice(0, 3).map((attr) => <Badge key={attr}>{attr}</Badge>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && profiles.length === 0 && (
                <p className="p-6 text-center text-sm text-gray-500">Nenhum cliente encontrado para os filtros selecionados.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-black text-white">Produtos favoritos</h2>
              <div className="mt-4 space-y-3">
                {(payload?.favorite_products || []).slice(0, 6).map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-dark-800 bg-dark-900/70 p-3">
                    <div>
                      <p className="font-bold text-white">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.quantity} unidade(s)</p>
                    </div>
                    <p className="text-sm font-black text-gray-200">{moneyFromCents(item.value_cents)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-black text-white">Categorias favoritas</h2>
              <div className="mt-4 space-y-3">
                {(payload?.favorite_categories || []).slice(0, 6).map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-dark-800 bg-dark-900/70 p-3">
                    <div>
                      <p className="font-bold text-white">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.quantity} item(ns)</p>
                    </div>
                    <p className="text-sm font-black text-gray-200">{moneyFromCents(item.value_cents)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
