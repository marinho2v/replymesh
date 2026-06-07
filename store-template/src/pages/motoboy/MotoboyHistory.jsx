import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { getMotoboyHistory, getMotoboyProfile, getMotoboyToken } from '../../services/motoboyApi'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'
import MotoboyLayout from './MotoboyLayout'

const MotoboyHistory = () => {
  const navigate = useNavigate()
  const basePath = useCompanyBasePath()
  const [history, setHistory] = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    if (!getMotoboyToken()) {
      navigate(`${basePath}/motoboy/login`, { replace: true })
      return
    }

    try {
      setLoading(true)
      const [profileResponse, response] = await Promise.all([
        getMotoboyProfile(),
        getMotoboyHistory(),
      ])
      setCompany(profileResponse.company)
      setHistory(response.history || [])
    } catch (error) {
      if (error.status === 401) {
        navigate(`${basePath}/motoboy/login`, { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }, [basePath, navigate])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return (
    <MotoboyLayout company={company}>
      <Card>
        <CardHeader>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">Historico de entregas</h1>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-gray-400">Carregando historico...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma entrega finalizada ainda.</p>
          ) : history.map((delivery) => (
            <article key={delivery.id} className="flex flex-col gap-2 rounded-xl border border-dark-600 bg-dark-900 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black">Pedido #{delivery.order?.order_number}</h3>
                  <Badge variant="success">Entregue</Badge>
                </div>
                <p className="text-sm text-gray-400">{formatDateTime(delivery.delivered_at || delivery.assigned_at)}</p>
                <p className="text-sm text-gray-300">{delivery.order?.customer_name}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-gray-400">Total</p>
                <p className="font-black">{formatCurrency((delivery.order?.total_cents || 0) / 100)}</p>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </MotoboyLayout>
  )
}

export default MotoboyHistory
