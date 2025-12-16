import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, MessageCircle, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SupportWidget } from '@/components/SupportWidget'

export default function Support() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6 text-zinc-400 hover:text-white"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Central de Suporte</h1>
            <p className="text-zinc-400">
              Estamos aqui para ajudar. Escolha a melhor forma de entrar em contato conosco.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="w-5 h-5" />
                  Suporte por Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-300 text-sm">
                  Envie-nos um email e responderemos o mais rápido possível.
                </p>
                <a
                  href="mailto:suporte@berg.com"
                  className="inline-block text-green-500 hover:text-green-400 transition-colors"
                >
                  suporte@berg.com
                </a>
                <p className="text-zinc-500 text-xs">
                  Tempo de resposta: até 24 horas úteis
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MessageCircle className="w-5 h-5" />
                  Comunidade Discord
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-300 text-sm">
                  Junte-se à nossa comunidade no Discord para suporte em tempo real.
                </p>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Entrar no Discord
                </a>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <HelpCircle className="w-5 h-5" />
                Perguntas Frequentes (FAQ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 text-sm mb-4">
                Encontre respostas para as perguntas mais comuns.
              </p>
              <Link
                to="/faq"
                className="inline-block text-green-500 hover:text-green-400 transition-colors"
              >
                Ver FAQ completo →
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Recursos de Ajuda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Documentação</h3>
                <p className="text-zinc-300 text-sm mb-2">
                  Acesse nossa documentação completa para aprender a usar todas as funcionalidades da plataforma.
                </p>
                <a
                  href="#"
                  className="text-green-500 hover:text-green-400 transition-colors text-sm"
                >
                  Ver Documentação →
                </a>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Tutoriais em Vídeo</h3>
                <p className="text-zinc-300 text-sm mb-2">
                  Assista aos nossos tutoriais em vídeo para começar rapidamente.
                </p>
                <a
                  href="#"
                  className="text-green-500 hover:text-green-400 transition-colors text-sm"
                >
                  Ver Tutoriais →
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <SupportWidget />
    </div>
  )
}

