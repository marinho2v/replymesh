import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import MenuSection from '../../components/menu/MenuSection'
import BrandLogo from '../../components/shared/BrandLogo'
import StoreStatusBadge from '../../components/shared/StoreStatusBadge'
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { useStoreTemplate } from '../../contexts/StoreTemplateContext'

const PremiumHome = lazy(() => import('../../templates/hamburgueria-premium/components/PremiumHome'))

const ClassicHome = () => {
  const { store, banners } = usePublicStoreInfo()
  const basePath = useCompanyBasePath()
  const storeName = store?.name || store?.store_name || ''
  const heroBanner = banners?.[0]
  const heroImage = heroBanner?.image_url || store?.cover_url || store?.banner_url || ''

  return (
    <div>
      <section className="relative isolate min-h-[520px] overflow-hidden bg-dark-950 px-4 py-16 sm:min-h-[560px] sm:py-20">
        {heroImage && <img
          src={heroImage}
          alt={heroBanner?.title || `Cardapio ${storeName}`}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_58%]"
        />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/65 via-black/45 to-dark-950" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-dark-950 to-transparent" />

        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-end text-center sm:min-h-[440px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 flex justify-center"
          >
            <BrandLogo size="lg" showText={false} name={storeName} logoUrl={store?.logo_url} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 text-5xl font-bold text-white drop-shadow-lg md:text-6xl"
          >
            {storeName}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 max-w-xl text-lg text-gray-100 drop-shadow md:text-xl"
          >
            Os melhores lanches da regiao
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <StoreStatusBadge />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-4 sm:flex-row sm:justify-center"
          >
            <a href="#cardapio">
              <Button size="lg" className="w-full sm:w-auto">
                Comprar Agora <ArrowRight className="ml-2" size={20} />
              </Button>
            </a>
            <Link to={`${basePath}/menu`}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Ver Cardapio Completo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <div id="cardapio">
        <MenuSection
          title="Cardapio"
          showSearch={false}
          showFeaturedFilter={false}
          showHomeFilter
          showCategoryFilters
          showAllCategoryFilter={false}
          showFeaturedBlock
          showProductGrid
          className="bg-dark-950"
        />
      </div>
    </div>
  )
}

const Home = () => {
  const { templateId } = useStoreTemplate()

  if (templateId === 'hamburgueria-premium') {
    return (
      <Suspense fallback={<div className="flex items-center justify-center py-24 text-gray-400">Carregando...</div>}>
        <PremiumHome />
      </Suspense>
    )
  }

  return <ClassicHome />
}

export default Home
