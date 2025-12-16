import {
  Code2,
  Database,
  Layout,
  Smartphone,
  Server,
  Terminal,
} from 'lucide-react'

const skills = [
  {
    icon: Layout,
    title: 'Frontend Development',
    description:
      'React, Next.js, TypeScript e Tailwind CSS. Interfaces modernas e responsivas.',
  },
  {
    icon: Server,
    title: 'Backend & APIs',
    description: 'Node.js, Express e NestJS. APIs robustas e escaláveis.',
  },
  {
    icon: Database,
    title: 'Banco de Dados',
    description:
      'PostgreSQL, MongoDB e Redis. Gerenciamento eficiente de dados.',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Responsividade total e experiência mobile nativa.',
  },
  {
    icon: Code2,
    title: 'Arquitetura',
    description: 'Clean Architecture e SOLID para sistemas manuteníveis.',
  },
  {
    icon: Terminal,
    title: 'DevOps',
    description: 'Docker, CI/CD e Cloud Computing (AWS/Vercel).',
  },
]

export function Skills() {
  return (
    <section id="skills" className="py-24 bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Habilidades
          </h2>
          <p className="text-zinc-400 text-lg">
            Tudo que você precisa para transformar sua ideia em um produto
            digital completo.
          </p>
        </div>

        {/* Grid mimicking 'Recursos' section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900/50 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mb-6 border border-zinc-800 text-white group-hover:scale-110 transition-transform">
                <skill.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {skill.title}
              </h3>
              <p className="text-zinc-500 leading-relaxed text-sm">
                {skill.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
