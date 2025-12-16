import {
  Shield,
  Palette,
  LayoutDashboard,
  MessageSquareText,
} from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Moderação Avançada',
    description:
      'Ferramentas poderosas de punição e logs para manter seu servidor seguro e organizado.',
  },
  {
    icon: Palette,
    title: 'Customização Total',
    description:
      'Personalize cores, mensagens e comandos do bot para alinhar com a identidade da sua marca.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard Completo',
    description:
      'Acompanhe métricas de vendas, tickets e engajamento em tempo real através do nosso painel.',
  },
  {
    icon: MessageSquareText,
    title: 'Suporte Humanizado',
    description:
      'Nossa equipe de especialistas está sempre disponível para ajudar você em cada etapa.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-black relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Outros Recursos
          </h2>
          <p className="text-zinc-400 text-lg">
            Descubra mais ferramentas da Berg para potencializar sua comunidade
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
