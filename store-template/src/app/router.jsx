import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { PublicLayout } from '../components/layout/PublicLayout'
import { AdminLayout } from '../components/layout/AdminLayout'
import { ProtectedRoute } from '../components/shared/ProtectedRoute'
import { PageLoader } from '../components/ui/Loader'
import { useAuth } from '../hooks/useAuth'
import { CompanySlugProvider, useCompanyBasePath } from '../contexts/CompanySlugContext'
import { COMPANY_SLUG } from '../services/replymeshApi'

// Public Pages
const Home = lazy(() => import('../pages/public/Home'))
const Menu = lazy(() => import('../pages/public/Menu'))
const ProductDetails = lazy(() => import('../pages/public/ProductDetails'))
const Cart = lazy(() => import('../pages/public/Cart'))
const Checkout = lazy(() => import('../pages/public/Checkout'))
const Success = lazy(() => import('../pages/public/Success'))
const TableQrMenu = lazy(() => import('../pages/public/TableQrMenu'))
const MyAccount = lazy(() => import('../pages/public/MyAccount'))
const Wheel = lazy(() => import('../pages/public/Wheel'))

// Auth Pages
const Login = lazy(() => import('../pages/auth/Login'))
const MasterImpersonation = lazy(() => import('../pages/auth/MasterImpersonation'))

// Admin Pages
const Dashboard = lazy(() => import('../pages/admin/Dashboard'))
const Orders = lazy(() => import('../pages/admin/Orders'))
const OrderDetails = lazy(() => import('../pages/admin/OrderDetails'))
const Products = lazy(() => import('../pages/admin/Products'))
const Categories = lazy(() => import('../pages/admin/Categories'))
const DeliveryZones = lazy(() => import('../pages/admin/DeliveryZones'))
const Customers = lazy(() => import('../pages/admin/Customers'))
const CustomerDetails = lazy(() => import('../pages/admin/CustomerDetails'))
const Coupons = lazy(() => import('../pages/admin/Coupons'))
const WheelSettings = lazy(() => import('../pages/admin/WheelSettings'))
const Users = lazy(() => import('../pages/admin/Users'))
const Reports = lazy(() => import('../pages/admin/Reports'))
const CashRegister = lazy(() => import('../pages/admin/CashRegister'))
const Tables = lazy(() => import('../pages/admin/Tables'))
const Settings = lazy(() => import('../pages/admin/Settings'))
const Whatsapp = lazy(() => import('../pages/admin/Whatsapp'))
const WhatsappQrCode = lazy(() => import('../pages/admin/WhatsappQrCode'))
const WhatsappTemplates = lazy(() => import('../pages/admin/WhatsappTemplates'))
const WhatsappLogs = lazy(() => import('../pages/admin/WhatsappLogs'))
const MarketingWhatsapp = lazy(() => import('../pages/admin/MarketingWhatsapp'))
const SalesRecovery = lazy(() => import('../pages/admin/SalesRecovery'))
// AiAssistant removido da loja (Fase 15.12) — config apenas no master
const Motoboys = lazy(() => import('../pages/admin/Motoboys'))
const Inventory = lazy(() => import('../pages/admin/Inventory'))
const InventoryMovements = lazy(() => import('../pages/admin/InventoryMovements'))
const CreateKitchenUser = lazy(() => import('../pages/admin/CreateKitchenUser'))
const AppBanners = lazy(() => import('../pages/admin/AppBanners'))
const Support = lazy(() => import('../pages/admin/Support'))
const SystemUpdates = lazy(() => import('../pages/admin/SystemUpdates'))
const PosSale = lazy(() => import('../pages/admin/PosSale'))

// Kitchen Pages
const KitchenBoard = lazy(() => import('../pages/kitchen/KitchenBoard'))
const MotoboyLogin = lazy(() => import('../pages/motoboy/MotoboyLogin'))
const MotoboyDashboard = lazy(() => import('../pages/motoboy/MotoboyDashboard'))
const MotoboyHistory = lazy(() => import('../pages/motoboy/MotoboyHistory'))
const MotoboyFinance = lazy(() => import('../pages/motoboy/MotoboyFinance'))
const MotoboyProfile = lazy(() => import('../pages/motoboy/MotoboyProfile'))

const page = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

const protectedPage = (Component, allowedRoles) => (
  <ProtectedRoute allowedRoles={allowedRoles}>
    {page(Component)}
  </ProtectedRoute>
)

const AdminIndexRedirect = () => {
  const { profile } = useAuth()
  const basePath = useCompanyBasePath()
  const target = profile?.role === 'waiter'
    ? `${basePath}/admin/tables`
    : profile?.role === 'attendant'
      ? `${basePath}/admin/orders`
      : `${basePath}/admin/dashboard`
  return <Navigate to={target} replace />
}

const RemovedStoreAiRedirect = () => {
  const basePath = useCompanyBasePath()
  return <Navigate to={`${basePath}/admin/dashboard`} replace />
}

// Layout wrapper que lê o slug da URL e injeta no contexto
const SluggedPublicLayout = () => {
  const { companySlug } = useParams()
  return (
    <CompanySlugProvider slug={companySlug} basePath={`/loja/${companySlug}`}>
      <PublicLayout />
    </CompanySlugProvider>
  )
}

const SluggedLogin = () => {
  const { companySlug } = useParams()
  return (
    <CompanySlugProvider slug={companySlug} basePath={`/loja/${companySlug}`}>
      {page(Login)}
    </CompanySlugProvider>
  )
}

const SluggedAdminLayout = () => {
  const { companySlug } = useParams()
  return (
    <CompanySlugProvider slug={companySlug} basePath={`/loja/${companySlug}`}>
      <ProtectedRoute allowedRoles={['admin', 'attendant', 'waiter']}>
        <AdminLayout />
      </ProtectedRoute>
    </CompanySlugProvider>
  )
}

const SluggedMotoboyLogin = () => {
  const { companySlug } = useParams()
  return (
    <CompanySlugProvider slug={companySlug} basePath={`/loja/${companySlug}`}>
      {page(MotoboyLogin)}
    </CompanySlugProvider>
  )
}

const SluggedMotoboyPage = ({ component: Component }) => {
  const { companySlug } = useParams()
  return (
    <CompanySlugProvider slug={companySlug} basePath={`/loja/${companySlug}`}>
      {page(Component)}
    </CompanySlugProvider>
  )
}

// Filhos públicos reutilizados em ambas as rotas
const publicChildren = [
  { index: true, element: page(Home) },
  { path: 'menu', element: page(Menu) },
  { path: 'products/:productId', element: page(ProductDetails) },
  { path: 'cart', element: page(Cart) },
  { path: 'checkout', element: page(Checkout) },
  { path: 'minha-conta', element: page(MyAccount) },
  { path: 'roleta', element: page(Wheel) },
  { path: 'success/:orderId', element: page(Success) },
  { path: 'pedido/:orderId', element: page(Success) },
  { path: 'mesa/:qrToken', element: page(TableQrMenu) },
]

const adminChildren = [
  { index: true, element: <AdminIndexRedirect /> },
  { path: 'dashboard', element: protectedPage(Dashboard, ['admin']) },
  { path: 'orders', element: page(Orders) },
  { path: 'orders/:orderId', element: page(OrderDetails) },
  { path: 'products', element: protectedPage(Products, ['admin']) },
  { path: 'categories', element: protectedPage(Categories, ['admin']) },
  { path: 'delivery-zones', element: protectedPage(DeliveryZones, ['admin']) },
  { path: 'customers', element: protectedPage(Customers, ['admin']) },
  { path: 'customers/:customerId', element: protectedPage(CustomerDetails, ['admin']) },
  { path: 'coupons', element: protectedPage(Coupons, ['admin']) },
  { path: 'wheel', element: protectedPage(WheelSettings, ['admin']) },
  { path: 'users', element: protectedPage(Users, ['admin']) },
  { path: 'reports', element: protectedPage(Reports, ['admin']) },
  { path: 'cash', element: protectedPage(CashRegister, ['admin']) },
  { path: 'cash-register', element: protectedPage(CashRegister, ['admin']) },
  { path: 'tables', element: protectedPage(Tables, ['admin', 'attendant', 'waiter']) },
  { path: 'settings', element: protectedPage(Settings, ['admin']) },
  { path: 'whatsapp', element: protectedPage(Whatsapp, ['admin']) },
  { path: 'whatsapp/qrcode', element: protectedPage(WhatsappQrCode, ['admin']) },
  { path: 'whatsapp/templates', element: protectedPage(WhatsappTemplates, ['admin']) },
  { path: 'whatsapp/logs', element: protectedPage(WhatsappLogs, ['admin']) },
  { path: 'whatsapp-templates', element: protectedPage(WhatsappTemplates, ['admin']) },
  { path: 'marketing-whatsapp', element: protectedPage(MarketingWhatsapp, ['admin']) },
  { path: 'sales-recovery', element: protectedPage(SalesRecovery, ['admin']) },
  { path: 'ai', element: <RemovedStoreAiRedirect /> },
  { path: 'motoboys', element: page(Motoboys) },
  { path: 'inventory', element: protectedPage(Inventory, ['admin']) },
  { path: 'inventory/movements', element: protectedPage(InventoryMovements, ['admin']) },
  { path: 'create-kitchen-user', element: protectedPage(CreateKitchenUser, ['admin']) },
  { path: 'app-banners', element: protectedPage(AppBanners, ['admin']) },
  { path: 'support',  element: protectedPage(Support, ['admin']) },
  { path: 'updates',  element: protectedPage(SystemUpdates, ['admin']) },
  { path: 'pos', element: protectedPage(PosSale, ['admin', 'attendant']) },
]

export const router = createBrowserRouter([
  // ── Rota raiz — usa slug do .env (empresa-teste) ───────────────────────────
  {
    path: '/',
    element: (
      <CompanySlugProvider slug={COMPANY_SLUG} basePath="">
        <PublicLayout />
      </CompanySlugProvider>
    ),
    children: publicChildren,
  },

  // ── /loja/:companySlug — qualquer empresa pelo slug ────────────────────────
  {
    path: '/loja/:companySlug',
    element: <SluggedPublicLayout />,
    children: publicChildren,
  },
  {
    path: '/loja/:companySlug/login',
    element: <SluggedLogin />,
  },
  {
    path: '/loja/:companySlug/admin/impersonate',
    element: page(MasterImpersonation),
  },
  {
    path: '/loja/:companySlug/admin',
    element: <SluggedAdminLayout />,
    children: adminChildren,
  },
  {
    path: '/loja/:companySlug/motoboy/login',
    element: <SluggedMotoboyLogin />,
  },
  {
    path: '/loja/:companySlug/motoboy/dashboard',
    element: <SluggedMotoboyPage component={MotoboyDashboard} />,
  },
  {
    path: '/loja/:companySlug/motoboy/history',
    element: <SluggedMotoboyPage component={MotoboyHistory} />,
  },
  {
    path: '/loja/:companySlug/motoboy/financeiro',
    element: <SluggedMotoboyPage component={MotoboyFinance} />,
  },
  {
    path: '/loja/:companySlug/motoboy/profile',
    element: <SluggedMotoboyPage component={MotoboyProfile} />,
  },

  {
    path: '/login',
    element: page(Login),
  },
  {
    path: '/admin',
    element: (
      <CompanySlugProvider slug={COMPANY_SLUG} basePath="">
        <ProtectedRoute allowedRoles={['admin', 'attendant', 'waiter']}>
          <AdminLayout />
        </ProtectedRoute>
      </CompanySlugProvider>
    ),
    children: adminChildren,
  },
  {
    path: '/kitchen',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'kitchen']}>
        {page(KitchenBoard)}
      </ProtectedRoute>
    ),
  },
  {
    path: '/motoboy',
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      {
        path: 'login',
        element: (
          <CompanySlugProvider slug={COMPANY_SLUG} basePath="">
            {page(MotoboyLogin)}
          </CompanySlugProvider>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <CompanySlugProvider slug={COMPANY_SLUG} basePath="">
            {page(MotoboyDashboard)}
          </CompanySlugProvider>
        ),
      },
      {
        path: 'history',
        element: (
          <CompanySlugProvider slug={COMPANY_SLUG} basePath="">
            {page(MotoboyHistory)}
          </CompanySlugProvider>
        ),
      },
      {
        path: 'financeiro',
        element: (
          <CompanySlugProvider slug={COMPANY_SLUG} basePath="">
            {page(MotoboyFinance)}
          </CompanySlugProvider>
        ),
      },
      {
        path: 'profile',
        element: (
          <CompanySlugProvider slug={COMPANY_SLUG} basePath="">
            {page(MotoboyProfile)}
          </CompanySlugProvider>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], {
  future: {
    v7_startTransition: true,
  },
})
