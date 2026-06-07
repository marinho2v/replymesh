import { useMemo, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { Badge } from '../../components/ui/Badge'
import { useCashRegister } from '../../hooks/useCashRegister'
import { formatCurrency } from '../../utils/currency'
import { exportToCsv, exportToXlsx } from '../../utils/exportCsv'
import { Banknote, CreditCard, Download, Landmark, MinusCircle, PlusCircle, Receipt, Store, Wallet, RefreshCw, TrendingDown } from 'lucide-react'

const movementTypes = {
  sangria: { label: 'Sangria', affectsPhysicalCash: true },
  reinforcement: { label: 'Reforco de caixa', affectsPhysicalCash: true },
  withdrawal: { label: 'Retirada manual', affectsPhysicalCash: true },
  adjustment: { label: 'Ajuste manual', affectsPhysicalCash: true },
}

const movementTypeOptions = Object.entries(movementTypes).map(([value, item]) => ({
  value,
  label: item.label,
}))

const allMovementLabels = {
  sale_cash: 'Venda em dinheiro',
  sale_pix: 'Venda em Pix',
  sale_card: 'Venda em cartao',
  change_given: 'Troco concedido',
  sangria: 'Sangria',
  reinforcement: 'Reforco',
  withdrawal: 'Retirada',
  adjustment: 'Ajuste',
  refund: 'Estorno',
}

const typeVariant = {
  sale_cash: 'success',
  sale_pix: 'success',
  sale_card: 'success',
  sangria: 'warning',
  withdrawal: 'warning',
  reinforcement: 'info',
  adjustment: 'default',
  change_given: 'default',
  refund: 'danger',
}

const KpiCard = ({ title, value, icon: Icon, variant }) => (
  <Card>
    <CardContent className="flex items-center justify-between p-4">
      <div>
        <p className="text-xs text-gray-400">{title}</p>
        <p className="mt-0.5 text-xl font-bold text-white">{value}</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-900 text-gray-400">
        <Icon size={20} />
      </span>
    </CardContent>
  </Card>
)

const CashRegister = () => {
  const {
    openSession,
    sessions,
    movements,
    summary,
    loading,
    actionLoading,
    error,
    openSessionAction,
    addMovementAction,
    closeSessionAction,
  } = useCashRegister()

  const [openingAmount, setOpeningAmount] = useState('')
  const [openingNotes, setOpeningNotes] = useState('')
  const [movementType, setMovementType] = useState('sangria')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementNotes, setMovementNotes] = useState('')
  const [countedAmount, setCountedAmount] = useState('')
  const [closingNotes, setClosingNotes] = useState('')

  const expectedCash = Number(summary?.expected_cash_balance || openSession?.opening_amount || 0)
  const counted = Number(countedAmount || 0)
  const difference = countedAmount === '' ? 0 : counted - expectedCash

  const orderOriginLabel = (orderType) => ({
    dine_in: 'Mesa',
    delivery: 'Delivery',
    pickup: 'Retirada',
  }[orderType] || '-')

  const exportRows = useMemo(() => movements.map((movement) => ({
    data: new Date(movement.created_at).toLocaleString('pt-BR'),
    tipo: allMovementLabels[movement.type] || movement.type,
    valor: Number(movement.amount || 0).toFixed(2),
    origem: orderOriginLabel(movement.orders?.order_type),
    atendente: movement.orders?.profiles?.full_name || movement.profiles?.full_name || '',
    caixa_fisico: movement.affects_physical_cash ? 'Sim' : 'Nao',
    pedido: movement.orders?.order_number ? `#${movement.orders.order_number}` : '',
    cliente: movement.orders?.customer_name || '',
    observacao: movement.notes || '',
  })), [movements])

  const exportColumns = [
    { key: 'data', label: 'Data' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'valor', label: 'Valor' },
    { key: 'origem', label: 'Origem' },
    { key: 'atendente', label: 'Atendente' },
    { key: 'caixa_fisico', label: 'Impacta caixa fisico' },
    { key: 'pedido', label: 'Pedido' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'observacao', label: 'Observacao' },
  ]

  const handleOpen = async () => {
    const result = await openSessionAction({ openingAmount, notes: openingNotes })
    if (result.success) {
      setOpeningAmount('')
      setOpeningNotes('')
    }
  }

  const handleMovement = async () => {
    const config = movementTypes[movementType]
    const result = await addMovementAction({
      type: movementType,
      amount: movementAmount,
      affectsPhysicalCash: config?.affectsPhysicalCash !== false,
      notes: movementNotes,
    })
    if (result.success) {
      setMovementAmount('')
      setMovementNotes('')
    }
  }

  const handleClose = async () => {
    const result = await closeSessionAction({ countedAmount, notes: closingNotes })
    if (result.success) {
      setCountedAmount('')
      setClosingNotes('')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <RefreshCw size={18} className="mr-2 animate-spin" />
        Carregando caixa...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Caixa operacional</h1>
            <p className="mt-0.5 text-sm text-gray-400">
              Abertura, movimentações e fechamento do caixa físico.
            </p>
          </div>
          <Badge variant={openSession ? 'success' : 'default'} className="self-start">
            {openSession ? 'Aberto' : 'Fechado'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCsv(exportRows, 'movimentacoes_caixa', exportColumns)} disabled={movements.length === 0}>
            <Download size={15} className="mr-1.5" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToXlsx(exportRows, 'movimentacoes_caixa', exportColumns, 'Caixa')} disabled={movements.length === 0}>
            <Download size={15} className="mr-1.5" />
            XLSX
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-yellow-700 bg-yellow-900/20 p-3 text-sm text-yellow-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard title="Dinheiro inicial" value={formatCurrency(openSession?.opening_amount || 0)} icon={Wallet} />
        <KpiCard title="Saldo físico esperado" value={formatCurrency(expectedCash)} icon={Landmark} />
        <KpiCard title="Pix + cartão" value={formatCurrency(Number(summary?.total_pix_sales || 0) + Number(summary?.total_card_sales || 0))} icon={CreditCard} />
        <KpiCard title="Troco concedido" value={formatCurrency(summary?.total_change_given || 0)} icon={TrendingDown} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className={openSession ? 'border-green-700/60' : ''}>
          <CardHeader className="p-4">
            <h2 className="font-bold text-white">Abertura do caixa</h2>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {openSession ? (
              <div className="rounded-xl border border-green-700/50 bg-green-900/15 p-4 text-center">
                <p className="text-sm font-semibold text-green-300">Caixa aberto</p>
                <p className="mt-1 text-xs text-green-400/80">
                  desde {new Date(openSession.opened_at).toLocaleString('pt-BR')}
                </p>
                <p className="mt-2 text-lg font-bold text-white">{formatCurrency(openSession.opening_amount)}</p>
                <p className="text-xs text-gray-500">valor inicial</p>
              </div>
            ) : (
              <>
                <Input label="Valor inicial para troco" type="number" min="0" step="0.01" value={openingAmount} onChange={(e) => setOpeningAmount(e.target.value)} />
                <Textarea label="Observacao" rows={2} value={openingNotes} onChange={(e) => setOpeningNotes(e.target.value)} />
                <Button className="w-full" onClick={handleOpen} loading={actionLoading}>
                  <PlusCircle size={16} className="mr-2" />
                  Abrir caixa
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className={!openSession ? 'opacity-60' : ''}>
          <CardHeader className="p-4">
            <h2 className="font-bold text-white">Movimentacao manual</h2>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <Select label="Tipo" options={movementTypeOptions} value={movementType} onChange={(e) => setMovementType(e.target.value)} disabled={!openSession} />
            <Input label="Valor" type="number" min="0" step="0.01" value={movementAmount} onChange={(e) => setMovementAmount(e.target.value)} disabled={!openSession} />
            <Textarea label="Observacao" rows={2} value={movementNotes} onChange={(e) => setMovementNotes(e.target.value)} disabled={!openSession} />
            <Button className="w-full" onClick={handleMovement} loading={actionLoading} disabled={!openSession}>
              <Receipt size={16} className="mr-2" />
              Registrar movimentacao
            </Button>
          </CardContent>
        </Card>

        <Card className={!openSession ? 'opacity-60' : ''}>
          <CardHeader className="p-4">
            <h2 className="font-bold text-white">Fechamento do caixa</h2>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="rounded-xl bg-dark-900 p-3 text-center">
              <p className="text-xs text-gray-400">Esperado no caixa físico</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(expectedCash)}</p>
            </div>
            <Input label="Valor contado" type="number" min="0" step="0.01" value={countedAmount} onChange={(e) => setCountedAmount(e.target.value)} disabled={!openSession} />
            {countedAmount !== '' && (
              <div className={`rounded-lg p-2 text-center text-sm font-semibold ${
                difference === 0 ? 'bg-green-900/20 text-green-300' :
                difference > 0 ? 'bg-blue-900/20 text-blue-300' :
                'bg-yellow-900/20 text-yellow-300'
              }`}>
                Diferença: {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
              </div>
            )}
            <Textarea label="Observacao" rows={2} value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} disabled={!openSession} />
            <Button className="w-full" variant="warning" onClick={handleClose} loading={actionLoading} disabled={!openSession}>
              <MinusCircle size={16} className="mr-2" />
              Fechar caixa
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard title="Dinheiro recebido" value={formatCurrency(summary?.total_cash_sales || 0)} icon={Banknote} />
        <KpiCard title="Pix recebido" value={formatCurrency(summary?.total_pix_sales || 0)} icon={CreditCard} />
        <KpiCard title="Cartao recebido" value={formatCurrency(summary?.total_card_sales || 0)} icon={CreditCard} />
        <KpiCard title="Sangrias / retiradas" value={formatCurrency(Number(summary?.total_sangria || 0) + Number(summary?.total_withdrawal || 0))} icon={MinusCircle} />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between p-4">
          <h2 className="font-bold text-white">Movimentações do caixa atual</h2>
          <span className="text-xs text-gray-500">{movements.length} registro{movements.length !== 1 ? 's' : ''}</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-dark-700 text-xs text-gray-500">
                  <th className="px-4 py-2.5">Data</th>
                  <th className="px-4 py-2.5">Tipo</th>
                  <th className="px-4 py-2.5">Valor</th>
                  <th className="px-4 py-2.5">Origem</th>
                  <th className="px-4 py-2.5">Pedido</th>
                  <th className="px-4 py-2.5">Atendente</th>
                  <th className="px-4 py-2.5">Observacao</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => {
                  const origin = orderOriginLabel(movement.orders?.order_type)
                  const attendantName = movement.orders?.profiles?.full_name || movement.profiles?.full_name || '-'
                  return (
                    <tr key={movement.id} className="border-b border-dark-800 text-gray-200 hover:bg-dark-800/50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{new Date(movement.created_at).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={typeVariant[movement.type] || 'default'} className="text-[10px] px-1.5">
                          {allMovementLabels[movement.type] || movement.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-white whitespace-nowrap">{formatCurrency(movement.amount)}</td>
                      <td className="px-4 py-2.5">
                        {movement.orders?.order_type === 'dine_in' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-pink-400">
                            <Store size={11} />Mesa
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">{origin}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">
                        {movement.orders?.order_number ? `#${movement.orders.order_number}` : '-'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 max-w-[120px] truncate">{attendantName}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[180px] truncate">{movement.notes || '-'}</td>
                    </tr>
                  )
                })}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-sm text-gray-500">
                      Nenhuma movimentação registrada no caixa atual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between p-4">
          <h2 className="font-bold text-white">Histórico de caixas</h2>
          <span className="text-xs text-gray-500">{sessions.length} sessã{sessions.length !== 1 ? 'ões' : 'o'}</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-dark-700 text-xs text-gray-500">
                  <th className="px-4 py-2.5">Abertura</th>
                  <th className="px-4 py-2.5">Fechamento</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Inicial</th>
                  <th className="px-4 py-2.5">Esperado</th>
                  <th className="px-4 py-2.5">Contado</th>
                  <th className="px-4 py-2.5">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const diff = Number(session.difference_amount || 0)
                  return (
                    <tr key={session.id} className="border-b border-dark-800 text-gray-200 hover:bg-dark-800/50 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">{new Date(session.opened_at).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                        {session.closed_at ? new Date(session.closed_at).toLocaleString('pt-BR') : '-'}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={session.status === 'open' ? 'success' : 'default'} className="text-[10px] px-1.5">
                          {session.status === 'open' ? 'Aberto' : 'Fechado'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-300">{formatCurrency(session.opening_amount)}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-300">{formatCurrency(session.closing_expected_amount || 0)}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-300">{formatCurrency(session.closing_counted_amount || 0)}</td>
                      <td className={`px-4 py-2.5 text-xs font-semibold ${diff === 0 ? 'text-green-400' : diff > 0 ? 'text-blue-400' : 'text-yellow-400'}`}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                      </td>
                    </tr>
                  )
                })}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-sm text-gray-500">
                      Nenhum histórico de caixas encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CashRegister
