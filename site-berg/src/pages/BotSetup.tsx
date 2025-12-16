import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Bot,
  Server,
  User,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Copy,
  Wifi,
  WifiOff,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/stores/main'
import { useAuth } from '@/stores/auth'
import { api } from '@/lib/api'

const formSchema = z.object({
  botToken: z.string().min(10, { message: 'Token do bot inválido.' }),
  serverId: z.string().min(10, { message: 'ID do servidor (guild) inválido.' }),
  serverName: z.string().min(1, { message: 'Nome do servidor é obrigatório.' }),
  ownerId: z.string().min(10, { message: 'ID do dono inválido.' }),
})

export default function BotSetup() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { orders, updateOrder, isLoading: isStoreLoading, refreshData } = useAppStore()
  const { isAdmin } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingOrder, setIsCheckingOrder] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const hasCheckedRef = useRef<string | null>(null)

  const order = orders.find((o) => o.id === orderId)
  
  // Se o bot já está configurado e o usuário não é admin, redirecionar para status
  useEffect(() => {
    if (order && order.botToken && !isAdmin) {
      navigate(`/bot-status/${orderId}`, { replace: true })
    }
  }, [order, isAdmin, orderId, navigate])

  // Recarregar dados quando a página carregar ou quando orderId mudar
  useEffect(() => {
    // Se já verificamos este orderId, não verificar novamente
    if (hasCheckedRef.current === orderId) {
      setIsCheckingOrder(false)
      return
    }

    if (!orderId) {
      setIsCheckingOrder(false)
      return
    }

    let isMounted = true

    const loadOrder = async () => {
      hasCheckedRef.current = orderId
      setIsCheckingOrder(true)
      
      try {
        // Recarregar dados uma vez
        await refreshData()
      } catch (error) {
        console.error('Erro ao carregar pedido:', error)
      } finally {
        // Sempre parar o loading após tentar carregar
        if (isMounted) {
          setTimeout(() => {
            setIsCheckingOrder(false)
          }, 500)
        }
      }
    }
    
    loadOrder()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]) // Apenas orderId nas dependências - refreshData é estável

  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    if (isCheckingOrder) {
      const timeout = setTimeout(() => {
        setIsCheckingOrder(false)
      }, 5000) // Máximo 5 segundos
      return () => clearTimeout(timeout)
    }
  }, [isCheckingOrder])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      botToken: '',
      serverId: '',
      serverName: '',
      ownerId: '',
    },
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    // Populate form if data exists
    if (order) {
      if (order.botToken) form.setValue('botToken', order.botToken)
      if (order.serverId) form.setValue('serverId', order.serverId)
      if (order.ownerId) form.setValue('ownerId', order.ownerId)
      // serverName não está no order, sempre começar vazio
    }
  }, [order, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!orderId) return

    setIsSubmitting(true)
    try {
      // Primeiro, salvar as informações no pedido
      const startDate = new Date()
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + 1) // Adicionar 1 mês

      await updateOrder(orderId, {
        botToken: values.botToken,
        serverId: values.serverId,
        ownerId: values.ownerId,
        botStatus: 'waiting', // Mudar para 'waiting' enquanto envia
        subscriptionStartDate: startDate.toISOString(),
        subscriptionExpiryDate: expiryDate.toISOString(),
      })

      // Obter token da SquareCloud das configurações
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado. Entre em contato com o suporte.',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // Enviar bot para SquareCloud com as informações do usuário
      const { getApiUrl } = await import('@/lib/api-config')
      const backendUrl = getApiUrl()
      
      toast({
        title: 'Enviando bot...',
        description: 'Configurando e enviando seu bot para a SquareCloud. Isso pode levar alguns segundos.',
      })

      const response = await fetch(`${backendUrl}/api/orders/send-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          botToken: values.botToken,
          serverId: values.serverId,
          serverName: values.serverName,
          squarecloudToken: botSettings.squarecloudAccessToken,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao enviar bot para SquareCloud')
      }

      const result = await response.json()

      toast({
        title: 'Bot enviado com sucesso!',
        description: `Seu bot foi configurado e enviado para a SquareCloud. ID: ${result.applicationId}`,
      })

      // Recarregar dados para atualizar o status
      await refreshData()

      // Redirecionar para página de status do bot
      navigate(`/bot-status/${orderId}`)
    } catch (error: any) {
      console.error('Erro ao enviar bot:', error)
      toast({
        title: 'Erro ao enviar bot',
        description: error.message || 'Ocorreu um erro ao enviar o bot para a SquareCloud.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mostrar loading apenas se realmente estiver carregando
  if (isStoreLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white flex-col gap-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-zinc-400">Carregando informações do pedido...</p>
      </div>
    )
  }

  // Se está verificando, mostrar loading por tempo limitado
  if (isCheckingOrder) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white flex-col gap-4">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-zinc-400">Verificando pedido...</p>
      </div>
    )
  }

  // Se não encontrou o pedido após carregar tudo
  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white flex-col gap-4">
        <h2 className="text-xl font-bold">Pedido não encontrado</h2>
        <p className="text-zinc-400 text-center max-w-md">
          O pedido <strong>{orderId}</strong> não foi encontrado.
          <br />
          <br />
          Isso pode acontecer se o pedido ainda não foi criado ou se você não tem permissão para acessá-lo.
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              hasCheckedRef.current = null // Resetar para tentar novamente
              setIsCheckingOrder(true)
              await refreshData()
              setTimeout(() => {
                setIsCheckingOrder(false)
              }, 1000)
            }}
            className="bg-white text-black hover:bg-zinc-200"
          >
            Tentar Novamente
          </Button>
          <Button variant="ghost" onClick={() => navigate('/my-bots')}>
            Meus Bots
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Voltar para loja
          </Button>
        </div>
      </div>
    )
  }

  // Verificar se o pedido foi aprovado
  if (order.status !== 'completed') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white flex-col gap-4">
        <h2 className="text-xl font-bold">Pagamento pendente</h2>
        <p className="text-zinc-400 text-center max-w-md">
          O pagamento ainda não foi aprovado. Status atual: <strong>{order.status}</strong>.
          <br />
          <br />
          Se você já pagou, aguarde alguns segundos ou clique em "Verificar Novamente".
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              hasCheckedRef.current = null
              setIsCheckingOrder(true)
              await refreshData()
              setTimeout(() => {
                setIsCheckingOrder(false)
              }, 1000)
            }}
            className="bg-white text-black hover:bg-zinc-200"
          >
            Verificar Novamente
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Voltar para loja
          </Button>
        </div>
      </div>
    )
  }

  // Se o bot já está configurado e o usuário é admin, mostrar detalhes e opção de mudar status
  if (order.botToken && isAdmin) {
    const getBotStatusBadge = () => {
      if (!order.botStatus) return null
      
      switch (order.botStatus) {
        case 'waiting':
          return (
            <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-900">
              Aguardando
            </Badge>
          )
        case 'hosted':
          return (
            <Badge className="bg-blue-900/30 text-blue-400 border-blue-900">
              Hospedado
            </Badge>
          )
        case 'active':
          return (
            <Badge className="bg-green-900/30 text-green-400 border-green-900">
              Ativo
            </Badge>
          )
        case 'inactive':
          return (
            <Badge className="bg-red-900/30 text-red-400 border-red-900">
              Inativo
            </Badge>
          )
        case 'online':
          return (
            <Badge className="bg-green-900/30 text-green-400 border-green-900 flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Online
            </Badge>
          )
        case 'offline':
          return (
            <Badge className="bg-red-900/30 text-red-400 border-red-900 flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              Offline
            </Badge>
          )
        case 'invalid_data':
          return (
            <Badge className="bg-orange-900/30 text-orange-400 border-orange-900 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Dados Inválidos
            </Badge>
          )
        default:
          return null
      }
    }

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'waiting':
          return 'Aguardando'
        case 'hosted':
          return 'Hospedado'
        case 'active':
          return 'Ativo'
        case 'inactive':
          return 'Inativo'
        case 'online':
          return 'Online'
        case 'offline':
          return 'Offline'
        case 'invalid_data':
          return 'Dados Inválidos'
        default:
          return status
      }
    }

    const handleBotStatusChange = async (newStatus: string) => {
      if (!orderId) return

      // Não fazer nada se o status for o mesmo
      if (order.botStatus === newStatus) {
        return
      }

      // Prevenir múltiplas atualizações simultâneas
      if (isUpdatingStatus) {
        return
      }

      setIsUpdatingStatus(true)
      try {
        await updateOrder(orderId, { botStatus: newStatus as any })
        toast({
          title: 'Status atualizado',
          description: `Status do bot alterado para ${getStatusLabel(newStatus)}.`,
        })
      } catch (error: any) {
        console.error('❌ Erro ao atualizar status do bot:', error)
        toast({
          title: 'Erro',
          description: error?.message || 'Não foi possível atualizar o status do bot.',
          variant: 'destructive',
        })
      } finally {
        setTimeout(() => {
          setIsUpdatingStatus(false)
        }, 100)
      }
    }

    const handleCopy = (text: string, label: string) => {
      navigator.clipboard.writeText(text)
      toast({
        title: 'Copiado!',
        description: `${label} copiado para a área de transferência.`,
      })
    }

    return (
      <div className="min-h-screen bg-black pt-24 pb-12 text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12 animate-fade-in-up">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-6">
                <Bot className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Detalhes do Bot
              </h1>
              <p className="text-zinc-400 text-lg">
                Visualize e gerencie as configurações do bot.
              </p>
            </div>

            <Card className="bg-zinc-950 border-zinc-800 shadow-2xl animate-fade-in-up delay-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Configuração do Bot
                  </CardTitle>
                  {getBotStatusBadge()}
                </div>
                <CardDescription className="text-zinc-400">
                  Bot já configurado pelo cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <Bot className="w-4 h-4" />
                    Token do Bot
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-mono text-xs truncate flex-1 bg-zinc-900/50 p-2 rounded border border-zinc-800">
                      {order.botToken.substring(0, 20)}...
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(order.botToken!, 'Token')}
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-300"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {order.serverId && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Server className="w-4 h-4" />
                      ID do Servidor
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono text-sm bg-zinc-900/50 p-2 rounded border border-zinc-800 flex-1">
                        {order.serverId}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(order.serverId!, 'Server ID')}
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-300"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {order.ownerId && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <User className="w-4 h-4" />
                      ID do Dono
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono text-sm bg-zinc-900/50 p-2 rounded border border-zinc-800 flex-1">
                        {order.ownerId}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(order.ownerId!, 'Owner ID')}
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-300"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800">
                  <label className="text-sm text-zinc-400 mb-2 block">
                    Status do Bot (Admin)
                  </label>
                  <Select
                    value={order.botStatus || 'waiting'}
                    onValueChange={handleBotStatusChange}
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="waiting">Aguardando</SelectItem>
                      <SelectItem value="hosted">Hospedado</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="invalid_data">Dados Inválidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/bot-status/${orderId}`)}
                    className="flex-1 border-zinc-800 text-white hover:bg-zinc-900"
                  >
                    Ver Status Completo
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/admin')}
                    className="border-zinc-800 text-zinc-400 hover:text-white"
                  >
                    Voltar ao Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Pagamento Aprovado!
            </h1>
            <p className="text-zinc-400 text-lg">
              Agora precisamos configurar o seu{' '}
              <strong>{order.productName}</strong>.
              <br />
              Por favor, preencha as informações abaixo.
            </p>
          </div>

          <Card className="bg-zinc-950 border-zinc-800 shadow-2xl animate-fade-in-up delay-100">
            <CardHeader>
              <CardTitle className="text-white">
                Dados de Configuração
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Essas informações são necessárias para integrar o bot ao seu
                servidor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="botToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300 flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          Token do Bot
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Insira o token do seu bot"
                            {...field}
                            className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 font-mono"
                            type="password"
                          />
                        </FormControl>
                        <FormDescription className="text-zinc-500 text-xs">
                          Você encontra isso no Portal do Desenvolvedor do
                          Discord.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serverName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-300 flex items-center gap-2">
                          <Server className="w-4 h-4" />
                          Nome do Servidor
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Meu Servidor Discord"
                            {...field}
                            className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600"
                          />
                        </FormControl>
                        <FormDescription className="text-zinc-500 text-xs">
                          Este será o nome da aplicação na SquareCloud
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="serverId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300 flex items-center gap-2">
                            <Server className="w-4 h-4" />
                            ID do Servidor (Guild)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000000000000000000"
                              {...field}
                              className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ownerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            ID do Dono
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000000000000000000"
                              {...field}
                              className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold text-lg rounded-xl"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar e Ativar'
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    Seus dados estão seguros e criptografados
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
