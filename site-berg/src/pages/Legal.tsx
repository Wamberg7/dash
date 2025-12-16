import { useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Legal() {
  const [searchParams] = useSearchParams()
  const section = searchParams.get('section') || 'terms'

  const sections = {
    terms: {
      title: 'Termos de Uso',
      content: (
        <div className="space-y-6 text-zinc-300">
          <p className="text-zinc-400">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar a plataforma Berg, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Descrição do Serviço</h2>
            <p>
              A Berg oferece uma plataforma para criação e gerenciamento de bots para Discord e Telegram, 
              incluindo ferramentas de automação e recursos profissionais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Uso Aceitável</h2>
            <p>Você concorda em não usar a plataforma para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Qualquer atividade ilegal ou não autorizada</li>
              <li>Violar direitos de propriedade intelectual</li>
              <li>Transmitir vírus ou código malicioso</li>
              <li>Interferir no funcionamento da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da plataforma, incluindo código, design, textos e logotipos, 
              é propriedade da Berg e está protegido por leis de direitos autorais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Limitação de Responsabilidade</h2>
            <p>
              A Berg não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais 
              resultantes do uso ou incapacidade de usar a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">6. Modificações dos Termos</h2>
            <p>
              Reservamos o direito de modificar estes termos a qualquer momento. 
              As alterações entrarão em vigor imediatamente após a publicação.
            </p>
          </section>
        </div>
      ),
    },
    privacy: {
      title: 'Política de Privacidade',
      content: (
        <div className="space-y-6 text-zinc-300">
          <p className="text-zinc-400">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Informações Coletadas</h2>
            <p>Coletamos as seguintes informações:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Nome e endereço de e-mail</li>
              <li>Informações de pagamento (processadas por terceiros seguros)</li>
              <li>Dados de uso da plataforma</li>
              <li>Informações técnicas do dispositivo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Uso das Informações</h2>
            <p>Utilizamos suas informações para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Processar pagamentos</li>
              <li>Enviar comunicações importantes</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Compartilhamento de Dados</h2>
            <p>
              Não vendemos suas informações pessoais. Podemos compartilhar dados apenas com:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Provedores de serviços de pagamento (Mercado Pago, LivePix)</li>
              <li>Prestadores de serviços de hospedagem</li>
              <li>Quando exigido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Segurança</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger 
              suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">5. Seus Direitos</h2>
            <p>Você tem o direito de:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Acessar suas informações pessoais</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Opor-se ao processamento de seus dados</li>
            </ul>
          </section>
        </div>
      ),
    },
    cookies: {
      title: 'Política de Cookies',
      content: (
        <div className="space-y-6 text-zinc-300">
          <p className="text-zinc-400">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. O que são Cookies</h2>
            <p>
              Cookies são pequenos arquivos de texto armazenados em seu dispositivo quando você visita nosso site. 
              Eles nos ajudam a melhorar sua experiência e fornecer funcionalidades personalizadas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Tipos de Cookies que Utilizamos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Cookies Essenciais</h3>
                <p>Necessários para o funcionamento básico do site, incluindo autenticação e segurança.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Cookies de Desempenho</h3>
                <p>Coletam informações sobre como você usa o site para melhorar o desempenho.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Cookies de Funcionalidade</h3>
                <p>Permitem que o site lembre de suas preferências e forneça recursos personalizados.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Gerenciamento de Cookies</h2>
            <p>
              Você pode gerenciar ou desativar cookies através das configurações do seu navegador. 
              No entanto, isso pode afetar a funcionalidade do site.
            </p>
          </section>
        </div>
      ),
    },
    refund: {
      title: 'Política de Reembolso',
      content: (
        <div className="space-y-6 text-zinc-300">
          <p className="text-zinc-400">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Direito ao Reembolso</h2>
            <p>
              Você tem direito a solicitar reembolso dentro de 7 dias corridos a partir da data da compra, 
              conforme previsto no Código de Defesa do Consumidor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. Como Solicitar Reembolso</h2>
            <p>Para solicitar um reembolso:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1 ml-4">
              <li>Entre em contato através do email de suporte</li>
              <li>Informe o número do pedido e o motivo do reembolso</li>
              <li>Aguarde a análise da solicitação (até 5 dias úteis)</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Processamento do Reembolso</h2>
            <p>
              Após a aprovação, o reembolso será processado no mesmo método de pagamento utilizado na compra. 
              O valor pode levar até 10 dias úteis para aparecer na sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Casos de Não Reembolso</h2>
            <p>Reembolsos não serão concedidos em casos de:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Uso indevido ou violação dos termos de serviço</li>
              <li>Solicitação após 7 dias da compra</li>
              <li>Serviços já utilizados ou consumidos</li>
            </ul>
          </section>
        </div>
      ),
    },
  }

  const currentSection = sections[section as keyof typeof sections] || sections.terms

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

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">{currentSection.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentSection.content}
            
            <div className="pt-8 border-t border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Outros Documentos Legais</h3>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/legal?section=terms"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Termos de Uso
                </Link>
                <Link
                  to="/legal?section=privacy"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Política de Privacidade
                </Link>
                <Link
                  to="/legal?section=cookies"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Política de Cookies
                </Link>
                <Link
                  to="/legal?section=refund"
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Política de Reembolso
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

