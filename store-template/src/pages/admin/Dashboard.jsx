import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Settings, ShoppingBag, MapPin, MessageSquare, Receipt, X, ListChecks, ArrowRight } from 'lucide-react'
import { getDashboardStats, getStoreOrders, updateStoreOrderStatus } from '../../services/storeApi'
import DashboardStats from '../../components/dashboard/DashboardStats'
import OrdersTable from '../../components/dashboard/OrdersTable'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { useCompanyBasePath, useCompanySlug } from '../../contexts/CompanySlugContext'

const isAdminProfile = (profile) => {
  const role = profile?.role || profile?.company_member_role
  return ['admin', 'store_admin', 'owner', 'manager', 'super_admin'].includes(role)
}

const AdminOnboarding = ({ stats, orders, loading }) => {
  const { profile } = useAuth()
  const companySlug = useCompanySlug()
  const basePath = useCompanyBasePath()
  const storageKey = `replymesh:onboarding:${companySlug}:state`
  const [state, setState] = useState({ completed: [] })
  const [hydrated, setHydrated] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [notificationVisible, setNotificationVisible] = useState(true)

  useEffect(() => {
    setHydrated(false)
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}')
      setState({
        completed: Array.isArray(stored.completed) ? stored.completed : [],
      })
    } catch {
      setState({ completed: [] })
    }
    setNotificationVisible(true)
    setHydrated(true)
  }, [storageKey])

  const persist = (nextState) => {
    setState(nextState)
    localStorage.setItem(storageKey, JSON.stringify(nextState))
  }

  const markCompleted = (id) => {
    if (state.completed.includes(id)) return
    persist({ ...state, completed: [...state.completed, id] })
  }

  if (!isAdminProfile(profile) || !hydrated || loading) return null

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
  const completedCount = steps.filter((step) => completed.has(step.id)).length
  const progress = Math.round((completedCount / steps.length) * 100)

  if (completedCount === steps.length || !notificationVisible) return null

  return (
    <>
      <div className="fixed inset-x-3 top-16 z-30 sm:inset-x-auto sm:right-4 sm:top-16 sm:w-[348px]">
        <div className="rounded-lg border border-yellow-500/40 bg-dark-900 p-4 shadow-2xl shadow-black/40">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-black">
              <ListChecks size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase text-yellow-300">Primeiros passos</p>
              <h2 className="mt-0.5 text-base font-bold text-white">Prepare sua loja para vender</h2>
              <p className="mt-1 text-sm text-gray-400">{completedCount} de {steps.length} etapas concluídas</p>
            </div>
            <button
              type="button"
              className="rounded-md p-1.5 text-gray-400 transition hover:bg-dark-700 hover:text-white"
              onClick={() => setNotificationVisible(false)}
              aria-label="Dispensar primeiros passos"
            >
              <X size={17} />
            </button>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-dark-700" aria-label={`Progresso: ${progress}%`}>
            <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${progress}%` }} />
          </div>

          <Button type="button" size="sm" className="mt-4 w-full gap-2" onClick={() => setGuideOpen(true)}>
            Comece por aqui
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

      <Modal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="Prepare sua loja para vender"
        size="lg"
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm text-gray-400">
              Siga estas etapas para deixar sua operação pronta. Você pode fechar este guia e continuar depois.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-dark-700">
                <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm font-semibold text-white">{progress}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {steps.map((step, index) => {
              const Icon = step.icon
              const done = completed.has(step.id)
              return (
                <Link
                  key={step.id}
                  to={step.to}
                  onClick={() => markCompleted(step.id)}
                  className="group flex min-h-[76px] items-center gap-3 rounded-lg border border-dark-600 bg-dark-900 p-3 transition hover:border-yellow-500/60 hover:bg-dark-700"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${done ? 'bg-green-500/15 text-green-300' : 'bg-dark-700 text-gray-300 group-hover:text-yellow-300'}`}>
                    {done ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-gray-500">Etapa {index + 1}</span>
                    <span className="block text-sm font-medium text-white">{step.label}</span>
                  </span>
                  {done ? <CheckCircle2 size={17} className="shrink-0 text-green-400" /> : <Circle size={15} className="shrink-0 text-gray-600" />}
                </Link>
              )
            })}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-dark-600 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="px-3 py-2 text-sm text-gray-400 transition hover:text-white"
              onClick={() => {
                setGuideOpen(false)
                setNotificationVisible(false)
              }}
            >
              Fechar por agora
            </button>
            <Link to={firstOpenStep.to} onClick={() => markCompleted(firstOpenStep.id)}>
              <Button type="button" className="w-full gap-2 sm:w-auto">
                Continuar configuração
                <ArrowRight size={17} />
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </>
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
          yesterdayRevenue:   (data.yesterday_revenue_cents || 0) / 100,
          revenueChangePercent: Number(data.today_revenue_change_percent || 0),
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
          salesCoach:         data.sales_coach || {},
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

      <AdminOnboarding
        stats={stats || {}}
        orders={orders}
        loading={loading || ordersLoading}
      />

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
