import { ShieldCheck, Zap, Rocket } from 'lucide-react'

export function About() {
  return (
    <section id="about" className="py-24 bg-black">
      <div className="container mx-auto px-4 md:px-8">
        {/* Main Container resembling 'Venda Sem Medo' section */}
        <div className="relative border border-zinc-800 rounded-[2rem] p-8 md:p-16 overflow-hidden bg-zinc-950/50">
          <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Sobre Mim
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Sou um desenvolvedor Full Stack apaixonado por criar soluções que
              não apenas funcionam, mas encantam. Com uma abordagem centrada no
              usuário e foco em performance, transformo desafios complexos em
              interfaces simples e intuitivas. Minha missão é ajudar empresas a
              escalarem seus negócios através da tecnologia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Sub-card 1 */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Qualidade de Código
              </h3>
              <p className="text-sm text-zinc-500">
                Código limpo, testável e escalável, seguindo as melhores
                práticas do mercado para garantir longevidade ao projeto.
              </p>
            </div>

            {/* Sub-card 2 */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4 text-white">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Alta Performance
              </h3>
              <p className="text-sm text-zinc-500">
                Aplicações otimizadas para velocidade máxima, proporcionando uma
                experiência fluida para os usuários finais.
              </p>
            </div>

            {/* Sub-card 3 */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4 text-white">
                <Rocket className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Entrega Ágil
              </h3>
              <p className="text-sm text-zinc-500">
                Metodologias ágeis que garantem entregas contínuas e feedback
                constante durante todo o processo de desenvolvimento.
              </p>
            </div>
          </div>

          {/* Abstract glow behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
        </div>
      </div>
    </section>
  )
}
