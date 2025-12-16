import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'

const chartData = [
  { date: '30/11/2025', sales: 0, revenue: 0 },
  { date: '01/12/2025', sales: 0, revenue: 0 },
  { date: '02/12/2025', sales: 0, revenue: 0 },
  { date: '03/12/2025', sales: 0, revenue: 0 },
  { date: '04/12/2025', sales: 0, revenue: 0 },
  { date: '06/12/2025', sales: 0, revenue: 0 },
]

const chartConfig = {
  sales: {
    label: 'Vendas',
    color: 'hsl(var(--chart-1))',
  },
  revenue: {
    label: 'Faturamento',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export function SalesChart() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold">
            Gráfico de vendas
          </CardTitle>
          <CardDescription>Total para os últimos 3 meses</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Últimos 3 mêses
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            Últimos 30 dias
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-zinc-100 dark:bg-zinc-800"
          >
            Últimos 7 dias
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-muted"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => value.slice(0, 5)}
              className="text-xs text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              className="text-xs text-muted-foreground"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="url(#fillRevenue)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="var(--color-sales)"
              fill="url(#fillSales)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
