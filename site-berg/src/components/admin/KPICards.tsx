import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPIProps {
  label: string
  value: string
  description: string
  trend?: string
  trendUp?: boolean
}

function KPICard({ label, value, description, trend, trendUp }: KPIProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                trendUp
                  ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                  : 'text-red-600 bg-red-50 dark:bg-red-900/20',
              )}
            >
              {trendUp ? <TrendingUp className="h-3 w-3" /> : null}
              {trend}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function KPICards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        label="Faturamento"
        value="R$ 0,00"
        description="Valor total movimentado na loja, sem custos"
        trend="+0%"
        trendUp={true}
      />
      <KPICard
        label="Vendas"
        value="0"
        description="Total de pedidos realizados na loja"
        trend="+0%"
        trendUp={true}
      />
      <KPICard
        label="Taxa de conversão"
        value="0%"
        description="Pedidos aprovados em relação a carrinhos"
      />
      <KPICard
        label="Ticket médio"
        value="R$ 0,00"
        description="Valor médio gasto por pedido na loja"
      />
    </div>
  )
}
