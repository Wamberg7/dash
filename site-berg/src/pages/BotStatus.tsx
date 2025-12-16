import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Bot,
  Server,
  User,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Wifi,
  WifiOff,
  AlertTriangle,
  Cpu,
  HardDrive,
  TrendingUp,
  Zap,
  Edit,
  Save,
  X,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/stores/main'
import { format, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatBytes, formatBytesPerSecond } from '@/lib/utils'
import { RamUpgradeOption } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAuth } from '@/stores/auth'
import { api } from '@/lib/api'
import { BotDatabaseStats } from '@/components/admin/BotDatabaseStats'

export default function BotStatus() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { orders, isLoading: isStoreLoading, updateOrder, refreshData } = useAppStore()
  const { user, isAdmin } = useAuth()
  const [showToken, setShowToken] = useState(false)
  const [isUpgradingRam, setIsUpgradingRam] = useState(false)
  const [showRamUpgradeDialog, setShowRamUpgradeDialog] = useState(false)
  const [squareCloudBot, setSquareCloudBot] = useState<any>(null)
  const [squareCloudStatus, setSquareCloudStatus] = useState<any>(null)
  const [isLoadingSquareCloud, setIsLoadingSquareCloud] = useState(false)
  const [botLogs, setBotLogs] = useState<string>('')
  const [showLogs, setShowLogs] = useState(false)
  const [isEditingExpiry, setIsEditingExpiry] = useState(false)
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [isUpdatingExpiry, setIsUpdatingExpiry] = useState(false)

  const isSquareCloudBot = orderId?.startsWith('squarecloud/')
  const squareCloudBotId = isSquareCloudBot ? orderId.replace('squarecloud/', '') : null
  const order = !isSquareCloudBot ? orders.find((o) => o.id === orderId) : null
  
  // Para bots da SquareCloud, tentar encontrar a ordem associada
  const associatedOrder = isSquareCloudBot && squareCloudBotId
    ? orders.find((o) => o.botServiceId === squareCloudBotId)
    : order

  // Opções de upgrade de RAM (preço por MB adicional)
  const ramUpgradeOptions: RamUpgradeOption[] = [
    { ramMb: 256, price: 5.0, label: '+256 MB' },
    { ramMb: 512, price: 9.0, label: '+512 MB' },
    { ramMb: 1024, price: 15.0, label: '+1 GB' },
    { ramMb: 2048, price: 28.0, label: '+2 GB' },
    { ramMb: 4096, price: 50.0, label: '+4 GB' },
  ]

  // Valores iniciais baseados no order, serão atualizados quando dados da SquareCloud carregarem
  const currentRam = order?.botRamMb || 512
  const currentRamUsed = order?.botRamUsedMb || 0
  const ramUsagePercent = currentRam > 0 ? (currentRamUsed / currentRam) * 100 : 0
  const cpuPercent = order?.botCpuPercent || 0
  const networkTotalDown = order?.botNetworkTotalDown || 0
  const networkTotalUp = order?.botNetworkTotalUp || 0
  const networkCurrentDown = order?.botNetworkCurrentDown || 0
  const networkCurrentUp = order?.botNetworkCurrentUp || 0
  const serviceId = order?.botServiceId || order?.id?.substring(0, 32) || 'N/A'
  const cluster = order?.botCluster || 'VANDA-CLUSTER'
  const botName = order?.productName || 'Bot'
  const botStatus = order?.botStatus || 'waiting'
  const lastOnline = order?.subscriptionStartDate 
    ? formatDistanceToNow(new Date(order.subscriptionStartDate), { addSuffix: true, locale: ptBR })
    : 'Agora'

  const handleRamUpgrade = async (option: RamUpgradeOption) => {
    if (!order || !user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado para fazer upgrade.',
        variant: 'destructive',
      })
      return
    }

    setIsUpgradingRam(true)
    try {
      // Criar pedido de upgrade
      const upgradeAmount = option.price
      // Redirecionar para checkout com o upgrade
      navigate(`/checkout?upgrade=ram&orderId=${order.id}&ramMb=${option.ramMb}&price=${upgradeAmount}`)
    } catch (error) {
      console.error('Erro ao processar upgrade:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o upgrade. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsUpgradingRam(false)
      setShowRamUpgradeDialog(false)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const loadSquareCloudData = async () => {
      if (!isSquareCloudBot || !squareCloudBotId) return

      try {
        setIsLoadingSquareCloud(true)
        const botSettings = await api.getBotSettings()
        if (!botSettings.squarecloudAccessToken) {
          toast({
            title: 'Erro',
            description: 'Token da SquareCloud não configurado.',
            variant: 'destructive',
          })
          return
        }

        const [botInfo, status] = await Promise.all([
          api.getSquareCloudBotInfo(squareCloudBotId, botSettings.squarecloudAccessToken),
          api.getSquareCloudBotStatus(squareCloudBotId, botSettings.squarecloudAccessToken),
        ])

        setSquareCloudBot(botInfo)
        setSquareCloudStatus(status)
      } catch (error: any) {
        console.error('Erro ao carregar dados da SquareCloud:', error)
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível carregar dados do bot.',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingSquareCloud(false)
      }
    }

    loadSquareCloudData()
  }, [isSquareCloudBot, squareCloudBotId, toast])

  const handleLoadLogs = async () => {
    if (!isSquareCloudBot || !squareCloudBotId) return

    try {
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) return

      const logs = await api.getSquareCloudBotLogs(squareCloudBotId, botSettings.squarecloudAccessToken)
      setBotLogs(logs)
      setShowLogs(true)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os logs.',
        variant: 'destructive',
      })
    }
  }

  const handleControlBot = async (action: 'start' | 'stop' | 'restart') => {
    if (!isSquareCloudBot || !squareCloudBotId) return

    try {
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) return

      await api.controlSquareCloudBot(squareCloudBotId, action, botSettings.squarecloudAccessToken)
      
      toast({
        title: 'Sucesso',
        description: `Bot ${action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado'} com sucesso!`,
      })

      // Recarregar status
      const status = await api.getSquareCloudBotStatus(squareCloudBotId, botSettings.squarecloudAccessToken)
      setSquareCloudStatus(status)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Não foi possível ${action} o bot.`,
        variant: 'destructive',
      })
    }
  }

  // Variáveis derivadas que serão atualizadas quando os dados da SquareCloud carregarem
  const effectiveRam = squareCloudBot?.ram || currentRam
  const effectiveRamUsed = squareCloudStatus?.ram || currentRamUsed
  const effectiveCpu = squareCloudStatus?.cpu || cpuPercent
  const effectiveNetworkDown = squareCloudStatus?.network?.total?.input || networkTotalDown
  const effectiveNetworkUp = squareCloudStatus?.network?.total?.output || networkTotalUp
  const effectiveNetworkCurrentDown = squareCloudStatus?.network?.now?.input || networkCurrentDown
  const effectiveNetworkCurrentUp = squareCloudStatus?.network?.now?.output || networkCurrentUp
  const effectiveServiceId = squareCloudBot?.id || serviceId
  const effectiveCluster = squareCloudBot?.cluster || cluster
  const effectiveBotName = squareCloudBot?.name || botName
  const effectiveBotStatus = squareCloudStatus?.running ? 'active' : (squareCloudStatus ? 'inactive' : botStatus)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    })
  }

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

  const getStatusDescription = (status?: string) => {
    switch (status) {
      case 'active':
        return 'Seu bot está online e funcionando normalmente.'
      case 'hosted':
        return 'Seu bot foi hospedado e está sendo configurado.'
      case 'inactive':
        return 'Seu bot está offline ou foi desativado.'
      case 'online':
        return 'Seu bot está online e funcionando corretamente.'
      case 'offline':
        return 'Seu bot está offline. Entre em contato com o suporte se necessário.'
      case 'invalid_data':
        return 'Os dados fornecidos são inválidos. Por favor, verifique as configurações ou entre em contato com o suporte.'
      case 'waiting':
      default:
        return 'Aguardando configuração e hospedagem do bot.'
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

  // Inicializar data de expiração quando entrar em modo de edição
  useEffect(() => {
    if (isEditingExpiry && associatedOrder?.subscriptionExpiryDate) {
      const date = new Date(associatedOrder.subscriptionExpiryDate)
      const dateString = date.toISOString().split('T')[0]
      setNewExpiryDate(dateString)
    }
  }, [isEditingExpiry, associatedOrder?.subscriptionExpiryDate])

  const handleUpdateExpiry = async () => {
    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem editar a data de expiração.',
        variant: 'destructive',
      })
      return
    }

    if (!newExpiryDate || !associatedOrder) {
      toast({
        title: 'Data inválida',
        description: 'Por favor, selecione uma data válida.',
        variant: 'destructive',
      })
      return
    }

    setIsUpdatingExpiry(true)
    try {
      const expiryDateTime = new Date(newExpiryDate)
      expiryDateTime.setHours(23, 59, 59, 999) // Fim do dia

      await api.updateExpiryDate(associatedOrder.id, expiryDateTime.toISOString())
      
      toast({
        title: 'Data atualizada',
        description: `Data de expiração atualizada para ${format(expiryDateTime, 'dd/MM/yyyy', { locale: ptBR })}.`,
      })

      await refreshData()
      setIsEditingExpiry(false)
    } catch (error: any) {
      console.error('Erro ao atualizar data de expiração:', error)
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível atualizar a data de expiração.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdatingExpiry(false)
    }
  }

  if (isStoreLoading || isLoadingSquareCloud) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!order && !squareCloudBot) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white flex-col gap-4">
        <AlertCircle className="w-12 h-12 text-zinc-400" />
        <h2 className="text-xl font-bold">Bot não encontrado</h2>
        <Button onClick={() => navigate('/my-bots')}>Voltar para meus bots</Button>
      </div>
    )
  }

  const hasBotData = !!(order?.botToken && order?.serverId && order?.ownerId) || !!squareCloudBot

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 text-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Status do Bot</h1>
              <p className="text-zinc-400">
                Acompanhe o status e informações do seu bot
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

          {/* Status Card */}
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    {botName}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 mt-1">
                    {order ? `Pedido #${order.id}` : `SquareCloud • ${squareCloudBotId}`}
                  </CardDescription>
                </div>
                {getStatusBadge(effectiveBotStatus)}
              </div>
              {isSquareCloudBot && (
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleControlBot('start')}
                    disabled={squareCloudStatus?.running}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                  <Button
                    onClick={() => handleControlBot('stop')}
                    disabled={!squareCloudStatus?.running}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <PauseCircle className="w-4 h-4 mr-2" />
                    Parar
                  </Button>
                  <Button
                    onClick={() => handleControlBot('restart')}
                    disabled={!squareCloudStatus?.running}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-zinc-700 bg-transparent text-white hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reiniciar
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Status Atual</p>
                  <p className="text-white">{getStatusDescription(effectiveBotStatus)}</p>
                </div>

                <Separator className="bg-zinc-800" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order && (
                    <>
                      <div>
                        <p className="text-sm text-zinc-400 mb-1">Data do Pedido</p>
                        <p className="text-white">
                          {format(new Date(order.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400 mb-1">Status do Pagamento</p>
                        <Badge
                          className={
                            order.status === 'completed'
                              ? 'bg-green-900/30 text-green-400 border-green-900'
                              : order.status === 'failed'
                              ? 'bg-red-900/30 text-red-400 border-red-900'
                              : 'bg-yellow-900/30 text-yellow-400 border-yellow-900'
                          }
                        >
                          {order.status === 'completed'
                            ? 'Pagamento Aprovado'
                            : order.status === 'failed'
                            ? 'Falhou'
                            : 'Pendente'}
                        </Badge>
                      </div>
                    </>
                  )}
                  {isSquareCloudBot && squareCloudBot && (
                    <>
                      <div>
                        <p className="text-sm text-zinc-400 mb-1">Cluster</p>
                        <p className="text-white">{cluster}</p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400 mb-1">RAM Alocada</p>
                        <p className="text-white">{currentRam} MB</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Tempo de Expiração */}
                {associatedOrder?.subscriptionExpiryDate && (
                  <Separator className="bg-zinc-800" />
                )}
                {associatedOrder?.subscriptionExpiryDate && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Clock className="w-4 h-4" />
                        Tempo Restante
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isEditingExpiry) {
                              setIsEditingExpiry(false)
                              setNewExpiryDate('')
                            } else {
                              setIsEditingExpiry(true)
                            }
                          }}
                          className="h-7 text-xs text-zinc-400 hover:text-white"
                        >
                          {isEditingExpiry ? (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              Cancelar
                            </>
                          ) : (
                            <>
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {isEditingExpiry ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={newExpiryDate}
                            onChange={(e) => setNewExpiryDate(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-white flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={handleUpdateExpiry}
                            disabled={isUpdatingExpiry}
                            className="bg-white text-black hover:bg-zinc-200"
                          >
                            {isUpdatingExpiry ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-zinc-500">
                          Data atual: {format(new Date(associatedOrder.subscriptionExpiryDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(() => {
                          const timeRemaining = getTimeRemaining(associatedOrder.subscriptionExpiryDate)
                          if (!timeRemaining) return null
                          return (
                            <p className={`text-white font-medium ${
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
                        <p className="text-zinc-500 text-xs">
                          Expira em: {format(new Date(associatedOrder.subscriptionExpiryDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                        {associatedOrder.subscriptionStartDate && (
                          <p className="text-zinc-500 text-xs">
                            Início: {format(new Date(associatedOrder.subscriptionStartDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bot Resources Card - Similar à imagem */}
          {hasBotData && (isSquareCloudBot || order?.status === 'completed') && (
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{order.productName}</CardTitle>
                    <CardDescription className="text-zinc-400 mt-1">
                      {serviceId} • {cluster}
                    </CardDescription>
                    <CardDescription className="text-zinc-500 text-xs mt-1">
                      {order.productName.toLowerCase()} beacons
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-zinc-400">Online</span>
                    <span className="text-xs text-zinc-500">• {lastOnline}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CPU */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Cpu className="w-4 h-4" />
                      CPU
                    </div>
                    <span className="text-white font-medium">{effectiveCpu.toFixed(1)}%</span>
                  </div>
                  <Progress value={effectiveCpu} className="h-2" />
                </div>

                {/* RAM */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <HardDrive className="w-4 h-4" />
                      RAM
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {effectiveRamUsed.toFixed(2)}/{effectiveRam} MB
                      </span>
                      <Dialog open={showRamUpgradeDialog} onOpenChange={setShowRamUpgradeDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-blue-400 hover:text-blue-300"
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Upgrade
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                          <DialogHeader>
                            <DialogTitle>Upgrade de Memória RAM</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                              Escolha a quantidade adicional de RAM que deseja adicionar ao seu bot.
                              O upgrade será aplicado imediatamente após o pagamento.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 mt-4">
                            {ramUpgradeOptions.map((option) => (
                              <div
                                key={option.ramMb}
                                className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                              >
                                <div>
                                  <p className="text-white font-medium">{option.label}</p>
                                  <p className="text-zinc-400 text-xs">
                                    Total: {currentRam + option.ramMb} MB
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-white font-bold">
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(option.price)}
                                  </span>
                                  <Button
                                    onClick={() => handleRamUpgrade(option)}
                                    disabled={isUpgradingRam}
                                    className="bg-white text-black hover:bg-zinc-200"
                                    size="sm"
                                  >
                                    {isUpgradingRam ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processando...
                                      </>
                                    ) : (
                                      'Adicionar'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <Progress 
                    value={(effectiveRamUsed / effectiveRam) * 100} 
                    className={`h-2 ${
                      (effectiveRamUsed / effectiveRam) * 100 > 80 
                        ? 'bg-red-500' 
                        : (effectiveRamUsed / effectiveRam) * 100 > 60 
                        ? 'bg-yellow-500' 
                        : 'bg-blue-500'
                    }`}
                  />
                </div>

                <Separator className="bg-zinc-800" />

                {/* Network */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Network
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Total</p>
                      <p className="text-white text-sm">
                        {formatBytes(effectiveNetworkDown)} ↓ {formatBytes(effectiveNetworkUp)} ↑
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Agora</p>
                      <p className="text-white text-sm">
                        {formatBytesPerSecond(effectiveNetworkCurrentDown)} ↓{' '}
                        {formatBytesPerSecond(effectiveNetworkCurrentUp)} ↑
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Database Statistics para bots SquareCloud */}
          {isSquareCloudBot && squareCloudBotId && (
            <BotDatabaseStats appId={squareCloudBotId} />
          )}

          {/* Logs para bots SquareCloud */}
          {isSquareCloudBot && squareCloudBot && (
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Logs do Bot</CardTitle>
                <CardDescription className="text-zinc-400">
                  Visualize os logs em tempo real do bot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleLoadLogs}
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showLogs ? 'Ocultar Logs' : 'Ver Logs do Bot'}
                </Button>
                {showLogs && botLogs && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 max-h-96 overflow-auto">
                    <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
                      {botLogs}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Bot Data Card */}
          {hasBotData && order ? (
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Dados do Bot</CardTitle>
                <CardDescription className="text-zinc-400">
                  Informações de configuração do seu bot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bot Token */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-400 flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      Token do Bot
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowToken(!showToken)}
                        className="text-zinc-400 hover:text-white h-8"
                      >
                        {showToken ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => order.botToken && handleCopy(order.botToken, 'Token')}
                        className="text-zinc-400 hover:text-white h-8"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                    <p className="font-mono text-sm text-white break-all">
                      {showToken
                        ? order.botToken
                        : '•'.repeat(order.botToken?.length || 0)}
                    </p>
                  </div>
                </div>

                <Separator className="bg-zinc-800" />

                {/* Server ID */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-400 flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      ID do Servidor
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => order.serverId && handleCopy(order.serverId, 'ID do Servidor')}
                      className="text-zinc-400 hover:text-white h-8"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                    <p className="font-mono text-sm text-white">
                      {order.serverId}
                    </p>
                  </div>
                </div>

                <Separator className="bg-zinc-800" />

                {/* Owner ID */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-400 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      ID do Dono
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => order.ownerId && handleCopy(order.ownerId, 'ID do Dono')}
                      className="text-zinc-400 hover:text-white h-8"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                    <p className="font-mono text-sm text-white">
                      {order.ownerId}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Bot não configurado
                    </h3>
                    <p className="text-zinc-400 mb-4">
                      Você ainda não configurou os dados do bot. Configure agora para
                      começar a usar.
                    </p>
                    <Button
                      onClick={() => navigate(`/bot-setup/${order.id}`)}
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      Configurar Bot
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Info Card */}
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Nome</p>
                  <p className="text-white">{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Email</p>
                  <p className="text-white">{order.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Valor Pago</p>
                  <p className="text-white font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(order.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Método de Pagamento</p>
                  <p className="text-white capitalize">
                    {order.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

