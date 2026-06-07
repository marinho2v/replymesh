import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MapPin,
  Users,
  Ticket,
  Settings,
  LogOut,
  ChefHat,
  MessageSquare,
  Megaphone,
  BarChart3,
  UserCog,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Warehouse,
  History,
  Bike,
  Wallet,
  Armchair,
  Trophy,
  Smartphone,
  Bell,
  Calendar,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { signOut } from '../../services/auth'
import { toast } from 'sonner'
import BrandLogo from '../shared/BrandLogo'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationsDropdown from '../shared/NotificationsDropdown'
import AiFloatingChat from '../ai/AiFloatingChat'
import { revokeMasterImpersonation } from '../../services/replymeshApi'

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { store } = usePublicStoreInfo()
  const basePath = useCompanyBasePath()
  const adminBasePath = `${basePath}/admin`
  const adminPath = (path) => path.replace('/admin', adminBasePath)
  const storeName = store?.name || store?.store_name || ''
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications()
  const impersonation = (() => {
    try {
      return JSON.parse(localStorage.getItem('replymesh_master_impersonation') || 'null')
    } catch {
      return null
    }
  })()

  const leaveImpersonation = async () => {
    try {
      if (impersonation?.session_token) {
        await revokeMasterImpersonation(impersonation.session_token)
      }
    } catch {
      toast.error('A sessao foi encerrada localmente, mas a revogacao remota falhou.')
    }
    localStorage.removeItem('replymesh_impersonation_token')
    localStorage.removeItem('replymesh_impersonation_user')
    localStorage.removeItem('replymesh_impersonation_profile')
    localStorage.removeItem('replymesh_master_impersonation')
    if (impersonation?.previous_company_id) {
      localStorage.setItem('replymesh_store_company_id', String(impersonation.previous_company_id))
    } else {
      localStorage.removeItem('replymesh_store_company_id')
    }
    if (impersonation?.previous_company_slug) {
      localStorage.setItem('replymesh_store_company_slug', impersonation.previous_company_slug)
    } else {
      localStorage.removeItem('replymesh_store_company_slug')
    }
    window.dispatchEvent(new Event('replymesh-auth-changed'))
    window.location.href = 'http://127.0.0.1:5173/empresas'
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate(`${basePath}/login`)
      toast.success('Logout realizado com sucesso')
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  const menuSections = [
    {
      title: null,
      items: [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin'] },
      ],
    },
    {
      title: 'Operacao',
      items: [
        { path: '/admin/orders', icon: ShoppingBag, label: 'Pedidos', roles: ['admin', 'attendant'] },
        { path: '/admin/tables', icon: Armchair, label: 'Mesas', roles: ['admin', 'attendant'] },
      ],
    },
    {
      title: 'Cardapio',
      items: [
        { path: '/admin/products', icon: Package, label: 'Produtos', roles: ['admin'] },
        { path: '/admin/categories', icon: Package, label: 'Categorias', roles: ['admin'] },
      ],
    },
    {
      title: 'Entrega',
      items: [
        { path: '/admin/delivery-zones', icon: MapPin, label: 'Areas de Entrega', roles: ['admin'] },
        { path: '/admin/motoboys', icon: Bike, label: 'Motoboys', roles: ['admin', 'attendant'] },
      ],
    },
    {
      title: 'Clientes & Promocoes',
      items: [
        { path: '/admin/customers', icon: Users, label: 'Clientes', roles: ['admin'] },
        { path: '/admin/coupons', icon: Ticket, label: 'Cupons', roles: ['admin'] },
        { path: '/admin/wheel', icon: Trophy, label: 'Roleta', roles: ['admin'] },
      ],
    },
    {
      title: 'Estoque',
      items: [
        { path: '/admin/inventory', icon: Warehouse, label: 'Itens de Estoque', roles: ['admin'] },
        { path: '/admin/inventory/movements', icon: History, label: 'Movimentacoes', roles: ['admin'] },
      ],
    },
    {
      title: 'Financeiro',
      items: [
        { path: '/admin/cash-register', icon: Wallet, label: 'Caixa', roles: ['admin'] },
        { path: '/admin/reports', icon: BarChart3, label: 'Relatorios', roles: ['admin'] },
      ],
    },
    {
      title: 'Comunicacao',
      items: [
        { path: '/admin/whatsapp', icon: MessageSquare, label: 'WhatsApp', roles: ['admin'], exact: true },
        { path: '/admin/whatsapp/templates', icon: MessageSquare, label: 'Templates WhatsApp', roles: ['admin'] },
        { path: '/admin/marketing-whatsapp', icon: Megaphone, label: 'Marketing WhatsApp', roles: ['admin'] },
        { path: '/admin/sales-recovery', icon: RefreshCw, label: 'Recuperador de Vendas', roles: ['admin'] },
        { path: '/admin/app-banners', icon: Smartphone, label: 'Aplicativo Android', roles: ['admin'] },
        // IA removida do menu (Fase 15.12) — aparece como botão flutuante
      ],
    },
    {
      title: 'Administracao',
      items: [
        { path: '/admin/users', icon: UserCog, label: 'Usuarios', roles: ['admin'] },
        { path: '/admin/settings', icon: Settings, label: 'Configuracoes', roles: ['admin'] },
      ],
    },
    {
      title: null,
      items: [
        { path: '/admin/support',  icon: LifeBuoy,  label: 'Suporte',       roles: ['admin'], highlight: true },
        { path: '/admin/updates',  icon: Sparkles,  label: 'Atualizações',  roles: ['admin'] },
      ],
    },
  ]

  const visibleSections = menuSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(profile?.role)),
    }))
    .filter(section => section.items.length > 0)

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-900 border-r border-dark-700 transform transition-all duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'} lg:translate-x-0`}
        >
          <div className="flex flex-col h-full">
            <div className={`flex items-center h-16 border-b border-dark-700 ${sidebarCollapsed ? 'lg:justify-center lg:px-3' : 'justify-between px-3'}`}>
              <Link
                to={profile?.role === 'attendant' ? adminPath('/admin/orders') : adminPath('/admin/dashboard')}
                className={`flex flex-1 items-center min-w-0 ${sidebarCollapsed ? 'lg:justify-center' : ''}`}
                title={storeName}
              >
                <BrandLogo
                  size="sm"
                  showText={false}
                  name={storeName}
                  logoUrl={store?.logo_url}
                  className={sidebarCollapsed ? 'lg:justify-center' : ''}
                />
                <span className={`ml-2.5 min-w-0 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                  <span className="block truncate text-[13px] font-bold leading-tight text-white">{storeName}</span>
                  <span className="block truncate text-xs text-gray-400">Sistema de Delivery</span>
                </span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto lg:hidden text-gray-400 hover:text-white"
                aria-label="Fechar menu"
              >
                <X size={24} />
              </button>
              <button
                onClick={() => setSidebarCollapsed((current) => !current)}
                className={`hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors ${sidebarCollapsed ? '' : 'ml-2'}`}
                aria-label={sidebarCollapsed ? 'Mostrar menu' : 'Recolher menu'}
                title={sidebarCollapsed ? 'Mostrar menu' : 'Recolher menu'}
              >
                {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </div>

            <nav className={`flex-1 overflow-y-auto py-3 ${sidebarCollapsed ? 'px-3' : 'px-3'}`}>
              {visibleSections.map((section, sectionIndex) => (
                <div key={section.title || `section-${sectionIndex}`} className={sectionIndex > 0 ? 'mt-3 border-t border-dark-700 pt-3' : ''}>
                  {section.title && (
                    <p className={`mb-1 px-2 text-[11px] uppercase tracking-wide text-gray-500 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                      {section.title}
                    </p>
                  )}
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const itemPath = adminPath(item.path)
                      const isActive = location.pathname === itemPath || (!item.exact &&
                        itemPath !== adminPath('/admin/dashboard') && location.pathname.startsWith(`${itemPath}/`)
                      )

                      return (
                        <Link
                          key={item.path}
                          to={itemPath}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={`flex items-center rounded-lg transition-colors ${
                            sidebarCollapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3'
                          } py-2.5 ${
                            isActive
                                ? 'bg-dark-800 text-yellow-300 ring-1 ring-yellow-500/35'
                                : item.highlight
                                  ? 'border border-dark-700 text-gray-300 hover:border-yellow-500/70 hover:bg-yellow-500/10 hover:text-yellow-200'
                                  : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                          }`}
                        >
                          <Icon size={19} className={sidebarCollapsed ? 'lg:mr-0 mr-3' : 'mr-3'} />
                          <span className={`flex-1 truncate ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                          {item.badge && (
                            <span className={`rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase text-black ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {profile?.role === 'kitchen' && (
                <Link
                  to="/kitchen"
                  title={sidebarCollapsed ? 'Painel Cozinha' : undefined}
                  className={`flex items-center py-3 rounded-lg transition-colors text-gray-300 hover:bg-dark-800 hover:text-white ${
                    sidebarCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'px-4'
                  }`}
                >
                  <ChefHat size={20} className={sidebarCollapsed ? 'lg:mr-0 mr-3' : 'mr-3'} />
                  <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Painel Cozinha</span>
                </Link>
              )}
            </nav>

            <div className={`${sidebarCollapsed ? 'p-3' : 'p-4'} border-t border-dark-700`}>
              <button
                onClick={handleSignOut}
                title={sidebarCollapsed ? 'Sair' : undefined}
                className={`flex items-center w-full py-3 text-gray-300 hover:bg-dark-800 hover:text-white rounded-lg transition-colors ${
                  sidebarCollapsed ? 'lg:justify-center lg:px-0 px-4' : 'px-4'
                }`}
              >
                <LogOut size={20} className={sidebarCollapsed ? 'lg:mr-0 mr-3' : 'mr-3'} />
                <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Sair</span>
              </button>
            </div>
          </div>
        </aside>

        <div className={`flex-1 transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          <header className="bg-dark-900 border-b border-dark-700 h-16 flex items-center justify-between px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center space-x-3 ml-auto">
              {/* Data atual */}
              <div className="hidden sm:flex items-center gap-1.5 text-gray-400 text-sm bg-dark-800 px-3 py-1.5 rounded-lg border border-dark-700">
                <Calendar size={14} />
                <span>
                  {new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>

              {/* Notificações */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(o => !o)}
                  className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-dark-800 border border-dark-700 text-gray-400 hover:text-white transition-colors"
                  title="Notificações"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-yellow-400 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationsDropdown
                  open={notifOpen}
                  onClose={() => setNotifOpen(false)}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkRead={markRead}
                  onMarkAllRead={markAllRead}
                  onClearAll={clearAll}
                />
              </div>

              {/* Perfil do usuário */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-yellow-500/20 border border-yellow-500/40 shrink-0">
                  <span className="text-yellow-300 text-sm font-bold uppercase">
                    {(profile?.full_name || 'A').charAt(0)}
                  </span>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-white leading-tight">{profile?.full_name}</p>
                  <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
                </div>
              </div>
            </div>
          </header>

          {impersonation && (
            <div className="flex flex-wrap items-center gap-3 border-b border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-100 lg:px-6">
              <ShieldCheck size={17} className="text-amber-300" />
              <strong>Voce esta acessando esta empresa como suporte Replymesh.</strong>
              <span className="text-amber-200/80">
                {impersonation.master_name || 'Usuario master'} em {impersonation.company_name || storeName}. Todas as acoes ficam auditadas.
              </span>
              <button onClick={leaveImpersonation} className="ml-auto rounded-md border border-amber-300/40 px-3 py-1.5 font-semibold text-amber-100 hover:bg-amber-300/10">
                Sair do acesso suporte
              </button>
            </div>
          )}
          <main className="p-3 sm:p-4 lg:p-6">
            <Outlet />
          </main>
          <AiFloatingChat />
        </div>
      </div>
    </div>
  )
}
