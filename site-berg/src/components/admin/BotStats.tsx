import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Cpu,
  HardDrive,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Plus,
  MoreVertical,
  FileCode,
  Globe,
  Settings,
  Eye,
  PlayCircle,
  PauseCircle,
  FolderOpen,
  Trash2,
  Terminal,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/stores/main'
import { useAuth } from '@/stores/auth'
import { BotAppManager, getSavedAppIds } from './BotAppManager'
import { BotDatabaseViewer } from './BotDatabaseViewer'
import { format, differenceInDays, differenceInHours, differenceInMinutes, isAfter } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Edit, Save, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  subscriptionStartDate?: string
  subscriptionExpiryDate?: string
}

interface SquareCloudStatus {
  cpu: number
  ram: number
  status: string
  running: boolean
  storage: number
  network: {
    total: {
      input: number
      output: number
    }
    now: {
      input: number
      output: number
    }
  }
  uptime: number
  requests: number
}

interface User {
  id: string
  discord_id: string
  username: string
  email: string | null
}

export function BotStats() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { orders, refreshData } = useAppStore()
  const { isAdmin } = useAuth()
  const [bots, setBots] = useState<SquareCloudBot[]>([])
  const [botStatuses, setBotStatuses] = useState<Record<string, SquareCloudStatus>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAppManager, setShowAppManager] = useState(false)
  const [newAppId, setNewAppId] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [selectedBotForDatabase, setSelectedBotForDatabase] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('none')
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [selectedBotForLogs, setSelectedBotForLogs] = useState<string | null>(null)
  const [botLogs, setBotLogs] = useState<string>('')
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [editingBotId, setEditingBotId] = useState<string | null>(null)
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [isUpdatingExpiry, setIsUpdatingExpiry] = useState(false)

  const loadBots = async () => {
    try {
      setIsLoading(true)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Aviso',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      // Buscar informações de cada aplicação
      // A função getSquareCloudBots já busca IDs do localStorage e dos pedidos
      const squareCloudBots = await api.getSquareCloudBots(botSettings.squarecloudAccessToken || '')
      
      // Debug: verificar se os dados de assinatura estão chegando
      console.log('Bots carregados:', squareCloudBots?.map(bot => ({
        name: bot.name,
        id: bot.id,
        subscriptionExpiryDate: bot.subscriptionExpiryDate,
        subscriptionStartDate: bot.subscriptionStartDate
      })))
      
      setBots(squareCloudBots || [])

      // Carregar status de cada bot
      const statuses: Record<string, SquareCloudStatus> = {}
      for (const bot of squareCloudBots || []) {
        try {
          const status = await api.getSquareCloudBotStatus(bot.id, botSettings.squarecloudAccessToken || '')
          statuses[bot.id] = status
        } catch (error) {
          console.error(`Erro ao carregar status do bot ${bot.id}:`, error)
        }
      }
      setBotStatuses(statuses)
    } catch (error: any) {
      console.error('Erro ao carregar bots:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os bots.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadBots()
    setIsRefreshing(false)
    toast({
      title: 'Sucesso',
      description: 'Estatísticas atualizadas!',
    })
  }

  const handleControlBot = async (botId: string, action: 'start' | 'stop' | 'restart') => {
    try {
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      await api.controlSquareCloudBot(botId, action, botSettings.squarecloudAccessToken || '')
      toast({
        title: 'Sucesso',
        description: `Comando ${action === 'start' ? 'iniciar' : action === 'stop' ? 'parar' : 'reiniciar'} enviado com sucesso!`,
      })

      // Aguardar um pouco e recarregar o status
      setTimeout(() => {
        loadBots()
      }, 2000)
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || `Erro ao ${action} o bot.`,
        variant: 'destructive',
      })
    }
  }

  const loadBotLogs = async (botId: string) => {
    try {
      setIsLoadingLogs(true)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      const logs = await api.getSquareCloudBotLogs(botId, botSettings.squarecloudAccessToken)
      setBotLogs(logs || 'Nenhum log disponível.')
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error)
      setBotLogs(`Erro ao carregar logs: ${error.message || 'Erro desconhecido'}`)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os logs.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingLogs(false)
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
    if (editingBotId) {
      const bot = bots.find(b => b.id === editingBotId)
      const expiryDate = bot?.subscriptionExpiryDate || 
        orders.find((o) => o.botServiceId === editingBotId)?.subscriptionExpiryDate
      if (expiryDate) {
        const date = new Date(expiryDate)
        const dateString = date.toISOString().split('T')[0]
        setNewExpiryDate(dateString)
      } else {
        // Se não tem data, usar 30 dias a partir de agora
        const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        setNewExpiryDate(defaultDate.toISOString().split('T')[0])
      }
    }
  }, [editingBotId, bots, orders])

  const handleUpdateBotExpiry = async (botId: string) => {
    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem editar a data de expiração.',
        variant: 'destructive',
      })
      return
    }

    if (!newExpiryDate) {
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

      // Atualizar na tabela applications
      const { getApiUrl } = await import('@/lib/api-config')
      const backendUrl = getApiUrl()
      
      if (!backendUrl) {
        throw new Error('Backend não configurado')
      }

      const response = await fetch(`${backendUrl}/api/squarecloud/update-expiry`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: botId,
          expiryDate: expiryDateTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || error.error || 'Erro ao atualizar data de expiração')
      }

      toast({
        title: 'Data atualizada',
        description: `Data de expiração atualizada para ${format(expiryDateTime, 'dd/MM/yyyy', { locale: ptBR })}.`,
      })

      // Recarregar bots
      await loadBots()
      await refreshData()
      setEditingBotId(null)
      setNewExpiryDate('')
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

  const handleQuickAddAppId = async () => {
    const trimmedId = newAppId.trim()
    if (!trimmedId) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um ID válido.',
        variant: 'destructive',
      })
      return
    }

    setIsAdding(true)
    
    // Verificar se já existe no banco de dados
    try {
      const exists = await api.checkApplicationExists(trimmedId)
      if (exists) {
        setIsAdding(false)
      toast({
        title: 'Aviso',
          description: 'Este ID já está salvo no banco de dados.',
        variant: 'destructive',
      })
      return
    }
    } catch (error) {
      console.error('Erro ao verificar se aplicação existe:', error)
      // Continuar mesmo se falhar a verificação
    }
    try {
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        setIsAdding(false)
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado. Configure nas Configurações.',
          variant: 'destructive',
        })
        return
      }

      // Validar o ID fazendo uma requisição à API e obter informações
      const appInfo = await api.getSquareCloudBotInfo(trimmedId, botSettings.squarecloudAccessToken)

      // Buscar informações do usuário selecionado
      let discordUserId: string | undefined = undefined
      if (selectedUserId && selectedUserId !== 'none') {
        const selectedUser = users.find(u => u.id === selectedUserId)
        if (selectedUser) {
          discordUserId = selectedUser.discord_id
        }
      }

      // Salvar no banco de dados
      try {
        await api.saveApplicationToDatabase({
          id: trimmedId,
          discord_user_id: discordUserId,
          name: appInfo.name || 'Aplicação',
          tipo: 'Manual',
          valor_total: null,
          expira: null,
          adicionais: null,
          bot_id: null,
        })
      } catch (dbError: any) {
        console.error('Erro ao salvar no banco de dados:', dbError)
        // Continuar mesmo se falhar ao salvar no banco (para não bloquear o fluxo)
      }

      // Se chegou aqui, o ID é válido - adicionar ao localStorage (manter para compatibilidade)
      const savedAppIds = getSavedAppIds()
      const updatedIds = [...savedAppIds, trimmedId]
      localStorage.setItem('squarecloud_app_ids', JSON.stringify(updatedIds))
      
      setNewAppId('')
      setSelectedUserId('none')
      setIsAdding(false)
      toast({
        title: 'Sucesso',
        description: 'Aplicação adicionada com sucesso!',
      })
      
      // Recarregar a lista
      await loadBots()
    } catch (error: any) {
      setIsAdding(false)
      console.error('Erro ao adicionar aplicação:', error)
      toast({
        title: 'Erro',
        description: error.message || 'ID inválido ou aplicação não encontrada. Verifique o ID e o token.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadBots()
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadBots, 30000)
    return () => clearInterval(interval)
  }, [])

  // Carregar usuários
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true)
        const usersList = await api.getUsers()
        setUsers(usersList)
      } catch (error) {
        console.error('Erro ao carregar usuários:', error)
      } finally {
        setIsLoadingUsers(false)
      }
    }

    loadUsers()
  }, [])

  // Recarregar quando o dialog do gerenciador fechar (caso tenha adicionado novos IDs)
  useEffect(() => {
    if (!showAppManager) {
      loadBots()
    }
  }, [showAppManager])

  const getLanguageIcon = (lang: string) => {
    const langLower = lang.toLowerCase()
    if (langLower.includes('js') || langLower.includes('javascript') || langLower === 'nodejs') {
      return (
        <img 
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuHnJDLOcdm_0b6N6kNj-1OvO9KhKYgqIy0w&s" 
          alt="JavaScript" 
          className="w-6 h-6 rounded object-cover"
        />
      )
    } else if (langLower.includes('py') || langLower.includes('python')) {
      return (
        <img 
          src="https://cdn.discordapp.com/attachments/1421991630281379912/1450506023688343766/2vaSAAAABklEQVQDAOY5Sf9idbBUAAAAAElFTkSuQmCC.png?ex=6942c881&is=69417701&hm=8f64eedc89a772b113497435baf4544283c2601063be924226e36ecb172abd24&" 
          alt="Python" 
          className="w-6 h-6 rounded object-cover"
        />
      )
    } else if (langLower.includes('html') || langLower.includes('web')) {
      return <Globe className="w-6 h-6 text-red-400" />
    }
    return <Bot className="w-6 h-6 text-zinc-400" />
  }

  const getLanguageBadge = (lang: string) => {
    const langLower = lang.toLowerCase()
    if (langLower.includes('js') || langLower.includes('javascript') || langLower === 'nodejs') {
      return 'JS'
    } else if (langLower.includes('py') || langLower.includes('python')) {
      return 'PY'
    } else if (langLower.includes('html') || langLower.includes('web')) {
      return 'WEB'
    }
    return lang.toUpperCase().substring(0, 3)
  }

  const filteredBots = bots.filter((bot) =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onlineBots = filteredBots.filter((bot) => botStatuses[bot.id]?.running).length
  const totalBots = filteredBots.length

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-48 rounded-lg bg-zinc-900" />
        ))}
      </div>
    )
  }

  if (bots.length === 0 && !isLoading) {
    return (
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="pt-6">
          <div className="text-center space-y-4 py-12">
            <AlertCircle className="w-16 h-16 text-zinc-400 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum bot encontrado
              </h3>
              <p className="text-zinc-400 mb-4">
                A API da SquareCloud pode não ter um endpoint público para listar todas as aplicações.
              </p>
              <p className="text-sm text-zinc-500 mb-6">
                Certifique-se de que o token está configurado corretamente. Se o problema persistir, 
                pode ser necessário usar o SDK oficial da SquareCloud no backend.
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Campo rápido para adicionar ID */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Cole o ID da aplicação aqui (ex: 64d0c750212742ca8704fb458c9771af)"
                value={newAppId}
                onChange={(e) => setNewAppId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleQuickAddAppId()
                  }
                }}
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                disabled={isAdding}
              />
            </div>
            <Button
              onClick={handleQuickAddAppId}
              disabled={isAdding || !newAppId.trim()}
              className="bg-white text-black hover:bg-zinc-200"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Aplicação
                </>
              )}
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quick-user-select" className="text-zinc-300">
              Vincular a usuário (opcional)
            </Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={isAdding || isLoadingUsers}
            >
              <SelectTrigger
                id="quick-user-select"
                className="bg-zinc-900 border-zinc-800 text-white"
              >
                <SelectValue placeholder="Selecione um usuário (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="none" className="hover:bg-zinc-800">
                  Nenhum (não vincular)
                </SelectItem>
                {users.map((user) => (
                  <SelectItem
                    key={user.id}
                    value={user.id}
                    className="hover:bg-zinc-800"
                  >
                    {user.username} {user.email && `(${user.email})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">
              Selecione um usuário para vincular esta aplicação. Deixe vazio para não vincular.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Dialog open={showAppManager} onOpenChange={setShowAppManager}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Gerenciar Aplicações</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Adicione ou remova IDs das aplicações da SquareCloud
                  </DialogDescription>
                </DialogHeader>
                <BotAppManager />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Header com busca e estatísticas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Aplicações</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {totalBots} aplicação{totalBots !== 1 ? 'ões' : ''} • {onlineBots} online
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <Input
              placeholder="Pesquisar aplicações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white pl-10"
            />
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Grid de bots */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredBots.map((bot) => {
          const status = botStatuses[bot.id]
          const isRunning = status?.running || false
          const cpuPercent = Number(status?.cpu) || 0
          const ramUsed = Number(status?.ram) || 0
          const ramTotal = Number(bot.ram) || 256
          const ramPercent = ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0
          
          // Buscar tempo de expiração: primeiro da tabela applications, depois da ordem
          const expiryDate = bot.subscriptionExpiryDate || 
            orders.find((o) => o.botServiceId === bot.id)?.subscriptionExpiryDate
          
          // Se não tem data de expiração, usar uma data padrão (30 dias a partir de agora)
          // Isso garante que sempre mostre o tempo, mesmo para bots antigos
          const finalExpiryDate = expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          
          const timeRemaining = getTimeRemaining(finalExpiryDate)
          
          // Debug
          if (!timeRemaining) {
            console.warn(`Bot ${bot.name} não tem tempo calculado. ExpiryDate:`, finalExpiryDate)
          }

          return (
            <Card
              key={bot.id}
              className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
              onClick={() => navigate(`/admin/bot-database/${bot.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getLanguageIcon(bot.lang)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-white text-base font-semibold truncate">
                        {bot.name}
                      </CardTitle>
                        {editingBotId === bot.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="date"
                              value={newExpiryDate}
                              onChange={(e) => setNewExpiryDate(e.target.value)}
                              className="bg-zinc-900 border-zinc-800 text-white text-xs h-7 w-32"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUpdateBotExpiry(bot.id)
                              }}
                              disabled={isUpdatingExpiry}
                              className="bg-white text-black hover:bg-zinc-200 h-7 px-2"
                            >
                              {isUpdatingExpiry ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingBotId(null)
                                setNewExpiryDate('')
                              }}
                              className="h-7 px-2 text-zinc-400 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            {timeRemaining && (
                              <Badge 
                                className={`text-xs px-2 py-0.5 ${
                                  timeRemaining.expired 
                                    ? 'bg-red-900/30 text-red-400 border-red-900' 
                                    : timeRemaining.text.includes('dia') && parseInt(timeRemaining.text) <= 7
                                      ? 'bg-yellow-900/30 text-yellow-400 border-yellow-900'
                                      : 'bg-green-900/30 text-green-400 border-green-900'
                                }`}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {timeRemaining.text}
                              </Badge>
                            )}
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingBotId(bot.id)
                                }}
                                className="h-6 px-2 text-zinc-400 hover:text-white"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                      <CardDescription className="text-zinc-500 text-xs truncate mt-0.5">
                        {bot.id.substring(0, 32)}...
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                        }}
                      >
                        <MoreVertical className="w-4 h-4 text-zinc-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white z-50">
                      <DropdownMenuItem
                        className="text-white hover:bg-zinc-800"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/bot-status/squarecloud/${bot.id}`)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-white hover:bg-zinc-800"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedBotForDatabase(bot.id)
                        }}
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Ver Database
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-white hover:bg-zinc-800"
                        onClick={async (e) => {
                          e.stopPropagation()
                          setSelectedBotForLogs(bot.id)
                          await loadBotLogs(bot.id)
                        }}
                      >
                        <Terminal className="mr-2 h-4 w-4" />
                        Ver Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-white hover:bg-zinc-800"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleControlBot(bot.id, 'start')
                        }}
                        disabled={isRunning}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Iniciar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-white hover:bg-zinc-800"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleControlBot(bot.id, 'stop')
                        }}
                        disabled={!isRunning}
                      >
                        <PauseCircle className="mr-2 h-4 w-4" />
                        Parar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-white hover:bg-zinc-800"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleControlBot(bot.id, 'restart')
                        }}
                        disabled={!isRunning}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reiniciar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-400 hover:bg-red-900/20"
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (confirm(`Tem certeza que deseja excluir a aplicação "${bot.name}"? Esta ação não pode ser desfeita.`)) {
                            try {
                              await api.deleteApplication(bot.id)
                              toast({
                                title: 'Sucesso',
                                description: 'Aplicação excluída com sucesso!',
                              })
                              await loadBots()
                            } catch (error: any) {
                              toast({
                                title: 'Erro',
                                description: error.message || 'Não foi possível excluir a aplicação.',
                                variant: 'destructive',
                              })
                            }
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Aplicação
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge
                    className={`${
                      isRunning
                        ? 'bg-green-900/30 text-green-400 border-green-900'
                        : 'bg-red-900/30 text-red-400 border-red-900'
                    } text-xs`}
                  >
                    {isRunning ? 'ONLINE' : 'OFFLINE'}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                    {getLanguageBadge(bot.lang)}
                  </Badge>
                </div>

                {/* Descrição (se houver) */}
                {bot.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {bot.description}
                  </p>
                )}

                {/* Botões de Controle */}
                <div className="flex gap-2 pt-2 border-t border-zinc-800">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleControlBot(bot.id, isRunning ? 'stop' : 'start')
                    }}
                  >
                    {isRunning ? (
                      <>
                        <PauseCircle className="w-3 h-3 mr-1" />
                        Parar
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3 h-3 mr-1" />
                        Iniciar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleControlBot(bot.id, 'restart')
                    }}
                    disabled={!isRunning}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reiniciar
                  </Button>
                </div>

                {/* Recursos */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      CPU
                    </span>
                    <span className="text-white font-medium">
                      {typeof cpuPercent === 'number' ? cpuPercent.toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      RAM
                    </span>
                    <span className="text-white font-medium">
                      {typeof ramUsed === 'number' ? ramUsed.toFixed(0) : '0'} MB / {ramTotal} MB
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        ramPercent > 80
                          ? 'bg-red-500'
                          : ramPercent > 60
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(ramPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredBots.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <p className="text-zinc-400">
            Nenhuma aplicação encontrada para "{searchQuery}"
          </p>
        </div>
      )}

      {/* Visualizador de Database */}
      {selectedBotForDatabase && (
        <BotDatabaseViewer
          appId={selectedBotForDatabase}
          isOpen={!!selectedBotForDatabase}
          onClose={() => setSelectedBotForDatabase(null)}
        />
      )}

      {/* Dialog de Logs */}
      <Dialog open={!!selectedBotForLogs} onOpenChange={(open) => !open && setSelectedBotForLogs(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Logs do Bot
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {selectedBotForLogs && bots.find(b => b.id === selectedBotForLogs)?.name || 'Carregando...'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-end gap-2 mb-4">
              <Button
                onClick={() => selectedBotForLogs && loadBotLogs(selectedBotForLogs)}
                variant="outline"
                size="sm"
                disabled={isLoadingLogs}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {botLogs && (
                <>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(botLogs)
                      toast({
                        title: 'Copiado!',
                        description: 'Logs copiados para a área de transferência.',
                      })
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </>
              )}
            </div>
            <ScrollArea className="flex-1 bg-black rounded-lg p-4 font-mono text-sm">
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
              ) : (
                <div className="space-y-1">
                  {botLogs.split('\n').map((line, index) => {
                    const trimmedLine = line.trim()
                    if (!trimmedLine) return <br key={index} />
                    
                    let className = 'text-zinc-300'
                    if (trimmedLine.toLowerCase().includes('error') || trimmedLine.toLowerCase().includes('erro')) {
                      className = 'text-red-400'
                    } else if (trimmedLine.toLowerCase().includes('warn') || trimmedLine.toLowerCase().includes('aviso')) {
                      className = 'text-yellow-400'
                    } else if (trimmedLine.toLowerCase().includes('info') || trimmedLine.toLowerCase().includes('sucesso')) {
                      className = 'text-blue-400'
                    } else if (trimmedLine.toLowerCase().includes('debug')) {
                      className = 'text-purple-400'
                    }
                    
                    return (
                      <div key={index} className={`${className} whitespace-pre-wrap break-words`}>
                        {trimmedLine}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
