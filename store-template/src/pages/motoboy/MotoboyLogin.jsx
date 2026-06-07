import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike } from 'lucide-react'
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
  const { store } = usePublicStoreInfo()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!phone.trim() || !password) return

    setLoading(true)
    try {
      await motoboyLogin({ phone: phone.trim(), password, companySlug })
      navigate(`${basePath}/motoboy/dashboard`, { replace: true })
    } catch (error) {
      console.error('Erro ao fazer login do motoboy:', error)
      toast.error('Telefone ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <BrandLogo size="lg" className="justify-center" name={store?.store_name || companySlug} logoUrl={store?.logo_url} />
          <p className="mt-2 text-sm text-gray-400">Portal do Motoboy</p>
          <p className="mt-1 text-xs text-gray-500">{companySlug}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-dark-600 bg-dark-800 p-6">
          <div className="flex items-center gap-2 text-brand-400 mb-2">
            <Bike size={20} />
            <span className="font-semibold text-white">Entrar</span>
          </div>

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
    </div>
  )
}

export default MotoboyLogin
