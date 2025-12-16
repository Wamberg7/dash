import { ShoppingCart, Bot, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/main'
import { Skeleton } from '@/components/ui/skeleton'

export function Products() {
  const navigate = useNavigate()
  const { products, isLoading } = useAppStore()

  const displayProducts = products.filter((p) => p.active)

  return (
    <section
      id="products"
      className="py-24 bg-black relative overflow-hidden border-t border-zinc-900"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-zinc-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Nossos Produtos
          </h2>
          <p className="text-zinc-400 text-lg">
            Soluções premium para automatizar e escalar sua comunidade no
            Discord
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {isLoading ? (
            <>
              <Skeleton className="h-[500px] w-full bg-zinc-900 rounded-xl" />
              <Skeleton className="h-[500px] w-full bg-zinc-900 rounded-xl" />
            </>
          ) : (
            displayProducts.map((product) => {
              const Icon =
                product.iconType === 'shopping-cart' ? ShoppingCart : Bot
              const gradient =
                product.id === 'sales-bot'
                  ? 'from-blue-500/20 via-cyan-500/20 to-transparent'
                  : 'from-purple-500/20 via-pink-500/20 to-transparent'
              const border =
                product.id === 'sales-bot'
                  ? 'hover:border-blue-500/50'
                  : 'hover:border-purple-500/50'
              const iconColor =
                product.id === 'sales-bot' ? 'text-blue-400' : 'text-purple-400'

              return (
                <Card
                  key={product.id}
                  className={cn(
                    'bg-zinc-950 border-zinc-800 transition-all duration-500 relative overflow-hidden group hover:shadow-2xl hover:shadow-black/50',
                    border,
                  )}
                >
                  {/* Internal Gradient */}
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
                      gradient,
                    )}
                  />

                  <CardHeader className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300',
                          iconColor,
                        )}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      {product.highlight && (
                        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white uppercase tracking-wider">
                          {product.highlight}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-white mb-2">
                      {product.title}
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-base leading-relaxed">
                      {product.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative z-10">
                    <div className="mb-6 flex items-baseline">
                      <span className="text-3xl font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(product.price)}
                      </span>
                      <span className="text-zinc-500 ml-2 text-sm">/mês</span>
                    </div>

                    <div className="space-y-3">
                      {product.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 text-sm"
                        >
                          <div className="w-5 h-5 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-green-500" />
                          </div>
                          <span className="text-zinc-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="relative z-10 pt-6">
                    <Button
                      className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-semibold text-base rounded-xl group-hover:translate-y-[-2px] transition-all duration-300 shadow-lg shadow-white/5"
                      onClick={() =>
                        navigate(`/checkout?product=${product.id}`)
                      }
                    >
                      Comprar agora
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
