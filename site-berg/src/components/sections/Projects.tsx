import { ExternalLink, Github } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const projects = [
  {
    title: 'E-commerce Dashboard',
    description: 'Painel administrativo para gestão de vendas.',
    image:
      'https://img.usecurling.com/p/800/500?q=dashboard%20dark%20ui&color=black',
    tags: ['React', 'TypeScript', 'Supabase'],
  },
  {
    title: 'Task Master',
    description: 'App de produtividade e gestão de tarefas.',
    image: 'https://img.usecurling.com/p/800/500?q=kanban%20dark&color=black',
    tags: ['Next.js', 'Tailwind', 'Prisma'],
  },
  {
    title: 'Finance Tracker',
    description: 'Controle financeiro pessoal automatizado.',
    image: 'https://img.usecurling.com/p/800/500?q=finance%20app&color=black',
    tags: ['React Native', 'Node.js'],
  },
  {
    title: 'Health App',
    description: 'Plataforma de telemedicina e agendamento.',
    image:
      'https://img.usecurling.com/p/800/500?q=medical%20app%20dark&color=black',
    tags: ['Vue.js', 'WebRTC'],
  },
]

export function Projects() {
  return (
    <section id="projects" className="py-24 bg-black">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Projetos
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Descubra alguns dos trabalhos que desenvolvi recentemente.
          </p>
        </div>

        {/* Grid mimicking 'Nossos Clientes' section style but for projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {projects.map((project, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row h-full">
                <div className="w-full sm:w-2/5 h-48 sm:h-auto relative overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent sm:bg-gradient-to-t sm:from-black/0 sm:to-transparent" />
                </div>

                <div className="p-6 flex flex-col justify-center w-full sm:w-3/5">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {project.title}
                  </h3>
                  <p className="text-zinc-500 text-sm mb-4">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                    >
                      Ver <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            variant="outline"
            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full px-8"
          >
            Ver Todos no GitHub <Github className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
