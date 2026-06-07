import { Card, CardContent } from '../ui/Card'
import { DollarSign, ShoppingCart, TrendingUp, Users, Tag, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from '../../utils/currency'

const ReportCards = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-12 bg-dark-700 rounded animate-pulse mb-4"></div>
              <div className="h-6 bg-dark-700 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Faturamento Bruto',
      value: formatCurrency(summary?.grossRevenue || 0),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Faturamento Líquido',
      value: formatCurrency(summary?.netRevenue || 0),
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total de Pedidos',
      value: summary?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(summary?.averageTicket || 0),
      icon: Tag,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Descontos Aplicados',
      value: formatCurrency(summary?.totalDiscount || 0),
      icon: Tag,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Pedidos Cancelados',
      value: summary?.cancelledOrders || 0,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Novos Clientes',
      value: summary?.newCustomers || 0,
      icon: Users,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Clientes Recorrentes',
      value: summary?.recurringCustomers || 0,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between mb-4 p-3 rounded-lg ${card.bgColor}`}>
                <Icon size={24} className={card.color} />
              </div>
              <p className="text-gray-400 text-sm mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default ReportCards
