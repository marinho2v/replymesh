import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, Building2, Phone, User } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { getMotoboyProfile, getMotoboyToken } from '../../services/motoboyApi'
import MotoboyLayout from './MotoboyLayout'

const MotoboyProfile = () => {
  const navigate = useNavigate()
  const basePath = useCompanyBasePath()
  const [profile, setProfile] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    if (!getMotoboyToken()) {
      navigate(`${basePath}/motoboy/login`, { replace: true })
      return
    }

    try {
      setLoading(true)
      const response = await getMotoboyProfile()
      setProfile(response.motoboy)
      setCompany(response.company)
    } catch (error) {
      if (error.status === 401) {
        navigate(`${basePath}/motoboy/login`, { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }, [basePath, navigate])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return (
    <MotoboyLayout company={company}>
      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold text-white">Meu perfil</h1>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-400">Carregando perfil...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-dark-600 bg-dark-900 p-4">
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <User size={16} />
                  Nome
                </p>
                <p className="mt-1 text-lg font-black">{profile?.name}</p>
              </div>
              <div className="rounded-xl border border-dark-600 bg-dark-900 p-4">
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <Phone size={16} />
                  Telefone
                </p>
                <p className="mt-1 text-lg font-black">{profile?.phone || '-'}</p>
              </div>
              <div className="rounded-xl border border-dark-600 bg-dark-900 p-4">
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <Building2 size={16} />
                  Empresa
                </p>
                <p className="mt-1 text-lg font-black">{company?.name}</p>
              </div>
              <div className="rounded-xl border border-dark-600 bg-dark-900 p-4">
                <p className="flex items-center gap-2 text-sm text-gray-400">
                  <Bike size={16} />
                  Entregas concluidas
                </p>
                <p className="mt-1 text-lg font-black">{profile?.total_deliveries || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </MotoboyLayout>
  )
}

export default MotoboyProfile
