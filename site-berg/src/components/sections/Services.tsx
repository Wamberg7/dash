import { Globe, LineChart, Smartphone, Users, Code, Cpu } from 'lucide-react'

const services = [
  {
    icon: Globe,
    title: 'Sites Institucionais',
    description:
      'Desenvolvimento de sites profissionais para fortalecer sua marca.',
  },
  {
    icon: Smartphone,
    title: 'Aplicativos Mobile',
    description: 'Apps nativos e híbridos para iOS e Android.',
  },
  {
    icon: Code,
    title: 'Sistemas Web',
    description: 'Plataformas complexas e painéis administrativos sob medida.',
  },
  {
    icon: LineChart,
    title: 'SEO & Performance',
    description: 'Otimização para Google e velocidade de carregamento.',
  },
  {
    icon: Users,
    title: 'Consultoria Tech',
    description: 'Apoio na tomada de decisões técnicas e arquiteturais.',
  },
  {
    icon: Cpu,
    title: 'Integrações de API',
    description: 'Conexão entre diferentes sistemas e automação de processos.',
  },
]

export function Services() {
  return (
    <section id="services" className="py-24 bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Serviços
          </h2>
          <p className="text-zinc-400 text-lg">
            Soluções técnicas especializadas para impulsionar seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4 text-white group-hover:bg-white group-hover:text-black transition-colors">
                <service.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {service.title}
              </h3>
              <p className="text-zinc-500 text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
