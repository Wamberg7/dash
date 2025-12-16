import { ShieldCheck, BadgeCheck, Rocket } from 'lucide-react'

const items = [
  {
    icon: ShieldCheck,
    title: 'Segurança Total',
    description: 'Proteção contra fraudes e chargebacks',
  },
  {
    icon: BadgeCheck,
    title: 'Garantia de Qualidade',
    description: 'Sistema testado e aprovado por milhares',
  },
  {
    icon: Rocket,
    title: 'Crescimento Rápido',
    description: 'Escale suas vendas sem limites',
  },
]

export function SalesSecurity() {
  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="relative rounded-[2.5rem] border border-zinc-800 bg-zinc-950/50 p-12 md:p-16 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-3xl bg-white/5 blur-[120px] pointer-events-none" />

          <div className="relative z-10 text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mb-8 shadow-xl shadow-black/50">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Venda Sem Medo
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Com a Berg, você pode vender com total confiança. Nossos sistemas
              de segurança protegem cada transação e garantem que seus clientes
              estejam sempre satisfeitos.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-black/50 border border-zinc-800/50 backdrop-blur-sm hover:bg-zinc-900/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 text-zinc-300 group-hover:text-white">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
