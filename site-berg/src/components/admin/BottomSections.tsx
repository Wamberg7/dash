import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function SectionCard({ title }: { title: string }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[100px] items-center justify-center text-sm text-muted-foreground">
          Nenhum dado disponível
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" className="h-8 gap-1 text-xs" size="sm">
            Ver mais <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function BottomSections() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SectionCard title="Últimas Vendas" />
      <SectionCard title="Produtos Populares" />
      <SectionCard title="Cupons Populares" />
    </div>
  )
}
