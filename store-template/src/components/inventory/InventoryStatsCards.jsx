import { Card, CardContent } from '../ui/Card'
import { Package, AlertTriangle, Activity, TrendingUp } from 'lucide-react'

const InventoryStatsCards = ({ stats, loading }) => {
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
      title: 'Total de Itens',
      value: stats?.totalItems || 0,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Itens Ativos',
      value: stats?.activeItems || 0,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Estoque Baixo',
      value: stats?.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Movimentações',
      value: stats?.totalMovements || 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
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

export default InventoryStatsCards
