import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Settings, ShoppingBag, MapPin, MessageSquare, Receipt, X } from 'lucide-react'
import { getDashboardStats, getStoreOrders, updateStoreOrderStatus } from '../../services/storeApi'
import DashboardStats from '../../components/dashboard/DashboardStats'
import OrdersTable from '../../components/dashboard/OrdersTable'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useCompanyBasePath, useCompanySlug } from '../../contexts/CompanySlugContext'

const isAdminProfile = (profile) => {
  const role = profile?.role || profile?.company_member_role
  return ['admin', 'store_admin', 'owner', 'manager', 'super_admin'].includes(role)
}

const AdminOnboarding = ({ stats, orders }) => {
  const { profile } = useAuth()
  const companySlug = useCompanySlug()
  const basePath = useCompanyBasePath()
  const storageKey = `replymesh:onboarding:${companySlug}:state`
  const [state, setState] = useState({ dismissed: false, completed: [] })

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}')
      setState({
        dismissed: Boolean(stored.dismissed),
        completed: Array.isArray(stored.completed) ? stored.completed : [],
      })
    } catch {
      setState({ dismissed: false, completed: [] })
    }
  }, [storageKey])

  const persist = (nextState) => {
    setState(nextState)
    localStorage.setItem(storageKey, JSON.stringify(nextState))
  }

  const markCompleted = (id) => {
    if (state.completed.includes(id)) return
    persist({ ...state, completed: [...state.completed, id] })
  }

  if (!isAdminProfile(profile) || state.dismissed) return null

  const hasOrders = Number(stats?.totalOrders || stats?.todayOrders || 0) > 0 || orders.length > 0
  const adminPath = (path) => `${basePath}${path}`
  const publicPath = (path) => `${basePath}${path}`
  const completed = new Set(state.completed)

  if (hasOrders) completed.add('test-order')

  const steps = [
    { id: 'settings', label: 'Configurar sua loja', to: adminPath('/admin/settings'), icon: Settings },
    { id: 'products', label: 'Cadastrar cardapio', to: adminPath('/admin/products'), icon: ShoppingBag },
    { id: 'delivery', label: 'Configurar entregas', to: adminPath('/admin/delivery-zones'), icon: MapPin },
    { id: 'whatsapp', label: 'Conectar WhatsApp', to: adminPath('/admin/whatsapp'), icon: MessageSquare },
    { id: 'test-order', label: 'Fazer pedido teste', to: publicPath('/menu'), icon: CheckCircle2 },
    { id: 'pos', label: 'Abrir caixa / testar PDV', to: adminPath('/admin/pos'), icon: Receipt },
  ]

  const firstOpenStep = steps.find((step) => !completed.has(step.id)) || steps[0]

  return (
    <Card className="mb-6 overflow-hidden border-yellow-500/30 bg-gradient-to-r from-dark-900 to-dark-800">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-yellow-300">Comece por aqui!</p>
                <h2 className="mt-1 text-xl font-bold text-white">Prepare sua loja para vender</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-400">
                  Siga os passos principais para deixar o painel pronto sem atrapalhar a operacao diaria.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-dark-700 hover:text-white lg:hidden"
                onClick={() => persist({ ...state, dismissed: true })}
                aria-label="Fechar onboarding"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon
                const done = completed.has(step.id)
                return (
                  <Link
                    key={step.id}
                    to={step.to}
                    onClick={() => markCompleted(step.id)}
                    className="flex items-center gap-3 rounded-lg border border-dark-700 bg-dark-950/60 px-3 py-2 text-sm text-gray-200 transition hover:border-yellow-500/50 hover:bg-dark-800"
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${done ? 'bg-green-500/15 text-green-300' : 'bg-dark-800 text-gray-400'}`}>
                      {done ? <CheckCircle2 size={17} /> : <Icon size={17} />}
                    </span>
                    <span className="min-w-0 flex-1">{step.label}</span>
                    {!done && <Circle size={12} className="shrink-0 text-gray-600" />}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link to={firstOpenStep.to} onClick={() => markCompleted(firstOpenStep.id)}>
              <Button type="button" size="sm">Comece por aqui</Button>
            </Link>
            <button
              type="button"
              className="hidden rounded-lg p-2 text-gray-400 transition hover:bg-dark-700 hover:text-white lg:inline-flex"
              onClick={() => persist({ ...state, dismissed: true })}
              aria-label="Fechar onboarding"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState(null)

  const updateOrderLocally = useCallback((updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
  }, [])

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true)
        const payload = await getStoreOrders({ params: { limit: 10 } })
        setOrders(payload.orders || [])
        setOrdersError(null)
      } catch (err) {
        setOrdersError(err.message)
      } finally {
        setOrdersLoading(false)
      }
    }
    fetchOrders()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats()
        // Normalizar resposta Rails para o formato esperado pelo DashboardStats
        setStats({
          todayRevenue:       (data.today_revenue_cents || 0) / 100,
          todayOrders:        data.today_orders || 0,
          averageTicket:      (data.average_ticket_cents || 0) / 100,
          newCustomers:       data.new_customers_today || 0,
          statusCounts:       data.status_counts || {},
          totalOrders:        data.total_orders || 0,
          totalRevenue:       (data.total_revenue_cents || 0) / 100,
          lowStockItems:      data.low_stock_items || 0,
          outOfStockItems:    data.out_of_stock_items || 0,
          recurringCustomers: data.recurring_customers || 0,
          usedCoupons:        data.used_coupons || 0,
          trendData:          data.trend_data || [],
        })
      } catch (error) {
        console.error('Erro ao buscar stats do dashboard:', error)
        setStats({})
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral do seu negócio</p>
      </div>

      <DashboardStats stats={stats} loading={loading} />

      <AdminOnboarding stats={stats || {}} orders={orders} />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Pedidos Recentes</h2>
            <Link
              to="/admin/orders"
              className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Ver todos os pedidos →
            </Link>
          </div>
          <OrdersTable
            orders={orders}
            loading={ordersLoading}
            error={ordersError}
            onOrderUpdated={updateOrderLocally}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
