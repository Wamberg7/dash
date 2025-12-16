import { useState, useEffect } from 'react'
import {
  Database,
  Ticket,
  Users,
  Key,
  Loader2,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  UserCheck,
  Plus,
  Trash2,
  Save,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

interface BotDatabaseStatsProps {
  appId: string
}

interface TicketsAssumidos {
  [staffId: string]: {
    nome: string
    dias: { [date: string]: number }
    categorias: { [category: string]: number }
    total_tickets: number
  }
}

interface TicketsData {
  tickets_abertos: any
  ticket_claims: {
    [ticketId: string]: {
      staff_id: number
      staff_name: string
      assumido_em: number
    }
  }
  tickets_fechados: any
  last_updated: number
}

interface KeyData {
  key: string
  validade: number
}

export function BotDatabaseStats({ appId }: BotDatabaseStatsProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [ticketsAssumidos, setTicketsAssumidos] = useState<TicketsAssumidos>({})
  const [ticketsData, setTicketsData] = useState<TicketsData | null>(null)
  const [keys, setKeys] = useState<KeyData[]>([])
  const [keysAndroid, setKeysAndroid] = useState<KeyData[]>([])
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newKeyValidity, setNewKeyValidity] = useState('7')
  const [isSaving, setIsSaving] = useState(false)
  const [keyType, setKeyType] = useState<'normal' | 'android'>('normal')

  useEffect(() => {
    loadDatabaseStats()
  }, [appId])

  const loadDatabaseStats = async () => {
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

      console.log('Iniciando carregamento dos arquivos do database para appId:', appId)
      
      // Carregar todos os arquivos do database em paralelo
      const [ticketsAssumidosData, ticketsDataFile, keysData, keysAndroidData] = await Promise.all([
        loadDatabaseFile('database/tickets_assumidos.json'),
        loadDatabaseFile('database/tickets_data.json'),
        loadDatabaseFile('database/keys.json'),
        loadDatabaseFile('database/keysandroid.json'),
      ])

      console.log('Dados carregados:', {
        ticketsAssumidosData,
        ticketsDataFile,
        keysData,
        keysAndroidData
      })

      if (ticketsAssumidosData) {
        setTicketsAssumidos(ticketsAssumidosData as TicketsAssumidos)
      }

      if (ticketsDataFile) {
        setTicketsData(ticketsDataFile as TicketsData)
      }

      if (keysData) {
        setKeys(Array.isArray(keysData) ? keysData : [])
      }

      if (keysAndroidData) {
        setKeysAndroid(Array.isArray(keysAndroidData) ? keysAndroidData : [])
      }
      
      console.log('Estatísticas atualizadas')
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas do database:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar as estatísticas do database.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadDatabaseFile = async (filePath: string) => {
    try {
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        console.log('Token não configurado para', filePath)
        return null
      }

      console.log('Carregando arquivo:', filePath, 'para appId:', appId)
      const content = await api.getSquareCloudBotFileContent(
        appId,
        botSettings.squarecloudAccessToken,
        filePath
      )
      console.log('Conteúdo recebido para', filePath, ':', content)

      // Se content é null, arquivo não existe - retornar valor padrão
      if (content === null) {
        console.log('Conteúdo é null para', filePath, ', usando valores padrão')
        if (filePath.includes('keys.json') || filePath.includes('keysandroid.json')) {
          return []
        }
        if (filePath.includes('tickets_assumidos.json')) {
          return {}
        }
        if (filePath.includes('tickets_data.json')) {
          return {
            tickets_abertos: {},
            ticket_claims: {},
            tickets_fechados: {},
            last_updated: Date.now(),
          }
        }
        return null
      }

      // Processar o conteúdo
      let parsedContent = content
      if (typeof content === 'string') {
        try {
          parsedContent = JSON.parse(content)
        } catch {
          return null
        }
      } else if (content && typeof content === 'object' && content.content) {
        try {
          const contentStr = typeof content.content === 'string' ? content.content : JSON.stringify(content.content)
          parsedContent = JSON.parse(contentStr)
        } catch {
          parsedContent = content.content || content
        }
      }

      return parsedContent
    } catch (error: any) {
      // Não logar como erro se for apenas arquivo não encontrado
      if (error.message && !error.message.includes('não encontrado') && !error.message.includes('not found')) {
        console.warn(`Erro ao carregar ${filePath}:`, error)
      }
      
      // Retornar valores padrão vazios
      if (filePath.includes('keys.json') || filePath.includes('keysandroid.json')) {
        return []
      }
      if (filePath.includes('tickets_assumidos.json')) {
        return {}
      }
      if (filePath.includes('tickets_data.json')) {
        return {
          tickets_abertos: {},
          ticket_claims: {},
          tickets_fechados: {},
          last_updated: Date.now(),
        }
      }
      return null
    }
  }

  // Função para gerar hash aleatório
  const generateRandomHash = (length: number = 16): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Função para formatar key no padrão Sensimenstruada-{tipo}-{hash}
  const formatKey = (validity: number, hash?: string): string => {
    const keyHash = hash || generateRandomHash(16)
    const tipo = validity === 30 ? 'month' : validity === 7 ? 'week' : validity === 1 ? 'day' : 'custom'
    return `Sensimenstruada-${tipo}-${keyHash}`
  }

  const handleAddKey = async () => {
    if (!newKeyValidity.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha o campo de validade.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
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

      const filePath = keyType === 'normal' ? 'database/keys.json' : 'database/keysandroid.json'
      const currentKeys = keyType === 'normal' ? (keys || []) : (keysAndroid || [])
      
      const validity = Number(newKeyValidity)
      
      // Se o usuário digitou uma key, usar ela (pode já estar formatada ou não)
      // Se não digitou, gerar automaticamente
      let keyValue = newKey.trim()
      
      // Se a key não estiver no formato correto, formatar
      if (!keyValue || !keyValue.startsWith('Sensimenstruada-')) {
        // Se o usuário forneceu um hash, extrair; caso contrário, gerar novo
        const hashMatch = keyValue.match(/-([A-Za-z0-9]+)$/)
        const hash = hashMatch ? hashMatch[1] : undefined
        keyValue = formatKey(validity, hash)
      }

      const newKeyData: KeyData = {
        key: keyValue,
        validade: validity,
      }

      const updatedKeys = [...currentKeys, newKeyData]
      const fileContent = JSON.stringify(updatedKeys, null, 2)

      await api.updateSquareCloudBotFile(appId, botSettings.squarecloudAccessToken, filePath, fileContent)

      // Atualizar estado local
      if (keyType === 'normal') {
        setKeys(updatedKeys)
      } else {
        setKeysAndroid(updatedKeys)
      }

      setNewKey('')
      setNewKeyValidity('7')
      setShowAddKeyDialog(false)
      toast({
        title: 'Sucesso',
        description: 'Key adicionada com sucesso!',
      })
    } catch (error: any) {
      console.error('Erro ao adicionar key:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível adicionar a key.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearKeys = async () => {
    setIsSaving(true)
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

      const filePath = keyType === 'normal' ? 'database/keys.json' : 'database/keysandroid.json'
      const emptyArray: KeyData[] = []
      const fileContent = JSON.stringify(emptyArray, null, 2)

      await api.updateSquareCloudBotFile(appId, botSettings.squarecloudAccessToken, filePath, fileContent)

      // Atualizar estado local
      if (keyType === 'normal') {
        setKeys([])
      } else {
        setKeysAndroid([])
      }

      toast({
        title: 'Sucesso',
        description: 'Estoque limpo com sucesso!',
      })
    } catch (error: any) {
      console.error('Erro ao limpar estoque:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível limpar o estoque.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Calcular estatísticas
  const totalTickets = ticketsAssumidos && typeof ticketsAssumidos === 'object'
    ? Object.values(ticketsAssumidos).reduce(
        (sum, staff) => sum + (staff?.total_tickets || 0),
        0
      )
    : 0

  const ticketsAssumidosCount = ticketsData?.ticket_claims
    ? Object.keys(ticketsData.ticket_claims).length
    : 0

  const ticketsFechadosCount = ticketsData?.tickets_fechados
    ? Object.keys(ticketsData.tickets_fechados).length
    : 0

  const ticketsAbertosCount = ticketsData?.tickets_abertos
    ? Object.keys(ticketsData.tickets_abertos).length
    : 0

  // Agrupar keys por validade (separado para keys normais e android)
  const keysByValidity: { [key: number]: number } = {}
  if (Array.isArray(keys)) {
    keys.forEach((key) => {
      const validade = key?.validade || 0
      keysByValidity[validade] = (keysByValidity[validade] || 0) + 1
    })
  }

  const keysAndroidByValidity: { [key: number]: number } = {}
  if (Array.isArray(keysAndroid)) {
    keysAndroid.forEach((key) => {
      const validade = key?.validade || 0
      keysAndroidByValidity[validade] = (keysAndroidByValidity[validade] || 0) + 1
    })
  }

  // Ordenar staff por total de tickets (maior primeiro)
  const staffSorted = ticketsAssumidos && typeof ticketsAssumidos === 'object'
    ? Object.entries(ticketsAssumidos).sort(
        (a, b) => (b[1]?.total_tickets || 0) - (a[1]?.total_tickets || 0)
      )
    : []

  if (isLoading) {
    return (
      <Card className="bg-zinc-950 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-400" />
              Tickets Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalTickets}</div>
            <p className="text-xs text-zinc-400 mt-1">Total de tickets processados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-400" />
              Tickets Assumidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{ticketsAssumidosCount}</div>
            <p className="text-xs text-zinc-400 mt-1">Atualmente assumidos</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              Tickets Fechados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{ticketsFechadosCount}</div>
            <p className="text-xs text-zinc-400 mt-1">Total fechados</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4 text-yellow-400" />
              Keys Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{(keys?.length || 0) + (keysAndroid?.length || 0)}</div>
            <p className="text-xs text-zinc-400 mt-1">
              {keys?.length || 0} keys + {keysAndroid?.length || 0} Android
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff e Tickets */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Tickets por Staff
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Quantidade de tickets assumidos por cada membro da equipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staffSorted.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Nenhum dado de staff encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {staffSorted.map(([staffId, data]) => (
                <div key={staffId} className="p-3 bg-zinc-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-white font-medium">
                        {data.nome?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{data.nome || staffId}</div>
                        <div className="text-xs text-zinc-400">ID: {staffId}</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-900/30 text-blue-400 border-blue-900">
                      {data.total_tickets || 0} tickets
                    </Badge>
                  </div>
                  
                  {data.categorias && Object.keys(data.categorias).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-1">Por categoria:</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(data.categorias).map(([category, count]) => (
                          <Badge
                            key={category}
                            variant="outline"
                            className="text-xs border-zinc-700 text-zinc-300"
                          >
                            {category}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keys por Tipo */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="w-5 h-5" />
                Keys por Tipo
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Distribuição de keys por validade
              </CardDescription>
            </div>
            <Dialog open={showAddKeyDialog} onOpenChange={setShowAddKeyDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-white text-black hover:bg-zinc-200">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Key
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle>Adicionar Key</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Adicione uma nova key ao estoque
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-type">Tipo de Key</Label>
                    <select
                      id="key-type"
                      value={keyType}
                      onChange={(e) => setKeyType(e.target.value as 'normal' | 'android')}
                      className="w-full bg-zinc-900 border-zinc-800 text-white rounded-md px-3 py-2"
                    >
                      <option value="normal">Key Normal</option>
                      <option value="android">Key Android</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key-value">Key (opcional - será formatada automaticamente)</Label>
                    <Input
                      id="key-value"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="Deixe vazio para gerar automaticamente ou digite o hash"
                      className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                    />
                    <p className="text-xs text-zinc-500">
                      Se deixar vazio, será gerada automaticamente no formato: Sensimenstruada-{newKeyValidity === '30' ? 'month' : newKeyValidity === '7' ? 'week' : 'day'}-[hash]
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="key-validity">Validade (dias)</Label>
                    <Input
                      id="key-validity"
                      type="number"
                      value={newKeyValidity}
                      onChange={(e) => setNewKeyValidity(e.target.value)}
                      placeholder="7"
                      className="bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddKey}
                      disabled={isSaving}
                      className="flex-1 bg-white text-black hover:bg-zinc-200"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-zinc-400">Keys Normais</div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-red-400 hover:text-red-300"
                      onClick={() => setKeyType('normal')}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Limpar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Limpar Estoque de Keys Normais?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        Esta ação irá remover todas as keys normais do estoque. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearKeys}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Limpar Estoque
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="text-2xl font-bold text-white">{keys?.length || 0}</div>
              {Object.keys(keysByValidity).length > 0 && (
                <div className="mt-3 space-y-1">
                  {Object.entries(keysByValidity)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([validade, count]) => (
                      <div key={validade} className="flex justify-between text-xs text-zinc-400">
                        <span>{validade} dias</span>
                        <span className="text-white">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-zinc-400">Keys Android</div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-red-400 hover:text-red-300"
                      onClick={() => setKeyType('android')}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Limpar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Limpar Estoque de Keys Android?</AlertDialogTitle>
                      <AlertDialogDescription className="text-zinc-400">
                        Esta ação irá remover todas as keys Android do estoque. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearKeys}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Limpar Estoque
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="text-2xl font-bold text-white">{keysAndroid?.length || 0}</div>
              {Object.keys(keysAndroidByValidity).length > 0 && (
                <div className="mt-3 space-y-1">
                  {Object.entries(keysAndroidByValidity)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([validade, count]) => (
                      <div key={validade} className="flex justify-between text-xs text-zinc-400">
                        <span>{validade} dias</span>
                        <span className="text-white">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Abertos */}
      {ticketsAbertosCount > 0 && (
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tickets Abertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{ticketsAbertosCount}</div>
            <p className="text-xs text-zinc-400 mt-1">Aguardando atendimento</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

