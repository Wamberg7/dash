import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Check,
  CreditCard,
  QrCode,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  ShoppingCart,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/stores/main'
import { useAuth } from '@/stores/auth'
import { Skeleton } from '@/components/ui/skeleton'
import { createMercadoPagoPreference, createPixPayment, validateAccessToken } from '@/lib/mercadopago'
import { createLivePixPayment } from '@/lib/livepix'

const formSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Nome deve ter pelo menos 2 caracteres.' }),
    email: z.string().email({ message: 'Por favor, insira um email válido.' }),
    paymentMethod: z.enum(['credit_card', 'pix'], {
      required_error: 'Selecione um método de pagamento.',
    }),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvc: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === 'credit_card') {
      if (!data.cardNumber || data.cardNumber.length < 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Número do cartão inválido.',
          path: ['cardNumber'],
        })
      }
      if (!data.cardExpiry) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Validade obrigatória.',
          path: ['cardExpiry'],
        })
      }
      if (!data.cardCvc || data.cardCvc.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CVC inválido.',
          path: ['cardCvc'],
        })
      }
    }
  })

export default function Checkout() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const { products, createOrder, updateOrder, isLoading: isStoreLoading, settings } = useAppStore()
  const { user, isAuthenticated } = useAuth()

  const productId = searchParams.get('product')
  const upgradeType = searchParams.get('upgrade')
  const upgradeOrderId = searchParams.get('orderId')
  const upgradeRamMb = searchParams.get('ramMb')
  const upgradePrice = searchParams.get('price')
  const selectedProduct =
    products.find((p) => p.id === productId) || products[0]
  
  const isUpgrade = upgradeType === 'ram' && upgradeOrderId && upgradeRamMb && upgradePrice

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      paymentMethod: 'credit_card',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
    },
  })

  const paymentMethod = form.watch('paymentMethod')

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedProduct) return

    setIsProcessing(true)

    try {
      // Verificar qual gateway está configurado
      if (settings?.paymentGateway === 'LivePix') {
        // Processar com LivePix
        if (!settings?.livepixClientId || !settings?.livepixClientSecret) {
          toast({
            title: 'Configuração incompleta',
            description: 'Client ID e Client Secret do LivePix não configurados. Configure nas Configurações.',
            variant: 'destructive',
          })
          setIsProcessing(false)
          return
        }

        // LivePix só suporta PIX
        if (values.paymentMethod !== 'pix') {
          toast({
            title: 'Método não suportado',
            description: 'LivePix suporta apenas pagamentos via PIX. Por favor, selecione PIX como método de pagamento.',
            variant: 'destructive',
          })
          setIsProcessing(false)
          return
        }

        console.log('Iniciando pagamento LivePix...', {
          product: selectedProduct.title,
          price: selectedProduct.price,
          email: values.email,
          name: values.name,
        })

        // Validar preço do produto
        if (!selectedProduct.price || selectedProduct.price <= 0) {
          throw new Error('Preço do produto inválido. Verifique o produto selecionado.')
        }

        // Determinar valor e descrição baseado em upgrade ou produto normal
        const amount = isUpgrade ? Number(upgradePrice) : Number(selectedProduct.price)
        const description = isUpgrade 
          ? `Upgrade de RAM: +${upgradeRamMb} MB`
          : selectedProduct.title

        // Criar pedido ANTES de criar o pagamento para ter o orderId
        let orderId = null
        if (!isUpgrade) {
          const newOrder = await createOrder({
            customerName: values.name,
            customerEmail: values.email,
            productId: selectedProduct.id,
            productName: selectedProduct.title,
            amount: selectedProduct.price,
            status: 'pending',
            paymentMethod: 'pix',
            userId: user.userId || user.id,
          })
          orderId = newOrder.id
        } else {
          orderId = upgradeOrderId
        }

        // Processar pagamento LivePix (passar orderId para incluir no redirectUrl)
        const livepixPayment = await createLivePixPayment(
          settings.livepixClientId,
          settings.livepixClientSecret,
          {
            amount: amount,
            description: description,
            payer: {
              name: values.name,
              email: values.email,
            },
            orderId: orderId, // Passar orderId para incluir no redirectUrl
            origin: window.location.origin, // Passar origin para construir URL correta
          }
        )

        console.log('Pagamento LivePix criado com sucesso:', {
          id: livepixPayment.id,
          reference: livepixPayment.reference,
          status: livepixPayment.status,
          hasRedirectUrl: !!livepixPayment.redirectUrl,
          hasQrCode: !!livepixPayment.qr_code || !!livepixPayment.qr_code_base64,
        })

        // Extrair reference (ID do pagamento) - o LivePix usa 'reference' como ID
        const paymentReference = livepixPayment.reference || livepixPayment.id?.toString()
        const redirectUrl = livepixPayment.redirectUrl

        // Atualizar pedido com o paymentId (reference) ANTES de redirecionar
        if (paymentReference && !isUpgrade && orderId) {
          try {
            await updateOrder(orderId, { paymentId: paymentReference })
            console.log(`✅ Pedido ${orderId} atualizado com paymentId: ${paymentReference}`)
          } catch (err) {
            console.error('Erro ao atualizar pedido com paymentId:', err)
          }
        }

        // Se tiver redirectUrl, redirecionar para o checkout do LivePix
        if (redirectUrl) {
          console.log('Redirecionando para checkout LivePix:', {
            redirectUrl,
            orderId,
            paymentReference,
          })
          window.location.href = redirectUrl
          return
        }

        // Se não tiver redirectUrl mas tiver QR code, usar fluxo normal
        if (livepixPayment.status === 'pending' || livepixPayment.status === 'waiting_payment') {
          // Extrair payment_id do pagamento (usar reference)
          const paymentId = livepixPayment.reference || livepixPayment.id?.toString()

          if (isUpgrade) {
            // Para upgrades, redirecionar diretamente com parâmetros de upgrade
            if (paymentId) {
              navigate(`/payment/pix/${upgradeOrderId || 'upgrade'}?payment_id=${paymentId}&upgrade=ram&orderId=${upgradeOrderId}&ramMb=${upgradeRamMb}&gateway=livepix`)
            } else {
              navigate(`/payment/pix/upgrade?upgrade=ram&orderId=${upgradeOrderId}&ramMb=${upgradeRamMb}&gateway=livepix`)
            }
            return
          }

          // Atualizar pedido com paymentId se ainda não foi atualizado
          if (paymentId && orderId) {
            try {
              await updateOrder(orderId, { paymentId: paymentId })
              console.log(`✅ Pedido ${orderId} atualizado com paymentId: ${paymentId}`)
            } catch (err) {
              console.error('Erro ao atualizar pedido com paymentId:', err)
            }
          }

          // Redirecionar para página de pagamento Pix
          if (paymentId && orderId) {
            navigate(`/payment/pix/${orderId}?payment_id=${paymentId}&gateway=livepix`)
          } else if (orderId) {
            // Fallback: se não tiver payment_id, ainda redireciona mas sem ele
            navigate(`/payment/pix/${orderId}?gateway=livepix`)
          }
          return
        }
      } else if (settings?.paymentGateway === 'MercadoPago') {
        // Verificar se tem Access Token (obrigatório para processar pagamentos)
        if (!settings?.mercadoPagoAccessToken) {
          toast({
            title: 'Configuração incompleta',
            description: 'Access Token do Mercado Pago não configurado. Configure nas Configurações.',
            variant: 'destructive',
          })
          setIsProcessing(false)
          return
        }

        let accessToken = settings.mercadoPagoAccessToken?.trim()
        
        // Debug: verificar token (não logar o token completo por segurança)
        console.log('Access Token configurado:', {
          hasToken: !!accessToken,
          tokenLength: accessToken?.length || 0,
          tokenPrefix: accessToken?.substring(0, 10) || 'N/A',
        })
        
        // Validar formato do Access Token
        if (!accessToken || accessToken.length < 10) {
          toast({
            title: 'Access Token inválido',
            description: 'O Access Token parece estar vazio ou muito curto. Verifique nas Configurações.',
            variant: 'destructive',
          })
          setIsProcessing(false)
          return
        }

        // Validar token antes de usar (opcional, pode ser removido se muito lento)
        // const isValid = await validateAccessToken(accessToken)
        // if (!isValid) {
        //   toast({
        //     title: 'Access Token inválido',
        //     description: 'O Access Token não foi aceito pelo Mercado Pago. Verifique se está correto.',
        //     variant: 'destructive',
        //   })
        //   setIsProcessing(false)
        //   return
        // }

        if (values.paymentMethod === 'pix') {
          console.log('Iniciando pagamento Pix...', {
            product: selectedProduct.title,
            price: selectedProduct.price,
            email: values.email,
            name: values.name,
          })

          // Validar preço do produto
          if (!selectedProduct.price || selectedProduct.price <= 0) {
            throw new Error('Preço do produto inválido. Verifique o produto selecionado.')
          }

          console.log('Dados do pagamento Pix:', {
            transaction_amount: selectedProduct.price,
            description: selectedProduct.title,
            email: values.email,
            name: values.name,
          })

          // Determinar valor e descrição baseado em upgrade ou produto normal
          const amount = isUpgrade ? Number(upgradePrice) : Number(selectedProduct.price)
          const description = isUpgrade 
            ? `Upgrade de RAM: +${upgradeRamMb} MB`
            : selectedProduct.title

          // Processar pagamento Pix
          const pixPayment = await createPixPayment(accessToken, {
            transaction_amount: amount,
            description: description,
            payment_method_id: 'pix',
            payer: {
              email: values.email,
              first_name: values.name.split(' ')[0],
              last_name: values.name.split(' ').slice(1).join(' ') || values.name.split(' ')[0],
            },
          })

          console.log('Pagamento Pix criado com sucesso:', {
            id: pixPayment.id,
            status: pixPayment.status,
            hasQrCode: !!pixPayment.point_of_interaction?.transaction_data?.qr_code_base64,
          })

          if (pixPayment.status === 'pending' || pixPayment.status === 'in_process') {
            // Extrair payment_id do pagamento
            const paymentId = pixPayment.id?.toString()

            if (isUpgrade) {
              // Para upgrades, redirecionar diretamente com parâmetros de upgrade
              if (paymentId) {
                navigate(`/payment/pix/${upgradeOrderId || 'upgrade'}?payment_id=${paymentId}&upgrade=ram&orderId=${upgradeOrderId}&ramMb=${upgradeRamMb}`)
              } else {
                navigate(`/payment/pix/upgrade?upgrade=ram&orderId=${upgradeOrderId}&ramMb=${upgradeRamMb}`)
              }
              return
            }

            // Criar pedido com payment_id para rastreamento (produto normal)
            const newOrder = await createOrder({
              customerName: values.name,
              customerEmail: values.email,
              productId: selectedProduct.id,
              productName: selectedProduct.title,
              amount: selectedProduct.price,
              status: 'pending',
              paymentMethod: 'pix',
              paymentId: paymentId, // Salvar payment_id no pedido
              userId: user.userId || user.id, // Associar pedido ao usuário autenticado (UUID da tabela users)
            })

            // Redirecionar para página de pagamento Pix
            if (paymentId) {
              navigate(`/payment/pix/${newOrder.id}?payment_id=${paymentId}`)
            } else {
              // Fallback: se não tiver payment_id, ainda redireciona mas sem ele
              navigate(`/payment/pix/${newOrder.id}`)
            }
            return
          }
        } else if (values.paymentMethod === 'credit_card') {
          // Usar Checkout Pro do Mercado Pago (redirecionamento)
          const preferenceUrl = await createMercadoPagoPreference(accessToken, {
            title: selectedProduct.title,
            quantity: 1,
            unit_price: selectedProduct.price,
            email: values.email,
            name: values.name,
          })

          // Redirecionar para o checkout do Mercado Pago
          window.location.href = preferenceUrl
          return
        }
      }

      // Fallback: se Mercado Pago não estiver configurado ou houver erro de conexão
      // Criar pedido em modo de teste (sem processar pagamento real)
      console.warn('Usando modo de teste - pagamento não será processado')
      
      const newOrder = await createOrder({
        customerName: values.name,
        customerEmail: values.email,
        productId: selectedProduct.id,
        productName: selectedProduct.title,
        amount: selectedProduct.price,
        status: 'pending',
        paymentMethod: values.paymentMethod,
        userId: user.userId || user.id, // Associar pedido ao usuário autenticado (UUID da tabela users)
      })

      toast({
        title: 'Pedido criado (modo teste)',
        description: `Pedido #${newOrder.id} criado. Em produção, configure um backend para processar pagamentos.`,
        variant: 'default',
      })

      navigate('/')
    } catch (error: any) {
      console.error('Erro completo ao processar pagamento:', {
        error,
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
      })
      
      // Mensagem de erro mais específica
      let errorMessage = error?.message || 'Ocorreu um erro ao processar seu pagamento.'
      
      // Tratar diferentes tipos de erro
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch') || error.name === 'TypeError' || errorMessage.includes('backend')) {
        errorMessage = 'Erro de conexão com o backend.\n\nCertifique-se de que o servidor backend está rodando:\n\n1. Abra um terminal\n2. Execute: npm run server\n3. Aguarde a mensagem "Servidor backend rodando"\n4. Tente novamente'
      } else if (errorMessage.includes('Access Token inválido') || errorMessage.includes('invalid') || errorMessage.includes('expirado') || errorMessage.includes('unauthorized')) {
        errorMessage = 'Access Token do Mercado Pago inválido ou expirado.\n\nSolução:\n1. Acesse https://www.mercadopago.com.br/developers\n2. Vá em Suas integrações > Credenciais\n3. Gere um novo Access Token\n4. Cole nas Configurações do sistema'
      } else if (errorMessage.includes('Dados do pagamento inválidos')) {
        errorMessage = errorMessage // Manter a mensagem específica do erro
      } else if (errorMessage.includes('conexão') || errorMessage.includes('CORS')) {
        errorMessage = 'Erro de conexão ou CORS. A API do Mercado Pago pode bloquear requisições diretas do navegador. Configure um backend para processar pagamentos.'
      }
      
      toast({
        title: 'Erro na compra',
        description: errorMessage,
        variant: 'destructive',
        duration: 10000, // Mostrar por mais tempo para mensagens longas
      })
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (isStoreLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white flex-col gap-4">
        <h2 className="text-xl font-bold">Produto não encontrado</h2>
        <Button onClick={() => navigate('/')}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            className="mb-8 text-zinc-400 hover:text-white hover:bg-zinc-900 pl-0"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a loja
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Finalizar Compra</h1>
                <p className="text-zinc-400">
                  Preencha seus dados para concluir o pedido.
                </p>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <span className="bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        1
                      </span>
                      Informações Pessoais
                    </h2>
                    <Card className="bg-zinc-950 border-zinc-800">
                      <CardContent className="pt-6 space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-300">
                                Nome Completo
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Seu nome"
                                  {...field}
                                  className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600"
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
                              <FormLabel className="text-zinc-300">
                                Email
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="seu@email.com"
                                  {...field}
                                  className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <span className="bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        2
                      </span>
                      Pagamento
                    </h2>
                    <Card className="bg-zinc-950 border-zinc-800">
                      <CardContent className="pt-6 space-y-6">
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-zinc-300">
                                Método de Pagamento
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <FormItem className={`flex items-center space-x-3 space-y-0 rounded-md border p-4 transition-colors ${
                                    paymentMethod === 'credit_card' 
                                      ? 'border-green-500 bg-green-500/10' 
                                      : 'border-zinc-800 bg-zinc-900/30'
                                  }`}>
                                    <FormControl>
                                      <RadioGroupItem 
                                        value="credit_card" 
                                        className={paymentMethod === 'credit_card' ? 'border-green-500 text-green-500 data-[state=checked]:text-green-500' : ''}
                                      />
                                    </FormControl>
                                    <div className="flex-1 flex items-center justify-between">
                                      <FormLabel className="font-normal cursor-pointer flex items-center gap-2 text-zinc-200">
                                        <CreditCard className="w-4 h-4" />
                                        Cartão de Crédito
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                  <FormItem className={`flex items-center space-x-3 space-y-0 rounded-md border p-4 transition-colors ${
                                    paymentMethod === 'pix' 
                                      ? 'border-green-500 bg-green-500/10' 
                                      : 'border-zinc-800 bg-zinc-900/30'
                                  }`}>
                                    <FormControl>
                                      <RadioGroupItem 
                                        value="pix" 
                                        className={paymentMethod === 'pix' ? 'border-green-500 text-green-500 data-[state=checked]:text-green-500' : ''}
                                      />
                                    </FormControl>
                                    <div className="flex-1 flex items-center justify-between">
                                      <FormLabel className="font-normal cursor-pointer flex items-center gap-2 text-zinc-200">
                                        <QrCode className="w-4 h-4" />
                                        Pix
                                      </FormLabel>
                                      <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded font-medium">
                                        Aprovação Imediata
                                      </span>
                                    </div>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {paymentMethod === 'credit_card' && (
                          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <FormField
                              control={form.control}
                              name="cardNumber"
                              render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormLabel className="text-zinc-300">
                                    Número do Cartão
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="0000 0000 0000 0000"
                                      {...field}
                                      className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="cardExpiry"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-zinc-300">
                                    Validade
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="MM/AA"
                                      {...field}
                                      className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="cardCvc"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-zinc-300">
                                    CVC
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="123"
                                      maxLength={3}
                                      {...field}
                                      className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-bold text-lg rounded-xl"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Confirmar Compra'
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    Pagamento 100% seguro e criptografado
                  </div>
                </form>
              </Form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                  <CardHeader className="bg-zinc-900/50 border-b border-zinc-800 pb-6">
                    <CardTitle className="text-white flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Resumo do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-bold text-white">
                            {selectedProduct.title}
                          </h3>
                          <p className="text-sm text-zinc-400 mt-1">
                            {selectedProduct.description}
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-zinc-800" />

                      <div className="space-y-2">
                        {selectedProduct.features.map((feature, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm text-zinc-300"
                          >
                            <Check className="w-4 h-4 text-green-500 shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-zinc-900/30 border-t border-zinc-800 py-6">
                    <div className="w-full flex items-center justify-between">
                      <span className="text-zinc-400">Total a pagar</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-white">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(selectedProduct.price)}
                        </span>
                        <span className="block text-xs text-zinc-500">
                          /mês
                        </span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>

                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                  <p className="text-sm text-blue-200 text-center">
                    Após a confirmação, você receberá um email com as instruções
                    de acesso imediato.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
