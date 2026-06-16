import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { signIn, signOut } from '../../services/auth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import BrandLogo from '../../components/shared/BrandLogo'
import { useCompanyBasePath, useCompanySlug } from '../../contexts/CompanySlugContext'
import { getPublicStoreInfo } from '../../services/publicApi'
import { setCurrentStoreCompany } from '../../services/storeApi'

const REMEMBER_LOGIN_KEY = 'replymesh:remember-login'
const SAVED_LOGIN_KEY = 'replymesh:saved-login'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const companySlug = useCompanySlug()
  const basePath = useCompanyBasePath()
  const { profile } = useAuth()
  const [storeInfo, setStoreInfo] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberLogin, setRememberLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const redirectAfterLogin = (role) => {
    const from = location.state?.from
    const fallback = role === 'kitchen'
      ? '/kitchen'
      : role === 'waiter'
        ? `${basePath}/admin/tables`
        : role === 'attendant'
          ? `${basePath}/admin/orders`
          : `${basePath}/admin/dashboard`

    if (from && from !== `${basePath}/login` && from.startsWith(`${basePath}/admin`)) {
      return from
    }

    return fallback
  }

  useEffect(() => {
    const authMessage = sessionStorage.getItem('replymesh:store:auth-message')
    if (authMessage) {
      sessionStorage.removeItem('replymesh:store:auth-message')
      toast.error(authMessage)
    }
  }, [])

  useEffect(() => {
    if (profile) {
      if (profile.role === 'kitchen') {
        navigate('/kitchen')
      } else if (profile.role === 'waiter') {
        navigate(redirectAfterLogin('waiter'), { replace: true })
      } else if (profile.role === 'attendant') {
        navigate(redirectAfterLogin('attendant'), { replace: true })
      } else if (profile.role === 'motoboy') {
        signOut().finally(() => {
          toast.error('Use o portal do motoboy para acessar entregas.')
        })
      } else {
        navigate(redirectAfterLogin('admin'), { replace: true })
      }
    }
  }, [basePath, location.state, profile, navigate])

  useEffect(() => {
    if (!companySlug) return

    getPublicStoreInfo(companySlug)
      .then(store => {
        const storeSlug = store.slug || companySlug
        setStoreInfo(store)
        setCurrentStoreCompany({ companyId: store.company_id || store.id, slug: storeSlug })
      })
      .catch(() => {
        localStorage.setItem('replymesh_store_company_slug', companySlug)
      })
  }, [companySlug])

  useEffect(() => {
    const shouldRemember = localStorage.getItem(REMEMBER_LOGIN_KEY)
    const savedLogin = localStorage.getItem(SAVED_LOGIN_KEY)

    if (shouldRemember === 'false') {
      setRememberLogin(false)
      return
    }

    setRememberLogin(true)
    if (savedLogin) setEmail(savedLogin)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const input = email.trim()
    if (input && !input.includes('@') && /^\d[\d\s\-().]+$/.test(input)) {
      toast.error('Para motoboy, acesse /motoboy/login. Para o admin, use o e-mail.')
      return
    }

    setLoading(true)

    try {
      const store = await getPublicStoreInfo(companySlug)
      const storeSlug = store.slug || companySlug
      setCurrentStoreCompany({ companyId: store.company_id || store.id, slug: storeSlug })
      await signIn(email, password, { companyId: store.company_id || store.id, companySlug: storeSlug })
      localStorage.setItem(REMEMBER_LOGIN_KEY, rememberLogin ? 'true' : 'false')

      if (rememberLogin) {
        localStorage.setItem(SAVED_LOGIN_KEY, email.trim())
      } else {
        localStorage.removeItem(SAVED_LOGIN_KEY)
      }

      toast.success('Login realizado com sucesso!')
    } catch (error) {
      toast.error(error.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-dark-600 bg-dark-800 p-6 shadow-2xl sm:p-8">
          <div className="mb-8 text-center">
            <BrandLogo
              size="lg"
              name={storeInfo?.name || storeInfo?.store_name || ''}
              logoUrl={storeInfo?.logo_url}
              className="mb-4 justify-center"
              textClassName="text-2xl"
            />
            <p className="text-gray-400">Painel Administrativo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-white">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full rounded-lg border border-dark-600 bg-dark-900 px-4 py-3 pr-12 text-white placeholder-gray-500 outline-none transition-colors focus:border-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition-colors hover:text-white"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-dark-600 bg-dark-900 px-4 py-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={rememberLogin}
                onChange={(e) => setRememberLogin(e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-dark-700 text-primary-600 focus:ring-primary-500"
              />
              <span>Lembrar este acesso neste aparelho</span>
            </label>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
