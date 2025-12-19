import {
  Users,
  ShoppingCart,
  Bot,
  DollarSign,
  TrendingUp,
  Ticket,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/stores/main'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardStats() {
  const { stats, isLoading } = useAppStore()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-zinc-900" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Visitas Totais',
      value: stats.totalVisits.toLocaleString(),
      icon: Users,
      desc: 'Acessos à landing page',
    },
    {
      title: 'Vendas Totais',
      value: stats.totalSales.toString(),
      icon: ShoppingCart,
      desc: 'Pedidos concluídos',
    },
    {
      title: 'Receita Total',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(stats.totalRevenue),
      icon: DollarSign,
      desc: 'Faturamento bruto',
    },
    {
      title: 'Bot de Vendas',
      value: stats.salesBotCount.toString(),
      icon: Bot,
      desc: 'Unidades vendidas',
    },
    {
      title: 'Bot de Tickets',
      value: stats.ticketBotCount.toString(),
      icon: Ticket,
      desc: 'Unidades vendidas',
    },
  ]

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="bg-zinc-950 border-zinc-800 hover:bg-zinc-900/50 transition-colors"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs md:text-sm font-medium text-zinc-400">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-zinc-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl md:text-2xl font-bold text-white break-words">{card.value}</div>
            <div className="flex items-center text-xs text-zinc-500 mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500 flex-shrink-0" />
              <span className="truncate">{card.desc}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
