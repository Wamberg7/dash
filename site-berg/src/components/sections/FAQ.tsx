import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Como começar a usar a Berg?',
    answer:
      'Para começar, basta criar uma conta clicando no botão "Entrar" no topo da página. Após o cadastro, você terá acesso ao painel de controle para configurar seus serviços.',
  },
  {
    question: 'Quais são os métodos de pagamento aceitos?',
    answer:
      'Aceitamos os principais cartões de crédito, Pix e boleto bancário. Todas as transações são processadas de forma segura.',
  },
  {
    question: 'A Berg é segura para minhas transações?',
    answer:
      'Sim, a segurança é nossa prioridade. Utilizamos criptografia de ponta a ponta e seguimos rigorosamente as diretrizes da LGPD para proteger seus dados e transações.',
  },
  {
    question: 'Posso personalizar minha loja?',
    answer:
      'Sim! Oferecemos diversas opções de personalização para que sua loja tenha a identidade visual da sua marca.',
  },
  {
    question: 'Como funciona o suporte?',
    answer:
      'Nosso suporte funciona 24/7 através do Discord e email. Temos uma equipe dedicada pronta para ajudar com qualquer dúvida ou problema técnico.',
  },
  {
    question: 'Posso cancelar minha assinatura a qualquer momento?',
    answer:
      'Sim, você tem total liberdade para cancelar sua assinatura quando quiser, sem multas ou taxas escondidas.',
  },
  {
    question: 'Posso vender sendo menor de idade?',
    answer:
      'Para vender na plataforma, é necessário ter pelo menos 18 anos ou ser emancipado, conforme nossos termos de uso e a legislação vigente.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-black">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Dúvidas Frequentes
          </h2>
          <p className="text-zinc-400 text-lg">
            Encontre respostas para as perguntas mais comuns sobre a Berg
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-zinc-800 rounded-xl bg-zinc-950 px-6 data-[state=open]:border-zinc-700 transition-colors"
            >
              <AccordionTrigger className="text-left text-base md:text-lg font-medium py-6 text-white hover:text-zinc-300 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400 text-base pb-6 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
