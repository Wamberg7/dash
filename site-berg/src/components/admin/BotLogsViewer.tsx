import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Loader2, RefreshCw, Copy, Download, Terminal, Play, Pause } from 'lucide-react'

interface SquareCloudBot {
  id: string
  name: string
  description?: string
}

export function BotLogsViewer() {
  const { toast } = useToast()
  const [bots, setBots] = useState<SquareCloudBot[]>([])
  const [selectedBotId, setSelectedBotId] = useState<string>('')
  const [logs, setLogs] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoRefresh, setIsAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadBots()
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [])

  useEffect(() => {
    if (selectedBotId) {
      loadLogs(selectedBotId)
    }
  }, [selectedBotId])

  useEffect(() => {
    if (selectedBotId && isAutoRefresh) {
      // Atualizar logs a cada 5 segundos quando auto-refresh estiver ativo
      const interval = setInterval(() => {
        loadLogs(selectedBotId)
      }, 5000)
      setRefreshInterval(interval)
      return () => clearInterval(interval)
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
    }
  }, [selectedBotId, isAutoRefresh, loadLogs])

  useEffect(() => {
    // Scroll automático para o final quando logs mudarem
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const loadBots = async () => {
    try {
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Aviso',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      const squareCloudBots = await api.getSquareCloudBots(botSettings.squarecloudAccessToken || '')
      setBots(squareCloudBots || [])
      
      // Selecionar o primeiro bot automaticamente se houver
      if (squareCloudBots && squareCloudBots.length > 0 && !selectedBotId) {
        setSelectedBotId(squareCloudBots[0].id)
      }
    } catch (error: any) {
      console.error('Erro ao carregar bots:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os bots.',
        variant: 'destructive',
      })
    }
  }

  const loadLogs = useCallback(async (botId: string) => {
    if (!botId) return

    try {
      setIsLoading(true)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      const logsContent = await api.getSquareCloudBotLogs(botId, botSettings.squarecloudAccessToken)
      setLogs(logsContent || 'Nenhum log disponível.')
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error)
      setLogs(`Erro ao carregar logs: ${error.message || 'Erro desconhecido'}`)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os logs.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const handleBotChange = (botId: string) => {
    setSelectedBotId(botId)
    if (botId) {
      loadLogs(botId)
    } else {
      setLogs('')
    }
  }

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs)
    toast({
      title: 'Copiado!',
      description: 'Logs copiados para a área de transferência.',
    })
  }

  const handleDownloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bot-logs-${selectedBotId}-${new Date().toISOString()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: 'Download iniciado',
      description: 'Logs baixados com sucesso.',
    })
  }

  const formatLogLine = (line: string): JSX.Element => {
    const trimmedLine = line.trim()
    if (!trimmedLine) return <br />

    // Detectar tipos de log por palavras-chave
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

    // Detectar timestamps e formatar
    const timestampRegex = /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}).*?(\d{2}:\d{2}:\d{2})/
    const hasTimestamp = timestampRegex.test(trimmedLine)

    return (
      <div className={`font-mono text-sm ${className} whitespace-pre-wrap break-words`}>
        {trimmedLine}
      </div>
    )
  }

  const logLines = logs.split('\n')

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Logs do Bot
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Visualize os logs em tempo real dos seus bots hospedados na SquareCloud
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {bots.length > 0 && (
                <Select value={selectedBotId} onValueChange={handleBotChange}>
                  <SelectTrigger className="w-64 bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Selecione um bot" />
                  </SelectTrigger>
                  <SelectContent>
                    {bots.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id}>
                        {bot.name || bot.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                variant="outline"
                size="sm"
                className={isAutoRefresh ? 'bg-green-500/20 border-green-500/50' : ''}
              >
                {isAutoRefresh ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar Auto-refresh
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Auto-refresh
                  </>
                )}
              </Button>
              <Button
                onClick={() => selectedBotId && loadLogs(selectedBotId)}
                variant="outline"
                size="sm"
                disabled={isLoading || !selectedBotId}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {logs && (
                <>
                  <Button
                    onClick={handleCopyLogs}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    onClick={handleDownloadLogs}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedBotId ? (
            <div className="text-center py-12 text-zinc-400">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione um bot para visualizar os logs.</p>
            </div>
          ) : isLoading && !logs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full" ref={scrollAreaRef}>
              <div className="bg-black rounded-lg p-4 font-mono text-sm">
                <div className="space-y-1">
                  {logLines.map((line, index) => (
                    <div key={index}>{formatLogLine(line)}</div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

