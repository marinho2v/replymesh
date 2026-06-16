import { useEffect, useState } from 'react'
import { ArrowLeft, Gift } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCompanyBasePath, useCompanySlug } from '../../contexts/CompanySlugContext'
import { getPublicPromotions } from '../../services/wheel'
import Wheel from './Wheel'

const EmptyPromotions = () => {
  const basePath = useCompanyBasePath()

  return (
    <div className="min-h-[70vh] px-4 py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dark-700 bg-dark-900">
          <Gift size={30} className="text-yellow-400" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-white">Promoções</h1>
        <p className="mt-4 text-lg font-semibold text-gray-200">
          Nenhuma promoção ativa no momento.
        </p>
        <p className="mt-2 max-w-lg text-sm leading-6 text-gray-400">
          Acompanhe nossas novidades para participar das próximas campanhas.
        </p>
        <Link
          to={`${basePath}/menu`}
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-yellow-400 px-5 text-sm font-bold text-black transition-colors hover:bg-yellow-300"
        >
          <ArrowLeft size={18} />
          Voltar ao cardápio
        </Link>
      </div>
    </div>
  )
}

const Promotions = () => {
  const companySlug = useCompanySlug()
  const [loading, setLoading] = useState(true)
  const [rouletteActive, setRouletteActive] = useState(false)

  useEffect(() => {
    let active = true

    getPublicPromotions(companySlug)
      .then((payload) => {
        if (active) setRouletteActive(Boolean(payload?.roulette_active))
      })
      .catch(() => {
        if (active) setRouletteActive(false)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [companySlug])

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
        <div>
          <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full border border-dark-600 bg-dark-800" />
          <p className="text-sm text-gray-400">Carregando promoções...</p>
        </div>
      </div>
    )
  }

  return rouletteActive ? <Wheel /> : <EmptyPromotions />
}

export default Promotions
