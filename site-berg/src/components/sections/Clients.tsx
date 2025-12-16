import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const clients = [
  {
    name: 'Blox Piece',
    logo: 'https://img.usecurling.com/i?q=blox-piece&color=gradient&shape=fill',
    members: '12.4K',
    clients: '9.5K',
  },
  {
    name: 'Catatau',
    logo: 'https://img.usecurling.com/i?q=catatau&color=white&shape=fill',
    members: '24.4K',
    clients: '8.0K',
  },
  {
    name: 'FAST STORE | DE VOLTA',
    logo: 'https://img.usecurling.com/i?q=fast-store&color=red&shape=fill',
    members: '11.8K',
    clients: '7.3K',
  },
  {
    name: 'Flow Community',
    logo: 'https://img.usecurling.com/i?q=flow-community&color=purple&shape=fill',
    members: '50.6K',
    clients: '6.2K',
  },
]

export function Clients() {
  return (
    <section
      id="clients"
      className="py-24 bg-black border-t border-zinc-900/50"
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Nossos Clientes
          </h2>
          <p className="text-zinc-400 text-lg">
            Descubra as melhores comunidades do Discord e conecte-se com
            milhares de pessoas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {clients.map((client, index) => (
            <div
              key={index}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex items-center gap-4 hover:border-zinc-700 transition-colors group"
            >
              <Avatar className="w-14 h-14 border-2 border-zinc-800 rounded-xl group-hover:border-zinc-600 transition-colors">
                <AvatarImage src={client.logo} alt={client.name} />
                <AvatarFallback className="bg-zinc-900 text-zinc-400 rounded-xl font-bold">
                  {client.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm truncate mb-1">
                  {client.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{client.members} membros</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                  <svg
                    className="w-3 h-3 text-[#5865F2]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                  </svg>
                  <span>{client.clients} clientes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
