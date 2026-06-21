import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/Button'
import BrandLogo from '../../components/shared/BrandLogo'
import { useCompanyBasePath, useCompanySlug } from '../../contexts/CompanySlugContext'
import { motoboyLogin } from '../../services/motoboyApi'
import { usePublicStoreInfo } from '../../hooks/usePublicStoreInfo'

const MotoboyLogin = () => {
  const navigate = useNavigate()
  const companySlug = useCompanySlug()
  const basePath = useCompanyBasePath()
  const { store, loading: loadingStore } = usePublicStoreInfo()
  const resolvedCompanySlug = store?.slug || companySlug
  const motoboyPanelAccess = store?.feature_access?.motoboy_panel
  const motoboyPanelBlocked = loadingStore === false && motoboyPanelAccess?.enabled === false
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [accessMessage, setAccessMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phone.trim() || !password) return

    setLoading(true)
    setAccessMessage('')
    try {
      await motoboyLogin({ phone: phone.trim(), password, companySlug: resolvedCompanySlug })
      navigate(`${basePath}/motoboy/dashboard`, { replace: true })
    } catch (error) {
      console.error('Erro ao fazer login do motoboy:', error)
      const blockedMessage = error?.payload?.message || error?.message
      if (error?.payload?.error === 'feature_not_available' && blockedMessage) {
        setAccessMessage(blockedMessage)
        toast.error(blockedMessage)
      } else {
        toast.error('Telefone ou senha incorretos')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <BrandLogo size="lg" className="justify-center" name={store?.store_name || resolvedCompanySlug} logoUrl={store?.logo_url} />
          <p className="mt-2 text-sm text-gray-400">Portal do Motoboy</p>
          <p className="mt-1 text-xs text-gray-500">{resolvedCompanySlug}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-dark-600 bg-dark-800 p-6">
          <div className="flex items-center gap-2 text-brand-400 mb-2">
            <Bike size={20} />
            <span className="font-semibold text-white">Entrar</span>
          </div>

          {accessMessage && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-100">
              {accessMessage}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-gray-400">Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 21968443941"
              className="w-full rounded-lg border border-dark-500 bg-dark-900 px-3 py-2 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-lg border border-dark-500 bg-dark-900 px-3 py-2 text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>
      </div>

      {motoboyPanelBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-dark-700 bg-dark-900 p-5 text-white shadow-2xl">
            <div className="mb-3 flex items-center gap-2">
              <Lock size={19} className="text-yellow-300" />
              <h2 className="text-lg font-bold">Recurso disponivel no Plano PRO</h2>
            </div>
            <p className="text-sm leading-6 text-gray-300">
              {motoboyPanelAccess?.message || 'Este recurso nao esta incluso no plano atual da sua loja. Fale com o suporte Replymesh para liberar ou testar este recurso.'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-dark-700 px-4 py-2 text-sm text-gray-200 hover:bg-dark-800"
                onClick={() => navigate(`${basePath || ''}/` || '/')}
              >
                Voltar ao painel
              </button>
              <button
                type="button"
                className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
                onClick={() => window.open('https://wa.me/5521999999999?text=Quero%20liberar%20o%20Portal%20do%20Motoboy%20na%20Replymesh', '_blank', 'noopener,noreferrer')}
              >
                Solicitar liberacao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MotoboyLogin
