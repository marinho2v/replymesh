import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../ui/Card'
import { formatCurrency } from '../../utils/currency'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import {
  ShoppingCart, DollarSign, Users, TrendingUp,
  ShoppingBag, AlertTriangle, PackageX, RefreshCw, Ticket, ChevronRight, Sparkles,
} from 'lucide-react'

// Sparkline SVG simples usando polilinha
const Sparkline = ({ data = [], color = '#22c55e' }) => {
  const values = data.length >= 2 ? data : Array.from({ length: 7 }, (_, i) => ({ revenue_cents: Math.random() * 5000 }))
  const max = Math.max(...values.map(d => d.revenue_cents || 0), 1)
  const w = 80
  const h = 28
  const pts = values.map((d, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((d.revenue_cents || 0) / max) * (h - 4) - 2
    return `${x},${y}`
  })
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Donut SVG puro
const DonutChart = ({ statusCounts = {} }) => {
  const items = [
    { key: 'pending',          label: 'Pendentes',        color: '#eab308' },
    { key: 'accepted',         label: 'Aceitos',          color: '#f97316' },
    { key: 'preparing',        label: 'Em preparo',       color: '#a855f7' },
    { key: 'ready',            label: 'Prontos',          color: '#3b82f6' },
    { key: 'out_for_delivery', label: 'Saiu p/ entrega', color: '#06b6d4' },
    { key: 'completed',        label: 'Finalizados',      color: '#22c55e' },
    { key: 'cancelled',        label: 'Cancelados',       color: '#ef4444' },
  ]

  const values = items.map(item => statusCounts[item.key] || 0)
  const total = values.reduce((a, b) => a + b, 0)

  const r = 42
  const cx = 55
  const cy = 55
  const circumference = 2 * Math.PI * r
  const gap = 2

  let offset = 0
  const segments = values.map((v, i) => {
    const pct = total > 0 ? v / total : 0
    const dash = Math.max(pct * circumference - gap, 0)
    const seg = { dash, skip: circumference - dash, offset, color: items[i].color, pct }
    offset += pct * circumference
    return seg
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative shrink-0">
        <svg width="110" height="110" viewBox="0 0 110 110">
          {/* Fundo do donut */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#252525" strokeWidth="14" />
          {total === 0 ? (
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="#3D3D3D"
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset="0"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ) : (
            segments.map((seg, i) => (
              seg.dash > 0 && (
                <circle
                  key={i}
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="14"
                  strokeDasharray={`${seg.dash} ${seg.skip}`}
                  strokeDashoffset={-seg.offset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              )
            ))
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">TOTAL</span>
          <span className="text-2xl font-bold text-white leading-tight">{total}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 w-full">
        {items.map((item, i) => {
          const count = statusCounts[item.key] || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-400 text-sm">{item.label}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-white font-semibold w-5 text-right">{count}</span>
                <span className="text-gray-500 w-8 text-right">{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const DashboardStats = ({ stats, loading }) => {
  const [openSummary, setOpenSummary] = useState(null)
  const basePath = useCompanyBasePath()

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-12 bg-dark-700 rounded animate-pulse mb-4"></div>
              <div className="h-6 bg-dark-700 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const trendData = stats?.trendData || []
  const salesCoach = stats?.salesCoach || {}
  const hasSalesCoach = Object.keys(salesCoach).length > 0

  const statCards = [
    {
      title:   'Faturamento do Dia',
      value:   formatCurrency(stats?.todayRevenue || 0),
      icon:    DollarSign,
      color:   'text-green-500',
      bgColor: 'bg-green-500/10',
      sparkColor: '#22c55e',
      comparison: stats?.revenueChangePercent || 0,
    },
    {
      title:   'Pedidos do Dia',
      value:   stats?.todayOrders || 0,
      icon:    ShoppingCart,
      color:   'text-blue-500',
      bgColor: 'bg-blue-500/10',
      sparkColor: '#3b82f6',
    },
    {
      title:   'Ticket Médio',
      value:   formatCurrency(stats?.averageTicket || 0),
      icon:    TrendingUp,
      color:   'text-purple-500',
      bgColor: 'bg-purple-500/10',
      sparkColor: '#a855f7',
    },
    {
      title:   'Novos Clientes',
      value:   stats?.newCustomers || 0,
      icon:    Users,
      color:   'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      sparkColor: '#eab308',
    },
  ]

  const resumoItems = [
    {
      key: 'orders',
      label: 'Total de Pedidos',
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      highlight: false,
      details: [
        ['Pedidos hoje', stats?.todayOrders || 0],
        ['Pendentes', stats?.statusCounts?.pending || 0],
        ['Finalizados', stats?.statusCounts?.completed || 0],
      ],
    },
    {
      key: 'revenue',
      label: 'Faturamento Total',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: TrendingUp,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/10',
      highlight: false,
      details: [
        ['Faturamento hoje', formatCurrency(stats?.todayRevenue || 0)],
        ['Ticket medio', formatCurrency(stats?.averageTicket || 0)],
      ],
    },
    {
      key: 'low-stock',
      label: 'Estoque Baixo',
      value: stats?.lowStockItems || 0,
      icon: AlertTriangle,
      iconColor: (stats?.lowStockItems || 0) > 0 ? 'text-yellow-400' : 'text-gray-500',
      iconBg: (stats?.lowStockItems || 0) > 0 ? 'bg-yellow-500/10' : 'bg-dark-800',
      highlight: (stats?.lowStockItems || 0) > 0,
      details: [
        ['Itens abaixo do minimo', stats?.lowStockItems || 0],
        ['Acao sugerida', 'Abrir Itens de Estoque'],
      ],
    },
    {
      key: 'out-stock',
      label: 'Sem Estoque',
      value: stats?.outOfStockItems || 0,
      icon: PackageX,
      iconColor: (stats?.outOfStockItems || 0) > 0 ? 'text-red-400' : 'text-gray-500',
      iconBg: (stats?.outOfStockItems || 0) > 0 ? 'bg-red-500/10' : 'bg-dark-800',
      highlight: (stats?.outOfStockItems || 0) > 0,
      details: [
        ['Itens zerados', stats?.outOfStockItems || 0],
        ['Acao sugerida', 'Repor ou desativar produtos'],
      ],
    },
    {
      key: 'recurring',
      label: 'Clientes Recorrentes',
      value: stats?.recurringCustomers || 0,
      icon: RefreshCw,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      highlight: false,
      details: [
        ['Clientes que compraram novamente', stats?.recurringCustomers || 0],
        ['Novos clientes hoje', stats?.newCustomers || 0],
      ],
    },
    {
      key: 'coupons',
      label: 'Cupons Utilizados',
      value: stats?.usedCoupons || 0,
      icon: Ticket,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10',
      highlight: false,
      details: [
        ['Cupons aplicados', stats?.usedCoupons || 0],
        ['Origem', 'Pedidos com desconto/cupom'],
      ],
    },
  ]

  return (
    <>
      {/* Cards superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                    <Icon size={20} className={card.color} />
                  </div>
                  <Sparkline data={trendData} color={card.sparkColor} />
                </div>
                <p className="text-gray-400 text-sm mb-0.5">{card.title}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
                {card.comparison !== undefined ? (
                  <p className={`text-xs mt-1 ${card.comparison > 0 ? 'text-green-400' : card.comparison < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {card.comparison > 0 ? '+' : ''}{card.comparison.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs ontem
                  </p>
                ) : <p className="text-xs text-transparent mt-1" aria-hidden="true">comparacao</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {hasSalesCoach && (
        <Card className="mb-4 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-dark-900 to-dark-950 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <Sparkles size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">AI Sales Coach</p>
                  <h3 className="mt-1 text-xl font-black text-white">
                    {salesCoach.insights_count || 0} recomendações para sua operação
                  </h3>
                  <p className="mt-1 max-w-3xl text-sm text-gray-400">
                    Maior oportunidade: <span className="text-gray-200">{salesCoach.biggest_opportunity || 'Aguardando dados'}</span>.
                    {' '}Maior risco: <span className="text-gray-200">{salesCoach.biggest_risk || 'Nenhum risco crítico detectado'}</span>.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[auto_auto] sm:items-center">
                <div className="rounded-xl border border-dark-700 bg-dark-950/70 px-4 py-3">
                  <p className="text-xs text-gray-500">Impacto estimado</p>
                  <p className="text-lg font-black text-white">{salesCoach.estimated_impact || 'R$ 0,00'}</p>
                </div>
                <Link
                  to={`${basePath}/admin/sales-coach`}
                  className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  Ver recomendações
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status dos Pedidos + Resumo Geral */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-xl font-bold text-white mb-5">Status dos Pedidos</h3>
            <DonutChart statusCounts={stats?.statusCounts || {}} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-xl font-bold text-white mb-4">Resumo Geral</h3>
            <div className="divide-y divide-dark-800">
              {resumoItems.map((item) => {
                const Icon = item.icon
                const isOpen = openSummary === item.key
                return (
                  <div key={item.key} className="-mx-2 rounded-lg transition-colors hover:bg-dark-800">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-2 py-2.5 text-left"
                      onClick={() => setOpenSummary((current) => current === item.key ? null : item.key)}
                      aria-expanded={isOpen}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${item.iconBg}`}>
                        <Icon size={15} className={item.iconColor} />
                      </div>
                      <span className="text-gray-400 text-sm flex-1">{item.label}</span>
                      <span className={`font-semibold text-sm tabular-nums ${item.highlight ? 'text-yellow-400' : 'text-white'}`}>
                        {item.value}
                      </span>
                      <ChevronRight size={14} className={`text-gray-600 shrink-0 transition-transform ${isOpen ? 'rotate-90 text-yellow-400' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="ml-12 mr-3 mb-3 rounded-lg border border-dark-700 bg-dark-900/80 p-3">
                        {item.details.map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between gap-3 py-1 text-xs">
                            <span className="text-gray-500">{label}</span>
                            <span className="text-gray-200 font-medium text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default DashboardStats
