import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Loader2, AlertCircle, ArrowRight, Clock, CheckCircle2, PlayCircle, PauseCircle, RefreshCw, MoreVertical, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/stores/main'
import { useAuth } from '@/stores/auth'
import { format, differenceInDays, differenceInHours, differenceInMinutes, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { api } from '@/lib/api'

interface SquareCloudBot {
  id: string
  name: string
  description?: string
  avatar?: string
  cluster: string
  ram: number
  lang: string
  type: string
  status?: 'running' | 'stopped'
  statusInfo?: {
    status: 'running' | 'stopped'
    running: boolean
    cpu?: number
    ram?: number
  }
}

export default function MyBots() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { orders, isLoading: isStoreLoading, refreshData } = useAppStore()
  const { user, isAuthenticated } = useAuth()
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [squareCloudBots, setSquareCloudBots] = useState<SquareCloudBot[]>([])
  const [isLoadingBots, setIsLoadingBots] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [controllingBot, setControllingBot] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    
    if (!isAuthenticated || !user) {
      navigate('/login')
      return
    }

    // Buscar bots da SquareCloud
    const loadSquareCloudBots = async () => {
      try {
        setIsLoadingBots(true)
        const botSettings = await api.getBotSettings()
        if (botSettings.squarecloudAccessToken) {
          const bots = await api.getSquareCloudBots(botSettings.squarecloudAccessToken)
          
          // Buscar status de cada bot
          const botsWithStatus = await Promise.all(
            (bots || []).map(async (bot) => {
              try {
                const status = await api.getSquareCloudBotStatus(bot.id, botSettings.squarecloudAccessToken)
                console.log(`Status do bot ${bot.id}:`, status)
                // A API retorna: { status: 'running' | 'stopped', running: boolean, cpu, ram, ... }
                const isRunning = status?.status === 'running' || status?.running === true
                
                // Converter CPU de string (ex: "0%") para número
                let cpuValue = 0
                if (status?.cpu != null) {
                  if (typeof status.cpu === 'number') {
                    cpuValue = status.cpu
                  } else if (typeof status.cpu === 'string') {
                    // Remove o % e converte para número
                    cpuValue = parseFloat(status.cpu.replace('%', '')) || 0
                  }
                }
                
                // Converter RAM de string (ex: "41.23MB") para número em MB
                let ramValue = 0
                if (status?.ram != null) {
                  if (typeof status.ram === 'number') {
                    ramValue = status.ram
                  } else if (typeof status.ram === 'string') {
                    // Remove "MB" e converte para número
                    const ramStr = status.ram.replace(/MB/i, '').trim()
                    ramValue = parseFloat(ramStr) || 0
                  }
                }
                
                return {
                  ...bot,
                  status: isRunning ? 'running' : 'stopped',
                  statusInfo: {
                    ...status,
                    cpu: cpuValue,
                    ram: ramValue,
                  }
                }
              } catch (error) {
                console.error(`Erro ao buscar status do bot ${bot.id}:`, error)
                return {
                  ...bot,
                  status: 'stopped' as const,
                  statusInfo: { 
                    status: 'stopped' as const, 
                    running: false,
                    cpu: 0,
                    ram: 0
                  }
                }
              }
            })
          )
          
          console.log('Bots com status:', botsWithStatus)
          setSquareCloudBots(botsWithStatus)
        }
      } catch (error: any) {
        console.error('Erro ao carregar bots da SquareCloud:', error)
        toast({
          title: 'Aviso',
          description: 'Não foi possível carregar bots da SquareCloud. Verifique se o token está configurado.',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingBots(false)
      }
    }

    loadSquareCloudBots()

    // Filtrar pedidos do usuário atual (por userId UUID ou email como fallback)
    // Mostrar todos os pedidos completed ou pending do usuário, mesmo sem botToken configurado
    const filtered = orders.filter(
      (order) => {
        // Verificar por userId (UUID da tabela users) - prioridade
        if (order.userId) {
          const userUuid = user.userId || user.id
          if (order.userId === userUuid) {
            return true
          }
        }
        // Fallback: verificar por email e status (completed ou pending)
        // Isso cobre pedidos antigos que não têm userId
        if (order.customerEmail && user.email) {
          const emailMatch = order.customerEmail.toLowerCase().trim() === user.email.toLowerCase().trim()
          if (emailMatch && (order.status === 'completed' || order.status === 'pending')) {
            return true
          }
        }
        return false
      }
    )
    console.log('🔍 Filtrando pedidos:', {
      totalOrders: orders.length,
      userEmail: user.email,
      userId: user.userId || user.id,
      filteredCount: filtered.length,
      filteredOrders: filtered.map(o => ({
        id: o.id,
        email: o.customerEmail,
        status: o.status,
        userId: o.userId,
        hasBotToken: !!o.botToken
      }))
    })
    setUserOrders(filtered)
  }, [orders, user, isAuthenticated, navigate, toast])

  // Filtrar bots que precisam de renovação (expirados ou próximos de expirar)
  const getBotsNeedingRenewal = () => {
    return userOrders.filter((order) => {
      if (!order.subscriptionExpiryDate) return false
      const expiry = new Date(order.subscriptionExpiryDate)
      const now = new Date()
      const daysUntilExpiry = differenceInDays(expiry, now)
      // Mostrar bots expirados ou que expiram em 7 dias ou menos
      return !isAfter(expiry, now) || daysUntilExpiry <= 7
    })
  }

  const botsNeedingRenewal = getBotsNeedingRenewal()
  const activeBots = userOrders.filter((order) => {
    if (!order.subscriptionExpiryDate) return false
    const expiry = new Date(order.subscriptionExpiryDate)
    const now = new Date()
    return isAfter(expiry, now)
  })

  // Removido refreshData automático para evitar loops infinitos
  // Os dados são carregados quando o componente monta através do AppProvider

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-900/30 text-green-400 border-green-900 flex items-center gap-1">
            <PlayCircle className="w-3 h-3" />
            Ativo
          </Badge>
        )
      case 'hosted':
        return (
          <Badge className="bg-blue-900/30 text-blue-400 border-blue-900 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Hospedado
          </Badge>
        )
      case 'inactive':
        return (
          <Badge className="bg-red-900/30 text-red-400 border-red-900 flex items-center gap-1">
            <PauseCircle className="w-3 h-3" />
            Inativo
          </Badge>
        )
      case 'waiting':
      default:
        return (
          <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-900 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Aguardando
          </Badge>
        )
    }
  }

  const getTimeRemaining = (expiryDate?: string) => {
    if (!expiryDate) return null

    const expiry = new Date(expiryDate)
    const now = new Date()

    if (!isAfter(expiry, now)) {
      return { expired: true, text: 'Expirado' }
    }

    const days = differenceInDays(expiry, now)
    const hours = differenceInHours(expiry, now) % 24
    const minutes = differenceInMinutes(expiry, now) % 60

    if (days > 0) {
      return { expired: false, text: `${days} dia${days > 1 ? 's' : ''} restante${days > 1 ? 's' : ''}` }
    } else if (hours > 0) {
      return { expired: false, text: `${hours} hora${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}` }
    } else {
      return { expired: false, text: `${minutes} minuto${minutes > 1 ? 's' : ''} restante${minutes > 1 ? 's' : ''}` }
    }
  }

  const handleRenewSubscription = (order: any) => {
    // Navegar para checkout com o mesmo produto
    navigate(`/checkout?product=${order.productId}&renew=${order.id}`)
  }

  const handleControlBot = async (botId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      setControllingBot(botId)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      await api.controlSquareCloudBot(botId, action, botSettings.squarecloudAccessToken)
      
      toast({
        title: 'Sucesso',
        description: `Bot ${action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado'} com sucesso!`,
      })

      // Recarregar bots para atualizar status
      const bots = await api.getSquareCloudBots(botSettings.squarecloudAccessToken)
      const botsWithStatus = await Promise.all(
        (bots || []).map(async (bot) => {
          try {
            const status = await api.getSquareCloudBotStatus(bot.id, botSettings.squarecloudAccessToken)
            const isRunning = status?.status === 'running' || status?.running === true
            return {
              ...bot,
              status: isRunning ? 'running' : 'stopped',
              statusInfo: status
            }
          } catch (error) {
            console.error(`Erro ao buscar status do bot ${bot.id}:`, error)
            return {
              ...bot,
              status: 'stopped' as const,
              statusInfo: { status: 'stopped' as const, running: false }
            }
          }
        })
      )
      setSquareCloudBots(botsWithStatus)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Não foi possível ${action} o bot.`,
        variant: 'destructive',
      })
    } finally {
      setControllingBot(null)
    }
  }

  const getLangBadge = (lang: string) => {
    const langUpper = lang.toUpperCase()
    if (langUpper.includes('PYTHON') || langUpper === 'PY') return 'PY'
    if (langUpper.includes('NODE') || langUpper.includes('JS') || langUpper === 'JS') return 'JS'
    if (langUpper.includes('JAVA')) return 'JAVA'
    return langUpper.substring(0, 2)
  }

  // Combinar bots da SquareCloud com pedidos
  const allBots = [
    ...userOrders.map(order => ({
      id: order.id,
      name: order.productName,
      squareCloudId: order.botServiceId,
      status: order.botStatus,
      order: order,
      type: 'order' as const,
    })),
    ...squareCloudBots.map(bot => ({
      id: bot.id,
      name: bot.name,
      squareCloudId: bot.id,
      status: bot.status === 'running' ? 'active' : 'inactive',
      bot: bot,
      type: 'squarecloud' as const,
    })),
  ]

  const handleBotClick = (botItem: typeof allBots[0]) => {
    if (botItem.type === 'order' && botItem.order) {
      // Se tiver botServiceId (ID da SquareCloud), ir para database, senão para status
      if (botItem.order.botServiceId) {
        navigate(`/bot-database/${botItem.order.botServiceId}`)
      } else {
        navigate(`/bot-status/${botItem.order.id}`)
      }
    } else if (botItem.type === 'squarecloud' && botItem.squareCloudId) {
      // Navegar para a página de database do bot (rota pública)
      navigate(`/bot-database/${botItem.squareCloudId}`)
    }
  }

  if (isStoreLoading || isLoadingBots) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Meus Bots</h1>
              <p className="text-zinc-400">
                Gerencie e acompanhe o status dos seus bots
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-zinc-400 hover:text-white"
            >
              Voltar
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-zinc-900 border-zinc-800">
              <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800">
                Todos ({allBots.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-zinc-800">
                Ativos ({activeBots.length + squareCloudBots.filter(b => b.status === 'running').length})
              </TabsTrigger>
              <TabsTrigger value="renew" className="data-[state=active]:bg-zinc-800">
                Renovar ({botsNeedingRenewal.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {allBots.length === 0 ? (
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="pt-6">
                <div className="text-center space-y-4 py-12">
                  <AlertCircle className="w-16 h-16 text-zinc-400 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Nenhum bot encontrado
                    </h3>
                    <p className="text-zinc-400 mb-6">
                      Você ainda não possui bots configurados. Faça uma compra para começar!
                    </p>
                    <Button
                      onClick={() => navigate('/')}
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      Ver Produtos
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allBots.map((botItem) => {
                    if (botItem.type === 'order' && botItem.order) {
                      const order = botItem.order
                      return (
                        <Card
                          key={order.id}
                          className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                          onClick={() => handleBotClick(botItem)}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-blue-500" />
                                <CardTitle className="text-white text-lg">
                                  {order.productName}
                                </CardTitle>
                              </div>
                              {getStatusBadge(order.botStatus)}
                            </div>
                            <CardDescription className="text-zinc-400 text-xs">
                              Pedido #{order.id}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-zinc-500 mb-1">Data</p>
                                <p className="text-sm text-zinc-300">
                                  {format(new Date(order.date), 'dd/MM/yyyy', {
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-zinc-500 mb-1">Valor</p>
                                <p className="text-sm font-semibold text-white">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(order.amount)}
                                </p>
                              </div>
                              {order.subscriptionExpiryDate && (
                                <div>
                                  <p className="text-xs text-zinc-500 mb-1">Tempo Restante</p>
                                  {(() => {
                                    const timeRemaining = getTimeRemaining(order.subscriptionExpiryDate)
                                    if (!timeRemaining) return null
                                    return (
                                      <p className={`text-sm font-semibold ${
                                        timeRemaining.expired 
                                          ? 'text-red-400' 
                                          : timeRemaining.text.includes('dia') && parseInt(timeRemaining.text) <= 7
                                            ? 'text-yellow-400'
                                            : 'text-green-400'
                                      }`}>
                                        {timeRemaining.text}
                                      </p>
                                    )
                                  })()}
                                </div>
                              )}
                              <div className="pt-2 border-t border-zinc-800 space-y-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBotClick(botItem)
                                  }}
                                >
                                  Ver Detalhes
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                                {order.subscriptionExpiryDate && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-white border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRenewSubscription(order)
                                    }}
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Renovar Assinatura
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    } else if (botItem.type === 'squarecloud' && botItem.bot) {
                      const bot = botItem.bot
                      const isRunning = bot.status === 'running' || bot.statusInfo?.running
                      const ramValue = typeof bot.ram === 'number' ? bot.ram : parseInt(String(bot.ram || 0))
                      // Garantir que ramUsed e cpuUsed sejam números válidos
                      const ramUsed = bot.statusInfo?.ram != null && typeof bot.statusInfo.ram === 'number' 
                        ? Math.round(bot.statusInfo.ram) 
                        : 0
                      const cpuUsed = bot.statusInfo?.cpu != null && typeof bot.statusInfo.cpu === 'number'
                        ? bot.statusInfo.cpu
                        : 0
                      const isControlling = controllingBot === bot.id
                      
                      return (
                        <Card
                          key={bot.id}
                          className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                          onClick={() => handleBotClick(botItem)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileCode className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-white text-lg mb-1">
                                    {bot.name}
                                  </CardTitle>
                                </div>
                              </div>
                              <MoreVertical 
                                className="w-5 h-5 text-zinc-400 cursor-pointer hover:text-zinc-300 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <CardDescription className="text-zinc-500 text-xs font-mono break-all">
                              {bot.id}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Status Badges */}
                            <div className="flex items-center gap-2">
                              {isRunning ? (
                                <Badge className="bg-green-500 text-white border-0 px-3 py-1 rounded-md font-semibold">
                                  ONLINE
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500 text-white border-0 px-3 py-1 rounded-md font-semibold">
                                  OFFLINE
                                </Badge>
                              )}
                              <Badge className="bg-zinc-800 text-zinc-300 border-0 px-3 py-1 rounded-md font-semibold">
                                {getLangBadge(bot.lang)}
                              </Badge>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex gap-2">
                              {isRunning ? (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="flex-1 bg-white text-black hover:bg-zinc-200 border border-zinc-300"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleControlBot(bot.id, 'stop')
                                    }}
                                    disabled={isControlling}
                                  >
                                    <PauseCircle className="w-4 h-4 mr-2" />
                                    {isControlling ? 'Processando...' : 'Parar'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-white text-white hover:bg-zinc-800 hover:text-white"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleControlBot(bot.id, 'restart')
                                    }}
                                    disabled={isControlling}
                                  >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${isControlling ? 'animate-spin' : ''}`} />
                                    Reiniciar
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="flex-1 bg-white text-black hover:bg-zinc-200 border border-zinc-300"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleControlBot(bot.id, 'start')
                                  }}
                                  disabled={isControlling}
                                >
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  {isControlling ? 'Processando...' : 'Iniciar'}
                                </Button>
                              )}
                            </div>

                            {/* Resource Usage */}
                            <div className="space-y-2 pt-2 border-t border-zinc-800">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded bg-zinc-700"></div>
                                  <span className="text-sm text-zinc-400">CPU</span>
                                </div>
                                <span className="text-sm font-semibold text-white">
                                  {cpuUsed.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded bg-zinc-700"></div>
                                  <span className="text-sm text-zinc-400">RAM</span>
                                </div>
                                <span className="text-sm font-semibold text-white">
                                  {ramUsed} MB / {ramValue} MB
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              {activeBots.length === 0 ? (
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4 py-12">
                      <CheckCircle2 className="w-16 h-16 text-zinc-400 mx-auto" />
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Nenhum bot ativo
                        </h3>
                        <p className="text-zinc-400">
                          Você não possui bots com assinatura ativa no momento.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeBots.map((order) => (
                    <Card
                      key={order.id}
                      className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                      onClick={() => navigate(`/bot-status/${order.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-blue-500" />
                            <CardTitle className="text-white text-lg">
                              {order.productName}
                            </CardTitle>
                          </div>
                          {getStatusBadge(order.botStatus)}
                        </div>
                        <CardDescription className="text-zinc-400 text-xs">
                          Pedido #{order.id}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Data</p>
                            <p className="text-sm text-zinc-300">
                              {format(new Date(order.date), 'dd/MM/yyyy', {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Valor</p>
                            <p className="text-sm font-semibold text-white">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(order.amount)}
                            </p>
                          </div>
                          {order.subscriptionExpiryDate && (
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Tempo Restante</p>
                              {(() => {
                                const timeRemaining = getTimeRemaining(order.subscriptionExpiryDate)
                                if (!timeRemaining) return null
                                return (
                                  <p className={`text-sm font-semibold ${
                                    timeRemaining.expired 
                                      ? 'text-red-400' 
                                      : timeRemaining.text.includes('dia') && parseInt(timeRemaining.text) <= 7
                                        ? 'text-yellow-400'
                                        : 'text-green-400'
                                  }`}>
                                    {timeRemaining.text}
                                  </p>
                                )
                              })()}
                            </div>
                          )}
                          <div className="pt-2 border-t border-zinc-800 space-y-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (order.botServiceId) {
                                  navigate(`/admin/bot-database/${order.botServiceId}`)
                                } else {
                                  navigate(`/bot-status/${order.id}`)
                                }
                              }}
                            >
                              Ver Detalhes
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            {order.subscriptionExpiryDate && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-white border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRenewSubscription(order)
                                }}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Renovar Assinatura
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="renew" className="mt-6">
              {botsNeedingRenewal.length === 0 ? (
                <Card className="bg-zinc-950 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4 py-12">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Nenhuma renovação necessária
                        </h3>
                        <p className="text-zinc-400">
                          Todos os seus bots estão com assinatura válida!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-yellow-400 mb-1">
                          Renovação Necessária
                        </h3>
                        <p className="text-sm text-zinc-400">
                          Você tem {botsNeedingRenewal.length} bot{botsNeedingRenewal.length > 1 ? 's' : ''} que {botsNeedingRenewal.length > 1 ? 'precisam' : 'precisa'} de renovação. Renove agora para continuar usando.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {botsNeedingRenewal.map((order) => {
                      const timeRemaining = getTimeRemaining(order.subscriptionExpiryDate)
                      return (
                        <Card
                          key={order.id}
                          className={`bg-zinc-950 border-2 ${
                            timeRemaining?.expired 
                              ? 'border-red-800 hover:border-red-700' 
                              : 'border-yellow-800 hover:border-yellow-700'
                          } transition-colors`}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-blue-500" />
                                <CardTitle className="text-white text-lg">
                                  {order.productName}
                                </CardTitle>
                              </div>
                              {getStatusBadge(order.botStatus)}
                            </div>
                            <CardDescription className="text-zinc-400 text-xs">
                              Pedido #{order.id}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {order.subscriptionExpiryDate && (
                                <div>
                                  <p className="text-xs text-zinc-500 mb-1">Status da Assinatura</p>
                                  <Badge 
                                    className={
                                      timeRemaining?.expired
                                        ? 'bg-red-900/30 text-red-400 border-red-900'
                                        : 'bg-yellow-900/30 text-yellow-400 border-yellow-900'
                                    }
                                  >
                                    {timeRemaining?.expired ? 'Expirado' : timeRemaining?.text}
                                  </Badge>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-zinc-500 mb-1">Valor da Renovação</p>
                                <p className="text-sm font-semibold text-white">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(order.amount)}
                                </p>
                              </div>
                              <div className="pt-2 border-t border-zinc-800 space-y-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-white border-white hover:bg-white hover:text-black font-semibold"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRenewSubscription(order)
                                  }}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Renovar Agora
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (order.botServiceId) {
                                      navigate(`/admin/bot-database/${order.botServiceId}`)
                                    } else {
                                      navigate(`/bot-status/${order.id}`)
                                    }
                                  }}
                                >
                                  Ver Detalhes
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

