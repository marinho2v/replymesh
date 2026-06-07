import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, RefreshCw, Wallet } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { useCompanyBasePath } from '../../contexts/CompanySlugContext'
import { getMotoboyHistory, getMotoboyProfile, getMotoboyToken } from '../../services/motoboyApi'
import { formatCurrency } from '../../utils/currency'
import { formatDateTime } from '../../utils/formatDate'
import MotoboyLayout from './MotoboyLayout'

const MotoboyFinance = () => {
  const navigate = useNavigate()
  const basePath = useCompanyBasePath()
  const [history, setHistory] = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadFinance = useCallback(async () => {
    if (!getMotoboyToken()) {
      navigate(`${basePath}/motoboy/login`, { replace: true })
      return
    }

    try {
      setLoading(true)
      const [profileResponse, historyResponse] = await Promise.all([
        getMotoboyProfile(),
        getMotoboyHistory(),
      ])
      setCompany(profileResponse.company)
      setHistory(historyResponse.history || [])
    } finally {
      setLoading(false)
    }
  }, [basePath, navigate])

  useEffect(() => {
    loadFinance()
  }, [loadFinance])

  const summary = useMemo(() => {
    const completed = history.filter(item => item.status === 'delivered')
    const totalFees = completed.reduce((sum, item) => {
      const cents = item.order?.delivery_fee_cents || 0
      return sum + Number(cents) / 100
    }, 0)

    return {
      completed: completed.length,
      totalFees,
      payable: totalFees,
    }
  }, [history])

  return (
    <MotoboyLayout company={company}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <Wallet size={20} />
          Financeiro
        </h1>
        <Button variant="ghost" size="sm" onClick={loadFinance} loading={loading}>
          <RefreshCw size={16} className="mr-1" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Entregas concluidas</p>
            <p className="mt-1 text-2xl font-black text-white">{summary.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total de taxas</p>
            <p className="mt-1 text-2xl font-black text-yellow-400">{formatCurrency(summary.totalFees)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total a pagar</p>
            <p className="mt-1 text-2xl font-black text-white">{formatCurrency(summary.payable)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-bold text-white">Historico financeiro</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-gray-400">Carregando financeiro...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma entrega concluida ainda.</p>
          ) : history.map((delivery) => (
            <div key={delivery.id} className="flex items-center justify-between gap-3 rounded-xl border border-dark-600 bg-dark-900 p-4">
              <div>
                <p className="flex items-center gap-2 font-semibold text-white">
                  <CheckCircle2 size={16} className="text-green-400" />
                  Pedido #{delivery.order?.order_number}
                </p>
                <p className="text-sm text-gray-400">{formatDateTime(delivery.delivered_at || delivery.assigned_at)}</p>
              </div>
              <p className="font-black text-yellow-400">
                {formatCurrency(Number(delivery.order?.delivery_fee_cents || 0) / 100)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </MotoboyLayout>
  )
}

export default MotoboyFinance
