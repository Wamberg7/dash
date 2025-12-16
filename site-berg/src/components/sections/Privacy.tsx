import { Lock, EyeOff, ShieldCheck, Server, KeyRound } from 'lucide-react'

const features = [
  {
    icon: KeyRound,
    text: 'Criptografia end-to-end',
  },
  {
    icon: EyeOff,
    text: 'Sem compartilhamento de dados',
  },
  {
    icon: ShieldCheck,
    text: 'Conformidade com LGPD',
  },
  {
    icon: Server,
    text: 'Servidores seguros e protegidos',
  },
]

export function Privacy() {
  return (
    <section id="legal" className="py-24 bg-black relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="rounded-[2.5rem] border border-zinc-800 bg-zinc-950/50 p-8 md:p-16 lg:p-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  100% de Privacidade dos Seus Dados
                </h2>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
                  Na Berg, levamos a privacidade muito a sério. Seus dados estão
                  completamente protegidos e nunca são compartilhados com
                  terceiros. Utilizamos criptografia de ponta e seguimos as
                  melhores práticas de segurança.
                </p>
              </div>

              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      <feature.icon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <span className="text-zinc-300 font-medium">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Icon */}
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-zinc-900/30 flex items-center justify-center border border-zinc-800/50">
                <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
                <Lock
                  className="w-32 h-32 text-white opacity-90 glow-icon"
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
