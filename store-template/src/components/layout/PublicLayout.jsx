import { Outlet, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, X, Store, CircleAlert } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '../../hooks/useCart'
import { Link, useNavigate } from 'react-router-dom'
import BrandLogo from '../shared/BrandLogo'
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { StoreTemplateProvider } from '../../contexts/StoreTemplateContext'
import PremiumHeader from '../../templates/hamburgueria-premium/components/PremiumHeader'

export const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { cart } = useCart()
  const { store, loading, error, refetch } = usePublicStoreInfo()
  const navigate = useNavigate()
  const location = useLocation()
  const base = useCompanyBasePath()

  const isTableQrRoute = location.pathname.includes('/mesa/')
  const storeName = store?.name || store?.store_name || ''
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const isPremiumTemplate = store?.visual_template_id === 'hamburgueria-premium'

  if (loading && !store) {
    return (
      <div className="min-h-screen bg-dark-950" aria-label="Carregando loja">
        <div className="flex min-h-screen items-center justify-center px-4 text-center">
          <div>
            <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full border border-dark-600 bg-dark-800" />
            <p className="text-sm text-gray-400">Carregando loja...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !store) {
    const unavailable = error?.status === 423 || error?.payload?.code === 'store_unavailable'
    const title = unavailable ? 'Loja indisponível' : 'Loja não encontrada'
    const description = unavailable
      ? 'Esta loja está temporariamente indisponível. Tente novamente mais tarde.'
      : 'Não encontramos uma loja ativa neste endereço.'

    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4 py-12 text-white">
        <main className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-dark-700 bg-dark-900">
            {unavailable ? <CircleAlert size={30} className="text-amber-400" /> : <Store size={30} className="text-gray-300" />}
          </div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Replymesh</p>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-400">{description}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-7 inline-flex h-10 items-center justify-center rounded-lg border border-dark-600 bg-dark-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-dark-800"
          >
            Tentar novamente
          </button>
        </main>
      </div>
    )
  }

  if (isTableQrRoute) {
    return (
      <StoreTemplateProvider templateId={store?.visual_template_id}>
        <div className="min-h-screen bg-dark-950">
          <Outlet />
        </div>
      </StoreTemplateProvider>
    )
  }

  if (isPremiumTemplate) {
    return (
      <StoreTemplateProvider templateId={store?.visual_template_id}>
        <div className="min-h-screen" style={{ background: '#0c0c0e', color: '#f4f3f1', fontFamily: "'Poppins', system-ui, sans-serif" }}>
          <PremiumHeader store={store} cartCount={cartItemsCount} basePath={base} />
          <Outlet />
        </div>
      </StoreTemplateProvider>
    )
  }

  return (
    <StoreTemplateProvider templateId={store?.visual_template_id}>
    <div className="min-h-screen bg-dark-950">
      <header className="fixed top-0 left-0 right-0 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={base || '/'} className="min-w-0">
              <BrandLogo
                size="md"
                name={storeName}
                logoUrl={store?.logo_url}
                textClassName="text-lg sm:text-xl"
              />
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link to={base || '/'} className="text-gray-300 hover:text-white transition-colors">
                Inicio
              </Link>
              <Link to={`${base}/menu`} className="text-gray-300 hover:text-white transition-colors">
                Cardapio
              </Link>
              <Link to={`${base}/minha-conta`} className="text-gray-300 hover:text-white transition-colors">
                Minha conta
              </Link>
              <Link to={`${base}/roleta`} className="text-gray-300 hover:text-white transition-colors">
                Roleta
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`${base}/cart`)}
                className="relative p-2 text-gray-300 hover:text-white transition-colors"
              >
                <ShoppingCart size={24} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-dark-700 bg-dark-900">
            <nav className="px-4 py-4 space-y-2">
              <Link
                to={base || '/'}
                className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                to={`${base}/menu`}
                className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cardapio
              </Link>
              <Link
                to={`${base}/minha-conta`}
                className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Minha conta
              </Link>
              <Link
                to={`${base}/roleta`}
                className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Roleta
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="pt-16">
        <Outlet />
      </main>

      <footer className="bg-dark-900 border-t border-dark-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <BrandLogo
              size="sm"
              name={storeName}
              logoUrl={store?.logo_url}
              className="justify-center mb-3"
              textClassName="text-lg"
            />
            <p className="text-sm">© {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</p>
            <p className="text-xs mt-2">
              Desenvolvido por Replymesh
            </p>
          </div>
        </div>
      </footer>
    </div>
    </StoreTemplateProvider>
  )
}
