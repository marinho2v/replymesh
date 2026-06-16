import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bike, History, LogOut, User, Wallet } from 'lucide-react'
import BrandLogo from '../../components/shared/BrandLogo'
import { Button } from '../../components/ui/Button'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { motoboyLogout } from '../../services/motoboyApi'

const linkClass = ({ isActive }) => (
  `flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-yellow-400 text-black'
      : 'text-gray-400 hover:text-white'
  }`
)

const MotoboyLayout = ({ children, company }) => {
  const navigate = useNavigate()
  const basePath = useCompanyBasePath()

  const handleLogout = () => {
    motoboyLogout()
    navigate(`${basePath}/motoboy/login`, { replace: true })
  }

  return (
    <div className="min-h-screen bg-dark-950 px-4 py-5 text-white">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-center justify-between gap-3">
          <Link to={`${basePath}/motoboy/dashboard`} className="flex items-center gap-3">
            <BrandLogo
              size="md"
              name={company?.name || ''}
              logoUrl={company?.logo_url}
              textClassName="text-xl"
            />
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} />
            Sair
          </Button>
        </header>

        <nav className="flex gap-1 rounded-xl border border-dark-600 bg-dark-900 p-1">
          <NavLink to={`${basePath}/motoboy/dashboard`} className={linkClass}>
            <Bike size={16} />
            <span className="hidden sm:inline">Entregas</span>
          </NavLink>
          <NavLink to={`${basePath}/motoboy/history`} className={linkClass}>
              <History size={17} />
            <span className="hidden sm:inline">Historico</span>
          </NavLink>
          <NavLink to={`${basePath}/motoboy/financeiro`} className={linkClass}>
            <Wallet size={17} />
            <span className="hidden sm:inline">Financeiro</span>
          </NavLink>
          <NavLink to={`${basePath}/motoboy/profile`} className={linkClass}>
            <User size={17} />
            <span className="hidden sm:inline">Perfil</span>
          </NavLink>
        </nav>

        <section className="space-y-5">
          {children}
        </section>
      </div>
    </div>
  )
}

export default MotoboyLayout
