import { ShoppingCart, Bot, ArrowRight, Check, Star, Zap, Shield } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'

export default function Pricing() {
  const navigate = useNavigate()
  const { products, isLoading } = useAppStore()

  const displayProducts = products.filter((p) => p.active)

  const features = [
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Criptografia de ponta a ponta e proteção de dados',
    },
    {
      icon: Zap,
      title: 'Alta Performance',
      description: 'Servidores otimizados para máxima velocidade',
    },
    {
      icon: Star,
      title: 'Suporte Premium',
      description: 'Atendimento 24/7 via Discord e email',
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/20">
            Planos e Preços
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Escolha o Plano Ideal
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Soluções premium para automatizar e escalar sua comunidade no Discord e Telegram.
            Todos os planos incluem suporte completo e atualizações constantes.
          </p>
        </div>

        {/* Features Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <Card
                key={idx}
                className="bg-zinc-950 border-zinc-800 text-center"
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Products/Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto mb-16">
          {isLoading ? (
            <>
              <Skeleton className="h-[600px] w-full bg-zinc-900 rounded-xl" />
              <Skeleton className="h-[600px] w-full bg-zinc-900 rounded-xl" />
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
                          'w-16 h-16 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300',
                          iconColor,
                        )}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      {product.highlight && (
                        <Badge className="bg-zinc-900 border-zinc-800 text-white uppercase tracking-wider">
                          {product.highlight}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-3xl font-bold text-white mb-3">
                      {product.title}
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-base leading-relaxed">
                      {product.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative z-10">
                    <div className="mb-8 flex items-baseline">
                      <span className="text-5xl font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(product.price)}
                      </span>
                      <span className="text-zinc-500 ml-2 text-lg">/mês</span>
                    </div>

                    <div className="space-y-4 mb-6">
                      <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                        Recursos Incluídos
                      </h4>
                      {product.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 text-sm"
                        >
                          <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-green-500" />
                          </div>
                          <span className="text-zinc-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="relative z-10 pt-6">
                    <Button
                      className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-semibold text-lg rounded-xl group-hover:translate-y-[-2px] transition-all duration-300 shadow-lg shadow-white/5"
                      onClick={() =>
                        navigate(`/checkout?product=${product.id}`)
                      }
                    >
                      Comprar Agora
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })
          )}
        </div>

        {/* FAQ Section */}
        <Card className="bg-zinc-950 border-zinc-800 max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-white text-center">
              Perguntas Frequentes sobre Preços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-white mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-zinc-400 text-sm">
                Sim! Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas escondidas.
                O acesso continuará até o final do período pago.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                Há período de teste gratuito?
              </h3>
              <p className="text-zinc-400 text-sm">
                Oferecemos garantia de 7 dias. Se não ficar satisfeito, devolvemos 100% do seu dinheiro.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                Os preços podem mudar?
              </h3>
              <p className="text-zinc-400 text-sm">
                Se você já é cliente, seu preço permanece o mesmo. Novos preços se aplicam apenas a novos clientes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">
                Aceitam quais formas de pagamento?
              </h3>
              <p className="text-zinc-400 text-sm">
                Aceitamos Pix (aprovação imediata) e cartão de crédito através do Mercado Pago ou LivePix.
                Todas as transações são seguras e criptografadas.
              </p>
            </div>
            <div className="pt-4 border-t border-zinc-800 text-center">
              <p className="text-zinc-400 text-sm mb-4">
                Ainda tem dúvidas? Entre em contato conosco!
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  className="border-zinc-800"
                  onClick={() => navigate('/support')}
                >
                  Central de Suporte
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-800"
                  onClick={() => navigate('/faq')}
                >
                  Ver FAQ Completo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


