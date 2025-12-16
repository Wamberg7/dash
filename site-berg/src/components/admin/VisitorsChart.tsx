import { TrendingDown } from 'lucide-react'
import { Label, Pie, PieChart } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartData = [
  { browser: 'visitors', visitors: 1, fill: 'var(--color-visitors)' },
  { browser: 'other', visitors: 0, fill: 'transparent' },
]

const chartConfig = {
  visitors: {
    label: 'Visitantes',
    color: 'hsl(262.1 83.3% 57.8%)',
  },
} satisfies ChartConfig

export function VisitorsChart() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-bold">Visitantes</CardTitle>
        <CardDescription>
          Estes dados são calculados uma vez por dia por usuário
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          1
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs"
                        >
                          visitantes
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex items-center gap-2 font-medium leading-none">
          Perda de 200% em comparação. <TrendingDown className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando vistantes totais do mês atual
        </div>
      </CardFooter>
    </Card>
  )
}
