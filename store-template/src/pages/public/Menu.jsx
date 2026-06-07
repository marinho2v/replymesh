import { lazy, Suspense } from 'react'
import MenuSection from '../../components/menu/MenuSection'
import { useStoreTemplate } from '../../contexts/StoreTemplateContext'
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'

const PremiumMenuSection = lazy(() => import('../../templates/hamburgueria-premium/components/PremiumMenuSection'))
const PremiumFooter = lazy(() => import('../../templates/hamburgueria-premium/components/PremiumFooter'))

const PremiumMenuPage = () => {
  const { store } = usePublicStoreInfo()
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24 text-gray-400">Carregando...</div>}>
      <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", background: '#0c0c0e', minHeight: '100vh', color: '#f4f3f1' }}>
        <PremiumMenuSection />
        <PremiumFooter store={store} />
      </div>
    </Suspense>
  )
}

const Menu = () => {
  const { templateId } = useStoreTemplate()

  if (templateId === 'hamburgueria-premium') {
    return <PremiumMenuPage />
  }

  return (
    <div className="min-h-screen">
      <MenuSection title="Cardapio" />
    </div>
  )
}

export default Menu
