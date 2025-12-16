import { useNavigate } from 'react-router-dom'
import { ShieldX, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AccessDenied() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
              <ShieldX className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Acesso Negado
          </h1>

          <p className="text-zinc-400 mb-8">
            Você não tem permissão para acessar esta área. Apenas
            administradores podem acessar o painel administrativo.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-white text-black hover:bg-zinc-200"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar para Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

