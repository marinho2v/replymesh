import { useState } from 'react'
import { useReports } from '../../hooks/useReports'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { formatCurrency } from '../../utils/currency'
import { exportToCsv, exportToXlsx } from '../../utils/exportCsv'
import { PAYMENT_METHOD_LABELS, ORDER_STATUS_LABELS } from '../../lib/constants'
import {
  BarChart3, TrendingUp, ShoppingCart, Users, DollarSign,
  Download, Package, XCircle, Clock, RefreshCw,
} from 'lucide-react'

const statusColors = {
  pending: 'bg-yellow-500',
  accepted: 'bg-blue-500',
  preparing: 'bg-orange-500',
  ready: 'bg-purple-500',
  out_for_delivery: 'bg-cyan-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500',
}

const EmptyState = ({ message = 'Nenhum dado encontrado para o período selecionado.' }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-dark-600 py-10 text-center">
    <BarChart3 size={32} className="mb-2 text-gray-600" />
    <p className="text-sm text-gray-400">{message}</p>
  </div>
)

const KpiCard = ({ icon: Icon, label, value, sub, color }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 truncate">{label}</p>
        <p className="text-xl font-bold text-white truncate">{value}</p>
        {sub && <p className="text-xs text-gray-500 truncate">{sub}</p>}
      </div>
    </CardContent>
  </Card>
)

const Reports = () => {
  const [period, setPeriod] = useState('30days')
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' })
  const reportFilters = period === 'custom'
    ? { period, ...customRange }
    : { period }

  const {
    summary,
    topProducts,
    ordersByStatus,
    paymentTotals,
    hourlySales,
    reportOrders,
    loading,
    refetch,
  } = useReports(reportFilters)

  const periodOptions = [
    { value: 'today', label: 'Hoje' },
    { value: 'month', label: 'Este mês' },
    { value: '7days', label: 'Últimos 7 dias' },
    { value: '30days', label: 'Últimos 30 dias' },
    { value: '90days', label: 'Últimos 90 dias' },
    { value: 'custom', label: 'Período personalizado' },
  ]

  const revenueRows = (reportOrders || []).map(order => ({
    data: new Date(order.created_at).toLocaleString('pt-BR'),
    numero: order.order_number,
    cliente: order.customer_name,
    status: ORDER_STATUS_LABELS[order.status] || order.status,
    pagamento: PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method,
    subtotal: Number(order.subtotal || 0).toFixed(2),
    taxa: Number(order.delivery_fee || 0).toFixed(2),
    desconto: Number(order.discount_amount || 0).toFixed(2),
    total: Number(order.total || 0).toFixed(2),
    custo: Number(order.total_cost || (order.order_items || []).reduce((sum, item) => sum + Number(item.total_cost_at_sale || 0), 0)).toFixed(2),
    lucro: Number(order.gross_profit || (order.order_items || []).reduce((sum, item) => sum + Number(item.gross_profit_at_sale || 0), 0)).toFixed(2),
  }))

  const productRows = (topProducts || []).map(product => ({
    produto: product.name,
    quantidade: product.quantity,
    faturamento: Number(product.revenue || 0).toFixed(2),
    custo: Number(product.totalCost || 0).toFixed(2),
    lucro: Number(product.grossProfit || 0).toFixed(2),
    margem: `${Number(product.profitMargin || 0).toFixed(1)}%`,
    participacao: summary?.receivedRevenue
      ? `${((Number(product.revenue || 0) / Number(summary.receivedRevenue || 1)) * 100).toFixed(1)}%`
      : '0%',
  }))

  const revenueColumns = [
    { key: 'data', label: 'Data' },
    { key: 'numero', label: 'Numero do pedido' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'status', label: 'Status' },
    { key: 'pagamento', label: 'Forma de pagamento' },
    { key: 'subtotal', label: 'Subtotal' },
    { key: 'taxa', label: 'Taxa de entrega' },
    { key: 'desconto', label: 'Desconto' },
    { key: 'total', label: 'Total final' },
    { key: 'custo', label: 'Custo dos produtos' },
    { key: 'lucro', label: 'Lucro bruto' },
  ]

  const productColumns = [
    { key: 'produto', label: 'Produto' },
    { key: 'quantidade', label: 'Quantidade vendida' },
    { key: 'faturamento', label: 'Valor faturado' },
    { key: 'custo', label: 'Custo' },
    { key: 'lucro', label: 'Lucro bruto' },
    { key: 'margem', label: 'Margem' },
    { key: 'participacao', label: 'Participacao' },
  ]

  const peakHour = [...(hourlySales || [])].sort((a, b) => Number(b.total || 0) - Number(a.total || 0))[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <RefreshCw size={20} className="mr-2 animate-spin" />
        Carregando relatórios...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Relatórios</h1>
          <p className="mt-0.5 text-sm text-gray-400">Análise financeira e de desempenho do período selecionado.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            options={periodOptions}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-48"
          />
          {period === 'custom' && (
            <>
              <Input type="date" value={customRange.startDate} onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))} className="w-36" />
              <Input type="date" value={customRange.endDate} onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))} className="w-36" />
            </>
          )}
          <Button variant="outline" onClick={refetch}>
            <RefreshCw size={16} className="mr-1.5" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={() => exportToCsv(revenueRows, 'faturamento', revenueColumns)} disabled={!revenueRows.length}>
            <Download size={16} className="mr-1.5" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => exportToXlsx(revenueRows, 'faturamento', revenueColumns, 'Faturamento')} disabled={!revenueRows.length}>
            <Download size={16} className="mr-1.5" />
            XLSX
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label="Faturamento recebido"
          value={formatCurrency(summary?.totalRevenue || 0)}
          sub={`Bruto: ${formatCurrency(summary?.grossSales || summary?.grossRevenue || 0)}`}
          color="bg-green-500/15 text-green-400"
        />
        <KpiCard
          icon={TrendingUp}
          label="Lucro bruto"
          value={formatCurrency(summary?.grossProfit || 0)}
          sub={`Margem: ${Number(summary?.profitMargin || 0).toFixed(1)}%`}
          color="bg-emerald-500/15 text-emerald-400"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Pedidos"
          value={summary?.totalOrders || 0}
          sub={`Ticket médio: ${formatCurrency(summary?.averageTicket || 0)}`}
          color="bg-blue-500/15 text-blue-400"
        />
        <KpiCard
          icon={Users}
          label="Novos clientes"
          value={summary?.newCustomers || 0}
          sub={`Recorrentes: ${summary?.recurringCustomers || 0}`}
          color="bg-purple-500/15 text-purple-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Custo dos produtos</p>
            <p className="mt-0.5 text-lg font-bold text-white">{formatCurrency(summary?.totalCost || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-blue-400" />
              <p className="text-xs text-gray-400">Itens vendidos</p>
            </div>
            <p className="mt-0.5 text-lg font-bold text-white">{summary?.totalProductsSold || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-yellow-400" />
              <p className="text-xs text-gray-400">Em aberto</p>
            </div>
            <p className="mt-0.5 text-lg font-bold text-white">{summary?.openOrders || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-red-400" />
              <p className="text-xs text-gray-400">Cancelados</p>
            </div>
            <p className="mt-0.5 text-lg font-bold text-white">{summary?.cancelledOrders || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4">
            <h2 className="font-bold text-white">Produtos mais vendidos</h2>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {(!topProducts || topProducts.length === 0) ? <EmptyState /> : (
              <div className="space-y-2">
                {topProducts.slice(0, 8).map((product, index) => {
                  const participation = summary?.receivedRevenue
                    ? ((Number(product.revenue || 0) / Number(summary.receivedRevenue || 1)) * 100).toFixed(1)
                    : '0'
                  return (
                    <div key={index} className="flex items-center gap-3 rounded-lg bg-dark-900 p-2.5">
                      <span className="w-5 shrink-0 text-center text-xs font-bold text-gray-500">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{product.name}</p>
                        <div className="mt-1 h-1 rounded-full bg-dark-600 overflow-hidden">
                          <div
                            className="h-1 rounded-full bg-white/30"
                            style={{ width: `${Math.min(100, Number(participation))}%` }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-white">{formatCurrency(product.revenue)}</p>
                        <p className="text-xs text-green-400">{product.quantity} un · {participation}%</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <h2 className="font-bold text-white">Status dos pedidos</h2>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {Object.keys(ordersByStatus || {}).length === 0 ? <EmptyState /> : (
              <div className="space-y-2">
                {Object.entries(ordersByStatus || {}).map(([status, data]) => (
                  <div key={status} className="flex items-center justify-between rounded-lg bg-dark-900 p-2.5">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${statusColors[status] || 'bg-gray-500'}`} />
                      <span className="text-sm text-white">
                        {ORDER_STATUS_LABELS?.[status] || status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-white">{data.count || 0}</span>
                      <span className="ml-2 text-xs text-gray-400">{formatCurrency(data.total || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="p-4">
            <h2 className="font-bold text-white">Resumo executivo</h2>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {[
              { label: 'Pedidos hoje', value: summary?.todayOrders || 0 },
              { label: 'Faturamento hoje', value: formatCurrency(summary?.todayRevenue || 0) },
              { label: 'Cupons utilizados', value: summary?.usedCoupons || 0 },
              { label: 'Horário mais forte', value: peakHour ? `${String(peakHour.hour).padStart(2, '0')}h` : '-' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-dark-900 px-3 py-2 text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold text-white">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <h2 className="font-bold text-white">Receita por pagamento</h2>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {Object.keys(paymentTotals || {}).length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">Nenhum dado</p>
            ) : (
              Object.entries(paymentTotals || {}).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between rounded-lg bg-dark-900 px-3 py-2 text-sm">
                  <span className="text-gray-400">{PAYMENT_METHOD_LABELS[method] || method}</span>
                  <span className="font-semibold text-white">{formatCurrency(data.total || 0)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <h2 className="font-bold text-white">Exportar dados</h2>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <Button onClick={() => exportToCsv(revenueRows, 'faturamento', revenueColumns)} variant="outline" className="w-full" disabled={!revenueRows.length}>
              <Download size={16} className="mr-2" />
              Pedidos CSV
            </Button>
            <Button onClick={() => exportToXlsx(revenueRows, 'faturamento', revenueColumns, 'Faturamento')} variant="outline" className="w-full" disabled={!revenueRows.length}>
              <Download size={16} className="mr-2" />
              Pedidos XLSX
            </Button>
            <Button onClick={() => exportToCsv(productRows, 'top_produtos', productColumns)} variant="outline" className="w-full" disabled={!productRows.length}>
              <Download size={16} className="mr-2" />
              Produtos CSV
            </Button>
            <Button onClick={() => exportToXlsx(productRows, 'top_produtos', productColumns, 'Top Produtos')} variant="outline" className="w-full" disabled={!productRows.length}>
              <Download size={16} className="mr-2" />
              Produtos XLSX
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Reports
