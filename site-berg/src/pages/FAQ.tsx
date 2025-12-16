import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HelpCircle, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

const faqs = [
  {
    category: 'Geral',
    questions: [
      {
        question: 'Como começar a usar a Berg?',
        answer:
          'Para começar, basta criar uma conta clicando no botão "Entrar" no topo da página. Após o cadastro, você terá acesso ao painel de controle para configurar seus bots Discord e Telegram. Você pode escolher entre nossos planos disponíveis e começar a usar imediatamente após o pagamento.',
      },
      {
        question: 'O que é a plataforma Berg?',
        answer:
          'A Berg é uma plataforma avançada para criação e gerenciamento de bots para Discord e Telegram. Oferecemos ferramentas profissionais para automatizar processos, criar bots de vendas, bots de tickets com IA, e muito mais. Simplificamos o trabalho de desenvolvedores e empresas que precisam de automação.',
      },
      {
        question: 'Preciso saber programar para usar a Berg?',
        answer:
          'Não! Nossa plataforma foi desenvolvida para ser intuitiva e fácil de usar. Você pode criar e configurar bots através de uma interface visual, sem necessidade de conhecimento em programação. Claro, se você souber programar, terá ainda mais opções de personalização.',
      },
    ],
  },
  {
    category: 'Pagamentos',
    questions: [
      {
        question: 'Quais são os métodos de pagamento aceitos?',
        answer:
          'Aceitamos pagamentos via Pix (com aprovação imediata) e cartão de crédito através do Mercado Pago ou LivePix. Todas as transações são processadas de forma segura e criptografada.',
      },
      {
        question: 'Como funciona o pagamento?',
        answer:
          'Após selecionar um produto e preencher seus dados, você será redirecionado para a página de pagamento. Se escolher Pix, receberá um QR Code para escanear com seu aplicativo bancário. Se escolher cartão, será redirecionado para o checkout seguro do gateway de pagamento.',
      },
      {
        question: 'O pagamento é seguro?',
        answer:
          'Sim! Utilizamos gateways de pagamento reconhecidos e seguros (Mercado Pago e LivePix), que são certificados e seguem os mais altos padrões de segurança. Nós não armazenamos dados de cartão de crédito em nossos servidores.',
      },
      {
        question: 'Posso solicitar reembolso?',
        answer:
          'Sim, você tem direito a solicitar reembolso dentro de 7 dias corridos a partir da data da compra, conforme previsto no Código de Defesa do Consumidor. Entre em contato através do email de suporte informando o número do pedido.',
      },
    ],
  },
  {
    category: 'Bots e Funcionalidades',
    questions: [
      {
        question: 'Quais tipos de bots posso criar?',
        answer:
          'Oferecemos bots de vendas com entrega automática, controle de estoque e múltiplos métodos de pagamento. Também temos bots de tickets com IA para atendimento automático 24/7. Você pode personalizar e configurar cada bot conforme suas necessidades.',
      },
      {
        question: 'Como configuro meu bot após a compra?',
        answer:
          'Após o pagamento ser aprovado, você será redirecionado para a página de configuração do bot. Lá você poderá inserir o token do Discord/Telegram, configurar o servidor, definir permissões e personalizar todas as funcionalidades.',
      },
      {
        question: 'Posso usar o bot em múltiplos servidores?',
        answer:
          'Depende do plano escolhido. Alguns planos permitem uso em múltiplos servidores, enquanto outros são limitados. Verifique as especificações de cada plano antes de comprar.',
      },
      {
        question: 'O bot funciona 24/7?',
        answer:
          'Sim! Nossos bots são hospedados em servidores confiáveis e ficam online 24 horas por dia, 7 dias por semana. Você pode monitorar o status do bot através do painel de controle.',
      },
    ],
  },
  {
    category: 'Suporte e Conta',
    questions: [
      {
        question: 'Como funciona o suporte?',
        answer:
          'Nosso suporte funciona através de email (suporte@berg.com) e comunidade Discord. Temos uma equipe dedicada pronta para ajudar com qualquer dúvida ou problema técnico. O tempo de resposta por email é de até 24 horas úteis.',
      },
      {
        question: 'Posso cancelar minha assinatura a qualquer momento?',
        answer:
          'Sim, você tem total liberdade para cancelar sua assinatura quando quiser, sem multas ou taxas escondidas. O cancelamento pode ser feito através do painel de controle ou entrando em contato com o suporte.',
      },
      {
        question: 'Como atualizo meus dados pessoais?',
        answer:
          'Você pode atualizar seus dados pessoais a qualquer momento através do painel de controle, na seção de configurações da conta. Todas as alterações são salvas automaticamente.',
      },
      {
        question: 'Esqueci minha senha. Como recupero?',
        answer:
          'Na página de login, clique em "Esqueci minha senha" e siga as instruções. Você receberá um email com um link para redefinir sua senha de forma segura.',
      },
    ],
  },
  {
    category: 'Segurança e Privacidade',
    questions: [
      {
        question: 'A Berg é segura para minhas transações?',
        answer:
          'Sim, a segurança é nossa prioridade. Utilizamos criptografia de ponta a ponta, seguimos rigorosamente as diretrizes da LGPD para proteger seus dados e trabalhamos apenas com gateways de pagamento certificados e seguros.',
      },
      {
        question: 'Meus dados são compartilhados com terceiros?',
        answer:
          'Não vendemos suas informações pessoais. Compartilhamos dados apenas com provedores de serviços de pagamento (Mercado Pago, LivePix) e prestadores de serviços de hospedagem, sempre com o objetivo de fornecer nossos serviços. Para mais detalhes, consulte nossa Política de Privacidade.',
      },
      {
        question: 'Como vocês protegem meus dados?',
        answer:
          'Implementamos medidas de segurança técnicas e organizacionais, incluindo criptografia SSL/TLS, backups regulares, monitoramento de segurança 24/7 e acesso restrito aos dados. Todos os nossos servidores seguem os mais altos padrões de segurança.',
      },
    ],
  },
]

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFaqs = faqs.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0)

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
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <HelpCircle className="w-8 h-8" />
              Perguntas Frequentes (FAQ)
            </h1>
            <p className="text-zinc-400">
              Encontre respostas para as perguntas mais comuns sobre a plataforma Berg.
            </p>
          </div>

          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Buscar perguntas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600"
                />
              </div>
            </CardContent>
          </Card>

          {filteredFaqs.length === 0 ? (
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="pt-6 text-center py-12">
                <p className="text-zinc-400">
                  Nenhuma pergunta encontrada com "{searchTerm}". Tente buscar com outras palavras.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFaqs.map((category) => (
              <Card key={category.category} className="bg-zinc-950 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-xl text-white">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`item-${category.category}-${index}`}
                        className="border-zinc-800"
                      >
                        <AccordionTrigger className="text-left text-zinc-200 hover:text-white">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-400 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}

          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Não encontrou o que procurava?
                </h3>
                <p className="text-zinc-400 text-sm">
                  Entre em contato com nosso suporte e teremos prazer em ajudar.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link to="/support">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Central de Suporte
                    </Button>
                  </Link>
                  <a href="mailto:suporte@berg.com">
                    <Button variant="outline" className="border-zinc-800">
                      Enviar Email
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

