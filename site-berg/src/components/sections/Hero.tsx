import { ArrowDown, CheckCircle2, ShoppingCart, Star, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    element?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden bg-black"
    >
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-8 z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
            {/* Banner */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm animate-fade-in-up">
              <span className="text-zinc-400 text-xs md:text-sm font-medium">
                Na Berg você economiza{' '}
                <span className="text-green-400">+R$1.180/ano</span>
              </span>
              <div className="w-px h-3 bg-zinc-800" />
              <button className="text-xs md:text-sm font-medium text-white hover:text-zinc-300 transition-colors">
                Saiba mais
              </button>
            </div>

            {/* Headings */}
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] animate-fade-in-up delay-100">
                Aqui você Administra <br />
                <span className="bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
                  Com muita facilidade!
                </span>
              </h1>
              <p className="text-lg text-zinc-400 max-w-lg mx-auto lg:mx-0 leading-relaxed animate-fade-in-up delay-200">
                Um bot com sistemas avançados para vendas, customização,
                moderação e segurança de seu servidor no Discord.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up delay-300">
              <Button
                size="lg"
                className="h-12 px-8 rounded-full bg-white text-black hover:bg-zinc-200 font-semibold text-base"
                onClick={() => scrollToSection('clients')}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                </svg>
                Entrar
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 rounded-full border-zinc-800 bg-black text-white hover:bg-zinc-900"
              >
                Ver planos
              </Button>
            </div>
          </div>

          {/* Right Visuals */}
          <div className="relative h-[400px] hidden lg:flex items-center justify-center animate-fade-in delay-300">
            <div className="relative w-full max-w-md">
              {/* Floating Cards Simulation */}
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-12 opacity-40 scale-90 blur-[2px]">
                <NotificationCard
                  icon={<ShoppingCart className="w-5 h-5 text-white" />}
                  title="Venda realizada"
                  subtitle="Produto"
                  time="Hoje as 11:33"
                />
              </div>
              <div className="absolute top-1/2 right-8 transform -translate-y-1/2 translate-x-12 z-10">
                <NotificationCard
                  icon={<Star className="w-5 h-5 text-yellow-400" />}
                  title="Venda realizada"
                  subtitle="Serviço Premium"
                  time="Hoje as 10:42"
                  highlight
                />
              </div>
              <div className="absolute bottom-0 right-0 transform translate-x-4 translate-y-8 opacity-60 scale-95 blur-[1px]">
                <NotificationCard
                  icon={<Box className="w-5 h-5 text-blue-400" />}
                  title="Venda realizada"
                  subtitle="Pacote Completo"
                  time="Hoje as 09:15"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <ArrowDown className="w-6 h-6 text-zinc-600" />
        </div>
      </div>
    </section>
  )
}

function NotificationCard({
  icon,
  title,
  subtitle,
  time,
  highlight = false,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  time: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl w-[280px] transition-all duration-500',
        highlight
          ? 'bg-zinc-900/90 border-zinc-700 shadow-2xl shadow-black/50'
          : 'bg-zinc-950/50 border-zinc-800/50',
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase font-bold text-zinc-500 mb-0.5">
          {title}
        </p>
        <p className="text-sm font-bold text-white truncate">{subtitle}</p>
      </div>
      <div className="text-[10px] font-medium text-zinc-600 self-start mt-1">
        {time}
      </div>
    </div>
  )
}
