import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../services/auth'
import { toast } from 'sonner'
import BrandLogo from '../shared/BrandLogo'

const KitchenHeader = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch {
      toast.error('Erro ao sair')
    }
  }

  return (
    <header className="bg-dark-900 border-b border-dark-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" showText={false} />
          <div>
            <h1 className="text-2xl font-bold text-white">Painel da Cozinha</h1>
            <p className="text-gray-400 text-sm">Gerenciamento de pedidos em tempo real</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm">Sair</span>
        </button>
      </div>
    </header>
  )
}

export default KitchenHeader
