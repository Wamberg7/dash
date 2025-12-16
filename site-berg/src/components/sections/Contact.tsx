import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome deve ter pelo menos 2 caracteres.',
  }),
  email: z.string().email({
    message: 'Por favor, insira um email válido.',
  }),
  subject: z.string().min(5, {
    message: 'O assunto deve ter pelo menos 5 caracteres.',
  }),
  message: z.string().min(10, {
    message: 'A mensagem deve ter pelo menos 10 caracteres.',
  }),
})

export function Contact() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      console.log(values)
      setIsLoading(false)
      toast({
        title: 'Mensagem enviada!',
        description: 'Obrigado pelo contato. Retornarei em breve.',
        className: 'bg-zinc-900 border-zinc-800 text-white',
      })
      form.reset()
    }, 1500)
  }

  return (
    <section id="contact" className="py-24 bg-black border-t border-zinc-900">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Vamos construir algo incrível?
            </h2>
            <p className="text-zinc-400 text-lg mb-12 leading-relaxed">
              Estou disponível para novos projetos e parcerias. Preencha o
              formulário ou utilize um dos canais abaixo para entrar em contato.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-900 rounded-lg text-white border border-zinc-800">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-1">
                    Email
                  </h3>
                  <a
                    href="mailto:contato@berg.dev"
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    contato@berg.dev
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-900 rounded-lg text-white border border-zinc-800">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-1">
                    Telefone
                  </h3>
                  <p className="text-zinc-400">+55 (11) 99999-9999</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-900 rounded-lg text-white border border-zinc-800">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-1">
                    Localização
                  </h3>
                  <p className="text-zinc-400">São Paulo, SP - Brasil</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-8 rounded-2xl border border-zinc-800">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Nome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Seu nome"
                            {...field}
                            className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="seu@email.com"
                            {...field}
                            className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Assunto</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sobre o que vamos falar?"
                          {...field}
                          className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">Mensagem</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva seu projeto..."
                          className="min-h-[150px] resize-y bg-black border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Mensagem <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  )
}
