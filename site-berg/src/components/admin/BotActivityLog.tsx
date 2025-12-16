import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Loader2, RefreshCw, FileText, Settings, Database, Bot, Clock, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityLog {
  id: string
  type: 'command' | 'config' | 'database' | 'system'
  action: string
  description: string
  timestamp: string
  userId?: string
  username?: string
  botId?: string
  details?: Record<string, any>
}

export function BotActivityLog() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [selectedBot, setSelectedBot] = useState<string | null>(null)
  const [bots, setBots] = useState<any[]>([])

  useEffect(() => {
    loadBots()
    loadActivityLog()
  }, [])

  const loadBots = async () => {
    try {
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        return
      }

      // Buscar aplicações da SquareCloud
      const response = await fetch('https://api.squarecloud.app/v2/apps', {
        headers: {
          'Authorization': botSettings.squarecloudAccessToken.trim(),
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success' && data.apps) {
          setBots(data.apps)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar bots:', error)
    }
  }

  const loadActivityLog = async (botId?: string) => {
    setIsLoading(true)
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

      const targetBotId = botId || selectedBot
      if (!targetBotId) {
        // Se não houver bot selecionado, mostrar logs gerais do sistema
        await loadSystemLogs()
        return
      }

      // Buscar logs do bot específico
      const logs = await api.getSquareCloudBotLogs(targetBotId, botSettings.squarecloudAccessToken)
      
      // Processar logs e criar atividades
      const logLines = logs.split('\n').filter(line => line.trim())
      const parsedActivities: ActivityLog[] = []

      logLines.forEach((line, index) => {
        // Tentar identificar tipo de atividade pelo conteúdo do log
        let type: ActivityLog['type'] = 'system'
        let action = 'Log'
        let description = line

        // Detectar comandos
        if (line.toLowerCase().includes('command') || line.toLowerCase().includes('comando')) {
          type = 'command'
          action = 'Comando Executado'
        }
        // Detectar mudanças de configuração
        else if (line.toLowerCase().includes('config') || line.toLowerCase().includes('setting')) {
          type = 'config'
          action = 'Configuração Alterada'
        }
        // Detectar operações de banco de dados
        else if (line.toLowerCase().includes('database') || line.toLowerCase().includes('db') || 
                 line.toLowerCase().includes('key') || line.toLowerCase().includes('ticket')) {
          type = 'database'
          action = 'Operação no Banco'
        }

        parsedActivities.push({
          id: `log-${targetBotId}-${index}`,
          type,
          action,
          description: line,
          timestamp: new Date().toISOString(), // Logs não têm timestamp, usar data atual
          botId: targetBotId,
        })
      })

      // Ordenar por mais recente primeiro
      parsedActivities.reverse()
      setActivities(parsedActivities.slice(0, 100)) // Limitar a 100 atividades mais recentes
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar histórico de atividades.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSystemLogs = async () => {
    // Carregar logs do sistema (pedidos, configurações, etc.)
    try {
      const orders = await api.getOrders()
      const systemActivities: ActivityLog[] = []

      // Criar atividades a partir dos pedidos
      orders.slice(0, 20).forEach((order) => {
        systemActivities.push({
          id: `order-${order.id}`,
          type: 'system',
          action: 'Pedido Criado',
          description: `Pedido ${order.id} - ${order.productName} - R$ ${order.amount.toFixed(2)}`,
          timestamp: order.date,
          userId: order.userId,
        })
      })

      setActivities(systemActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ))
    } catch (error) {
      console.error('Erro ao carregar logs do sistema:', error)
    }
  }

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'command':
        return <Bot className="h-4 w-4" />
      case 'config':
        return <Settings className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'command':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'config':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'database':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50'
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Registro de Atividades</CardTitle>
              <CardDescription className="text-zinc-400">
                Histórico de comandos, alterações e operações realizadas nos bots
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {bots.length > 0 && (
                <select
                  value={selectedBot || ''}
                  onChange={(e) => {
                    setSelectedBot(e.target.value || null)
                    loadActivityLog(e.target.value || undefined)
                  }}
                  className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos os Bots</option>
                  {bots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name || bot.id}
                    </option>
                  ))}
                </select>
              )}
              <Button
                onClick={() => loadActivityLog()}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atividade registrada ainda.</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={getActivityColor(activity.type)}>
                              {activity.action}
                            </Badge>
                            {activity.botId && (
                              <span className="text-xs text-zinc-500">
                                Bot: {activity.botId.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-300 break-words">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(activity.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", {
                                locale: ptBR,
                              })}
                            </div>
                            {activity.username && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {activity.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

