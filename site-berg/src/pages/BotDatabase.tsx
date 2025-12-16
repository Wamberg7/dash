import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
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
  Edit,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  Copy,
  Settings,
  Hash,
  FileText,
  Folder,
  MessageSquare,
  Star,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
  Code,
  Palette,
  Image,
  Type,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

export default function BotDatabase() {
  const { appId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [ticketsAssumidos, setTicketsAssumidos] = useState<TicketsAssumidos>({})
  const [ticketsData, setTicketsData] = useState<TicketsData | null>(null)
  const [keys, setKeys] = useState<KeyData[]>([])
  const [keysAndroid, setKeysAndroid] = useState<KeyData[]>([])
  const [keysIosSafe, setKeysIosSafe] = useState<KeyData[]>([])
  
  // Estados para CRUD de Keys
  const [showAddKeyDialog, setShowAddKeyDialog] = useState(false)
  const [showEditKeyDialog, setShowEditKeyDialog] = useState(false)
  const [editingKey, setEditingKey] = useState<KeyData | null>(null)
  const [editingKeyIndex, setEditingKeyIndex] = useState<number>(-1)
  const [editingKeyType, setEditingKeyType] = useState<'normal' | 'android' | 'ios-safe'>('normal')
  const [newKey, setNewKey] = useState('')
  const [newKeyValidity, setNewKeyValidity] = useState('7')
  const [keyType, setKeyType] = useState<'normal' | 'android' | 'ios-safe'>('normal')
  const [isSaving, setIsSaving] = useState(false)
  
  // Estados para Config.json
  const [configJson, setConfigJson] = useState<string>('')
  const [configJsonError, setConfigJsonError] = useState<string>('')
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [configData, setConfigData] = useState<any>({})
  const [configEditMode, setConfigEditMode] = useState<'form' | 'json'>('form')
  
  // Estados para Painel Config.json
  const [painelConfigJson, setPainelConfigJson] = useState<string>('')
  const [painelConfigJsonError, setPainelConfigJsonError] = useState<string>('')
  const [isSavingPainelConfig, setIsSavingPainelConfig] = useState(false)
  const [painelConfigData, setPainelConfigData] = useState<any>({})
  const [painelConfigEditMode, setPainelConfigEditMode] = useState<'form' | 'json'>('form')
  const [isSyncingPanel, setIsSyncingPanel] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  
  // Estado para controlar qual arquivo está sendo editado
  const [activeConfigTab, setActiveConfigTab] = useState<'config' | 'painel'>('config')
  
  // Estados para seleção de keys
  const [selectedKeysNormal, setSelectedKeysNormal] = useState<number[]>([])
  const [selectedKeysAndroid, setSelectedKeysAndroid] = useState<number[]>([])
  const [selectedKeysIosSafe, setSelectedKeysIosSafe] = useState<number[]>([])
  const [showSelectedKeysDialog, setShowSelectedKeysDialog] = useState(false)
  const [selectedKeysText, setSelectedKeysText] = useState('')

  useEffect(() => {
    if (appId) {
      loadDatabaseStats()
    }
  }, [appId])

  // Função helper para obter opções de validade
  const getValidityOptions = (type: 'normal' | 'android' | 'ios-safe'): number[] => {
    if (type === 'normal') return [7, 15, 30]
    if (type === 'android') return [10, 20, 30]
    if (type === 'ios-safe') return [1, 7, 30]
    return [7]
  }

  // Atualizar validade padrão quando o tipo de key mudar
  useEffect(() => {
    const options = getValidityOptions(keyType)
    if (options.length > 0 && !options.includes(Number(newKeyValidity))) {
      setNewKeyValidity(options[0].toString())
    }
  }, [keyType, newKeyValidity])

  // Resetar erros de imagem quando a URL mudar
  useEffect(() => {
    setImageError(false)
  }, [painelConfigData?.image_url])

  useEffect(() => {
    setThumbnailError(false)
  }, [painelConfigData?.thumbnail_url])

  const loadDatabaseStats = async () => {
    if (!appId) {
      console.log('appId não definido, não é possível carregar estatísticas')
      return
    }
    
    try {
      console.log('Iniciando carregamento dos arquivos do database para appId:', appId)
      setIsLoading(true)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        console.log('Token não configurado')
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      const [ticketsAssumidosData, ticketsDataFile, keysData, keysAndroidData, keysIosSafeData, configData, painelConfigData] = await Promise.all([
        loadDatabaseFile('database/tickets_assumidos.json'),
        loadDatabaseFile('database/tickets_data.json'),
        loadDatabaseFile('database/keys.json'),
        loadDatabaseFile('database/keysandroid.json'),
        loadDatabaseFile('database/keysios.json'),
        loadDatabaseFile('database/config.json'),
        loadDatabaseFile('database/painel_config.json'),
      ])

      console.log('Dados carregados:', {
        ticketsAssumidosData,
        ticketsDataFile,
        keysData,
        keysAndroidData,
        keysIosSafeData
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

      if (keysIosSafeData) {
        setKeysIosSafe(Array.isArray(keysIosSafeData) ? keysIosSafeData : [])
      }

      if (configData) {
        // Se configData é um objeto, converter para JSON formatado
        const configObj = typeof configData === 'string' 
          ? JSON.parse(configData) 
          : configData
        setConfigData(configObj)
        const configString = typeof configData === 'string' 
          ? configData 
          : JSON.stringify(configData, null, 2)
        setConfigJson(configString)
      } else {
        // Se não existe, criar um objeto vazio
        const emptyConfig = {}
        setConfigData(emptyConfig)
        setConfigJson('{\n  \n}')
      }

      if (painelConfigData) {
        // Se painelConfigData é um objeto, converter para JSON formatado
        let painelConfigObj: any
        if (typeof painelConfigData === 'string') {
          try {
            // Tentar decodificar como UTF-8 se necessário
            painelConfigObj = JSON.parse(painelConfigData)
          } catch (e) {
            // Se falhar, tentar decodificar manualmente
            try {
              const decoded = decodeURIComponent(escape(painelConfigData))
              painelConfigObj = JSON.parse(decoded)
            } catch (e2) {
              painelConfigObj = JSON.parse(painelConfigData)
            }
          }
        } else {
          painelConfigObj = painelConfigData
        }
        
        // Garantir que painel_info existe
        if (!painelConfigObj.painel_info) {
          painelConfigObj.painel_info = { guild_id: 0, channel_id: 0, message_id: 0 }
        }
        
        // Garantir que description seja uma string válida
        if (painelConfigObj.description && typeof painelConfigObj.description !== 'string') {
          painelConfigObj.description = String(painelConfigObj.description)
        }
        
        setPainelConfigData(painelConfigObj)
        const painelConfigString = typeof painelConfigData === 'string' 
          ? painelConfigData 
          : JSON.stringify(painelConfigData, null, 2)
        setPainelConfigJson(painelConfigString)
      } else {
        // Se não existe, criar um objeto vazio
        const emptyPainelConfig = {
          painel_info: { guild_id: 0, channel_id: 0, message_id: 0 }
        }
        setPainelConfigData(emptyPainelConfig)
        setPainelConfigJson('{\n  "painel_info": {\n    "guild_id": 0,\n    "channel_id": 0,\n    "message_id": 0\n  }\n}')
      }
      
      console.log('Estatísticas atualizadas com sucesso')
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
    if (!appId) {
      console.log('appId não definido')
      return null
    }
    
    try {
      console.log('Carregando arquivo:', filePath, 'para appId:', appId)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        console.log('Token não configurado')
        return null
      }

      const content = await api.getSquareCloudBotFileContent(
        appId,
        botSettings.squarecloudAccessToken,
        filePath
      )
      console.log('Conteúdo recebido para', filePath, ':', content)

      // Se content é null, arquivo não existe - retornar valor padrão baseado no tipo
      if (content === null) {
        console.log('Conteúdo é null para', filePath, ', usando valores padrão')
        // Retornar valores padrão vazios baseados no tipo de arquivo
        if (filePath.includes('keys.json') || filePath.includes('keysandroid.json') || filePath.includes('keysios.json')) {
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
        if (filePath.includes('config.json')) {
          return {}
        }
        if (filePath.includes('painel_config.json')) {
          return {}
        }
        return null
      }

      let parsedContent = content
      if (typeof content === 'string') {
        try {
          parsedContent = JSON.parse(content)
        } catch {
          // Se não for JSON válido, retornar null
          return null
        }
      } else if (content && typeof content === 'object' && content.content) {
        try {
          // Se tiver propriedade content dentro de um objeto
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
      if (filePath.includes('keys.json') || filePath.includes('keysandroid.json') || filePath.includes('keysios.json')) {
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
        if (filePath.includes('config.json')) {
          return {}
        }
        if (filePath.includes('painel_config.json')) {
          return {}
        }
      return null
    }
  }

  const saveKeysFile = async (keysData: KeyData[], type: 'normal' | 'android' | 'ios-safe') => {
    if (!appId) return
    
    try {
      setIsSaving(true)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      let filePath = 'database/keys.json'
      if (type === 'android') {
        filePath = 'database/keysandroid.json'
      } else if (type === 'ios-safe') {
        filePath = 'database/keysios.json'
      }
      
      const fileContent = JSON.stringify(keysData, null, 2)

      await api.updateSquareCloudBotFile(appId, botSettings.squarecloudAccessToken, filePath, fileContent)

      if (type === 'normal') {
        setKeys(keysData)
      } else if (type === 'android') {
        setKeysAndroid(keysData)
      } else if (type === 'ios-safe') {
        setKeysIosSafe(keysData)
      }

      toast({
        title: 'Sucesso',
        description: 'Keys salvas com sucesso!',
      })
    } catch (error: any) {
      console.error('Erro ao salvar keys:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar as keys.',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const updateConfigFromForm = () => {
    // Atualizar JSON a partir do formulário
    const formattedJson = JSON.stringify(configData, null, 2)
    setConfigJson(formattedJson)
    setConfigJsonError('')
  }

  const saveConfigJson = async () => {
    if (!appId) return

    let jsonToSave = configJson

    // Se estiver no modo formulário, atualizar JSON primeiro
    if (configEditMode === 'form') {
      updateConfigFromForm()
      jsonToSave = JSON.stringify(configData, null, 2)
    }

    // Validar JSON antes de salvar
    try {
      JSON.parse(jsonToSave)
      setConfigJsonError('')
    } catch (error: any) {
      setConfigJsonError('JSON inválido: ' + error.message)
      toast({
        title: 'Erro',
        description: 'O JSON está inválido. Corrija os erros antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSavingConfig(true)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      // Formatar JSON antes de salvar
      const parsedJson = JSON.parse(jsonToSave)
      const formattedJson = JSON.stringify(parsedJson, null, 2)

      await api.updateSquareCloudBotFile(appId, botSettings.squarecloudAccessToken, 'database/config.json', formattedJson)

      setConfigJson(formattedJson)
      setConfigData(parsedJson)
      toast({
        title: 'Sucesso',
        description: 'Config.json salvo com sucesso!',
      })
    } catch (error: any) {
      console.error('Erro ao salvar config.json:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o config.json.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingConfig(false)
    }
  }

  const updatePainelConfigFromForm = () => {
    // Atualizar JSON a partir do formulário
    const formattedJson = JSON.stringify(painelConfigData, null, 2)
    setPainelConfigJson(formattedJson)
    setPainelConfigJsonError('')
  }

  const savePainelConfigJson = async () => {
    if (!appId) return

    let jsonToSave = painelConfigJson

    // Se estiver no modo formulário, atualizar JSON primeiro
    if (painelConfigEditMode === 'form') {
      updatePainelConfigFromForm()
      jsonToSave = JSON.stringify(painelConfigData, null, 2)
    }

    // Validar JSON antes de salvar
    try {
      JSON.parse(jsonToSave)
      setPainelConfigJsonError('')
    } catch (error: any) {
      setPainelConfigJsonError('JSON inválido: ' + error.message)
      toast({
        title: 'Erro',
        description: 'O JSON está inválido. Corrija os erros antes de salvar.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSavingPainelConfig(true)
      const botSettings = await api.getBotSettings()
      if (!botSettings.squarecloudAccessToken) {
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado.',
          variant: 'destructive',
        })
        return
      }

      // Formatar JSON antes de salvar
      const parsedJson = JSON.parse(jsonToSave)
      const formattedJson = JSON.stringify(parsedJson, null, 2)

      await api.updateSquareCloudBotFile(appId, botSettings.squarecloudAccessToken, 'database/painel_config.json', formattedJson)

      setPainelConfigJson(formattedJson)
      setPainelConfigData(parsedJson)
      toast({
        title: 'Sucesso',
        description: 'Painel Config.json salvo com sucesso!',
      })
    } catch (error: any) {
      console.error('Erro ao salvar painel_config.json:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o painel_config.json.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingPainelConfig(false)
    }
  }

  const syncPanelToDiscord = async () => {
    if (!appId) return

    // Validar se tem os dados necessários
    if (!painelConfigData?.painel_info?.guild_id || !painelConfigData?.painel_info?.channel_id || !painelConfigData?.painel_info?.message_id) {
      toast({
        title: 'Erro',
        description: 'Configure Guild ID, Channel ID e Message ID antes de sincronizar.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSyncingPanel(true)
      
      // Primeiro, salvar o config se estiver no modo formulário
      if (painelConfigEditMode === 'form') {
        updatePainelConfigFromForm()
      }

      const { getApiUrl } = await import('@/lib/api-config')
      const backendUrl = getApiUrl()

      if (!backendUrl) {
        toast({
          title: 'Erro',
          description: 'Backend não configurado. Configure VITE_API_URL nas variáveis de ambiente.',
          variant: 'destructive',
        })
        return
      }

      // Preparar dados do painel para sincronização
      const panelData = painelConfigEditMode === 'form' 
        ? painelConfigData 
        : JSON.parse(painelConfigJson)

      const response = await fetch(`${backendUrl}/api/squarecloud/sync-panel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          panelConfig: panelData,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.message || error.error || `Erro HTTP ${response.status}`)
      }

      const result = await response.json()

      toast({
        title: 'Sucesso',
        description: result.message || 'Painel sincronizado com o Discord com sucesso!',
      })
    } catch (error: any) {
      console.error('Erro ao sincronizar painel:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível sincronizar o painel com o Discord.',
        variant: 'destructive',
      })
    } finally {
      setIsSyncingPanel(false)
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

    try {
      const currentKeys = keyType === 'normal' ? keys : keyType === 'android' ? keysAndroid : keysIosSafe
      const validity = Number(newKeyValidity)
      
      // Se o usuário digitou keys, processar; caso contrário, gerar uma automaticamente
      let keysLines: string[] = []
      
      if (newKey.trim()) {
      // Processar múltiplas keys (uma por linha)
        keysLines = newKey.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      } else {
        // Se não digitou nada, gerar uma key automaticamente
        keysLines = [formatKey(validity)]
      }
      
      if (keysLines.length === 0) {
        toast({
          title: 'Erro',
          description: 'Adicione pelo menos uma key.',
          variant: 'destructive',
        })
        return
      }

      const newKeysData: KeyData[] = keysLines.map(keyValue => {
        // Se a key não estiver no formato correto, formatar
        if (!keyValue.startsWith('Sensimenstruada-')) {
          // Se o usuário forneceu um hash, extrair; caso contrário, gerar novo
          const hashMatch = keyValue.match(/-([A-Za-z0-9]+)$/)
          const hash = hashMatch ? hashMatch[1] : undefined
          keyValue = formatKey(validity, hash)
        }
        
        return {
        key: keyValue,
          validade: validity,
        }
      })

      const updatedKeys = [...currentKeys, ...newKeysData]
      await saveKeysFile(updatedKeys, keyType)

      setNewKey('')
      setNewKeyValidity(getValidityOptions(keyType)[0].toString())
      setShowAddKeyDialog(false)
      
      toast({
        title: 'Sucesso',
        description: `${newKeysData.length} key(s) adicionada(s) com sucesso!`,
      })
    } catch (error) {
      // Erro já foi tratado em saveKeysFile
    }
  }

  const handleEditKey = (key: KeyData, index: number, type: 'normal' | 'android' | 'ios-safe') => {
    setEditingKey(key)
    setEditingKeyIndex(index)
    setEditingKeyType(type)
    setNewKey(key.key)
    setNewKeyValidity(key.validade.toString())
    setShowEditKeyDialog(true)
  }

  const handleUpdateKey = async () => {
    if (!newKey.trim() || !newKeyValidity.trim() || editingKeyIndex === -1) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      })
      return
    }

    try {
      const currentKeys = editingKeyType === 'normal' ? keys : editingKeyType === 'android' ? keysAndroid : keysIosSafe
      const updatedKeys = [...currentKeys]
      updatedKeys[editingKeyIndex] = {
        key: newKey.trim(),
        validade: Number(newKeyValidity),
      }

      await saveKeysFile(updatedKeys, editingKeyType)

      setShowEditKeyDialog(false)
      setEditingKey(null)
      setEditingKeyIndex(-1)
      setNewKey('')
      setNewKeyValidity('7')
    } catch (error) {
      // Erro já foi tratado em saveKeysFile
    }
  }

  const handleDeleteKey = async (index: number, type: 'normal' | 'android' | 'ios-safe') => {
    try {
      const currentKeys = type === 'normal' ? keys : type === 'android' ? keysAndroid : keysIosSafe
      const updatedKeys = currentKeys.filter((_, i) => i !== index)
      await saveKeysFile(updatedKeys, type)
    } catch (error) {
      // Erro já foi tratado em saveKeysFile
    }
  }

  const handleClearKeys = async () => {
    try {
      await saveKeysFile([], keyType)
    } catch (error) {
      // Erro já foi tratado em saveKeysFile
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

  const staffSorted = ticketsAssumidos && typeof ticketsAssumidos === 'object'
    ? Object.entries(ticketsAssumidos).sort(
        (a, b) => (b[1]?.total_tickets || 0) - (a[1]?.total_tickets || 0)
      )
    : []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-4 mb-6">
            {/* Botões */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={loadDatabaseStats}
                variant="outline"
                disabled={isLoading}
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
            {/* Título */}
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Database className="w-8 h-8" />
                Database do Bot
              </h1>
              <p className="text-zinc-400 mt-1">Gerenciar database e estatísticas</p>
            </div>
          </div>

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

        {/* Tabs para diferentes seções */}
        <Tabs defaultValue="keys" className="space-y-4">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger value="keys" className="data-[state=active]:bg-zinc-800">
              <Key className="w-4 h-4 mr-2" />
              Keys
            </TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-zinc-800">
              <Users className="w-4 h-4 mr-2" />
              Staff & Tickets
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-zinc-800">
              <Settings className="w-4 h-4 mr-2" />
              Configuração
            </TabsTrigger>
          </TabsList>

          {/* Tab Keys - CRUD */}
          <TabsContent value="keys" className="space-y-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Título */}
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      Gerenciar Keys
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Adicione, edite ou remova keys do estoque
                    </CardDescription>
                  </div>
                  {/* Botão */}
                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-green-600 w-full md:w-auto">
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Key
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-zinc-800"
                          onClick={() => {
                            setKeyType('normal')
                            setNewKeyValidity('7')
                            setShowAddKeyDialog(true)
                          }}
                        >
                          Key Normal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-zinc-800"
                          onClick={() => {
                            setKeyType('android')
                            setNewKeyValidity('10')
                            setShowAddKeyDialog(true)
                          }}
                        >
                          Key Android
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-zinc-800"
                          onClick={() => {
                            setKeyType('ios-safe')
                            setNewKeyValidity('1')
                            setShowAddKeyDialog(true)
                          }}
                        >
                          Key iOS Safe
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Keys Normais */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white text-lg">Keys Normais ({keys?.length || 0})</CardTitle>
                          <CardDescription className="text-zinc-400">
                            Gerencie as keys normais do estoque
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {selectedKeysNormal.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                              onClick={() => {
                                const selectedKeysText = selectedKeysNormal
                                  .map(index => keys[index]?.key)
                                  .filter(Boolean)
                                  .join('\n')
                                setSelectedKeysText(selectedKeysText)
                                setShowSelectedKeysDialog(true)
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Ver Selecionadas ({selectedKeysNormal.length})
                            </Button>
                          )}
                          {keys && keys.length > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                  onClick={() => setKeyType('normal')}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Limpar Estoque
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Limpar Estoque de Keys Normais?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-zinc-400">
                                    Esta ação irá remover todas as keys normais. Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
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
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-white w-12">
                            <Checkbox
                              checked={selectedKeysNormal.length === keys.length && keys.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedKeysNormal(keys.map((_, i) => i))
                                } else {
                                  setSelectedKeysNormal([])
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead className="text-white">Key</TableHead>
                          <TableHead className="text-white">Validade (dias)</TableHead>
                          <TableHead className="text-white text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keys && keys.length > 0 ? (
                          keys.map((key, index) => (
                            <TableRow 
                              key={index} 
                              className={`border-zinc-800 cursor-pointer hover:bg-zinc-900/50 ${selectedKeysNormal.includes(index) ? 'bg-zinc-900/30' : ''}`}
                              onClick={() => {
                                setSelectedKeysNormal(prev => 
                                  prev.includes(index) 
                                    ? prev.filter(i => i !== index)
                                    : [...prev, index]
                                )
                              }}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedKeysNormal.includes(index)}
                                  onCheckedChange={(checked) => {
                                    setSelectedKeysNormal(prev => 
                                      checked 
                                        ? [...prev, index]
                                        : prev.filter(i => i !== index)
                                    )
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm text-white">
                                {key.key}
                              </TableCell>
                              <TableCell className="text-zinc-300">{key.validade}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditKey(key, index, 'normal')
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Key?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-zinc-400">
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteKey(index, 'normal')}
                                          className="bg-red-600 text-white hover:bg-red-700"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className="border-zinc-800">
                            <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                              Nenhuma key normal encontrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    </CardContent>
                  </Card>

                  {/* Keys Android */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white text-lg">Keys Android ({keysAndroid?.length || 0})</CardTitle>
                          <CardDescription className="text-zinc-400">
                            Gerencie as keys Android do estoque
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {selectedKeysAndroid.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                              onClick={() => {
                                const selectedKeysText = selectedKeysAndroid
                                  .map(index => keysAndroid[index]?.key)
                                  .filter(Boolean)
                                  .join('\n')
                                setSelectedKeysText(selectedKeysText)
                                setShowSelectedKeysDialog(true)
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Ver Selecionadas ({selectedKeysAndroid.length})
                            </Button>
                          )}
                          {keysAndroid && keysAndroid.length > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                  onClick={() => setKeyType('android')}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Limpar Estoque
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Limpar Estoque de Keys Android?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-zinc-400">
                                    Esta ação irá remover todas as keys Android. Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
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
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-white w-12">
                            <Checkbox
                              checked={selectedKeysAndroid.length === keysAndroid.length && keysAndroid.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedKeysAndroid(keysAndroid.map((_, i) => i))
                                } else {
                                  setSelectedKeysAndroid([])
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead className="text-white">Key</TableHead>
                          <TableHead className="text-white">Validade (dias)</TableHead>
                          <TableHead className="text-white text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keysAndroid && keysAndroid.length > 0 ? (
                          keysAndroid.map((key, index) => (
                            <TableRow 
                              key={index} 
                              className={`border-zinc-800 cursor-pointer hover:bg-zinc-900/50 ${selectedKeysAndroid.includes(index) ? 'bg-zinc-900/30' : ''}`}
                              onClick={() => {
                                setSelectedKeysAndroid(prev => 
                                  prev.includes(index) 
                                    ? prev.filter(i => i !== index)
                                    : [...prev, index]
                                )
                              }}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedKeysAndroid.includes(index)}
                                  onCheckedChange={(checked) => {
                                    setSelectedKeysAndroid(prev => 
                                      checked 
                                        ? [...prev, index]
                                        : prev.filter(i => i !== index)
                                    )
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm text-white">
                                {key.key}
                              </TableCell>
                              <TableCell className="text-zinc-300">{key.validade}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditKey(key, index, 'android')
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-400"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Key?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-zinc-400">
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteKey(index, 'android')}
                                          className="bg-red-600 text-white hover:bg-red-700"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className="border-zinc-800">
                            <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                              Nenhuma key Android encontrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    </CardContent>
                  </Card>

                  {/* Keys iOS Safe */}
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white text-lg">Keys iOS Safe ({keysIosSafe?.length || 0})</CardTitle>
                          <CardDescription className="text-zinc-400">
                            Gerencie as keys iOS Safe do estoque
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {selectedKeysIosSafe.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                              onClick={() => {
                                const selectedKeysText = selectedKeysIosSafe
                                  .map(index => keysIosSafe[index]?.key)
                                  .filter(Boolean)
                                  .join('\n')
                                setSelectedKeysText(selectedKeysText)
                                setShowSelectedKeysDialog(true)
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Ver Selecionadas ({selectedKeysIosSafe.length})
                            </Button>
                          )}
                          {keysIosSafe && keysIosSafe.length > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                                  onClick={() => setKeyType('ios-safe')}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Limpar Estoque
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Limpar Estoque de Keys iOS Safe?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-zinc-400">
                                    Esta ação irá remover todas as keys iOS Safe. Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
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
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-800">
                          <TableHead className="text-white w-12">
                            <Checkbox
                              checked={selectedKeysIosSafe.length === keysIosSafe.length && keysIosSafe.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedKeysIosSafe(keysIosSafe.map((_, i) => i))
                                } else {
                                  setSelectedKeysIosSafe([])
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead className="text-white">Key</TableHead>
                          <TableHead className="text-white">Validade (dias)</TableHead>
                          <TableHead className="text-white text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {keysIosSafe && keysIosSafe.length > 0 ? (
                          keysIosSafe.map((key, index) => (
                            <TableRow 
                              key={index} 
                              className={`border-zinc-800 cursor-pointer hover:bg-zinc-900/50 ${selectedKeysIosSafe.includes(index) ? 'bg-zinc-900/30' : ''}`}
                              onClick={() => {
                                setSelectedKeysIosSafe(prev => 
                                  prev.includes(index) 
                                    ? prev.filter(i => i !== index)
                                    : [...prev, index]
                                )
                              }}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedKeysIosSafe.includes(index)}
                                  onCheckedChange={(checked) => {
                                    setSelectedKeysIosSafe(prev => 
                                      checked 
                                        ? [...prev, index]
                                        : prev.filter(i => i !== index)
                                    )
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-sm text-white">
                                {key.key}
                              </TableCell>
                              <TableCell className="text-zinc-300">{key.validade}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditKey(key, index, 'ios-safe')
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-400"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-white">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Key?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-zinc-400">
                                          Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteKey(index, 'ios-safe')}
                                          className="bg-red-600 text-white hover:bg-red-700"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className="border-zinc-800">
                            <TableCell colSpan={4} className="text-center text-zinc-500 py-8">
                              Nenhuma key iOS Safe encontrada
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Staff & Tickets */}
          <TabsContent value="staff" className="space-y-4">
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
          </TabsContent>

          {/* Tab Configuração */}
          <TabsContent value="config" className="space-y-4">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuração
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Edite os arquivos de configuração do bot
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Tabs internas para os dois arquivos de configuração */}
                <Tabs value={activeConfigTab} onValueChange={(value) => setActiveConfigTab(value as 'config' | 'painel')} className="space-y-4">
                  <TabsList className="bg-zinc-900 border-zinc-800">
                    <TabsTrigger value="config" className="data-[state=active]:bg-zinc-800">
                      config.json
                    </TabsTrigger>
                    <TabsTrigger value="painel" className="data-[state=active]:bg-zinc-800">
                      painel_config.json
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab config.json */}
                  <TabsContent value="config" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white text-lg">database/config.json</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfigEditMode(configEditMode === 'form' ? 'json' : 'form')}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          >
                            {configEditMode === 'form' ? (
                              <>
                                <Code className="w-4 h-4 mr-2" />
                                Modo JSON
                              </>
                            ) : (
                              <>
                                <Settings className="w-4 h-4 mr-2" />
                                Modo Formulário
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={saveConfigJson}
                            disabled={isSavingConfig}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isSavingConfig ? (
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
                      {configJsonError && (
                        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-md">
                          <p className="text-sm text-red-400">{configJsonError}</p>
                        </div>
                      )}
                      
                      {configEditMode === 'form' ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="staff-role" className="text-white flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Cargo de Staff (STAFF_ROLE_ID)
                              </Label>
                              <Input
                                id="staff-role"
                                type="text"
                                value={configData.STAFF_ROLE_ID || ''}
                                onChange={(e) => setConfigData({ ...configData, STAFF_ROLE_ID: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="1401226366640459947"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="suporte-id" className="text-white flex items-center gap-2">
                                <Folder className="w-4 h-4" />
                                Categoria Suporte (SUPORTE_ID)
                              </Label>
                              <Input
                                id="suporte-id"
                                type="text"
                                value={configData.SUPORTE_ID || ''}
                                onChange={(e) => setConfigData({ ...configData, SUPORTE_ID: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="1401020133140467802"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="key-id" className="text-white flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                Categoria Keys (KEY_ID)
                              </Label>
                              <Input
                                id="key-id"
                                type="text"
                                value={configData.KEY_ID || ''}
                                onChange={(e) => setConfigData({ ...configData, KEY_ID: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="1415540142059294720"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="log-channel-key" className="text-white flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Canal Log Keys (LOG_CHANNEL_KEY)
                              </Label>
                              <Input
                                id="log-channel-key"
                                type="text"
                                value={configData.LOG_CHANNEL_KEY || ''}
                                onChange={(e) => setConfigData({ ...configData, LOG_CHANNEL_KEY: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="1401246902313549834"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="log-channel-id" className="text-white flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Canal Log Tickets (LOG_CHANNEL_ID)
                              </Label>
                              <Input
                                id="log-channel-id"
                                type="text"
                                value={configData.LOG_CHANNEL_ID || ''}
                                onChange={(e) => setConfigData({ ...configData, LOG_CHANNEL_ID: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="1401246934857027585"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="log-channel-av" className="text-white flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Canal Log Avaliações (LOG_CHANNEL_AV)
                              </Label>
                              <Input
                                id="log-channel-av"
                                type="text"
                                value={configData.LOG_CHANNEL_AV || ''}
                                onChange={(e) => setConfigData({ ...configData, LOG_CHANNEL_AV: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="1401228386721992815"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="log-vendas" className="text-white flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" />
                                Canal Log Vendas (LOG_VENDAS)
                              </Label>
                              <Input
                                id="log-vendas"
                                type="text"
                                value={configData.LOG_VENDAS || ''}
                                onChange={(e) => setConfigData({ ...configData, LOG_VENDAS: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="1401246902313549834"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="guild-id" className="text-white flex items-center gap-2">
                                <Hash className="w-4 h-4" />
                                ID do Servidor (GUILD_ID)
                              </Label>
                              <Input
                                id="guild-id"
                                type="text"
                                value={configData.GUILD_ID || ''}
                                onChange={(e) => setConfigData({ ...configData, GUILD_ID: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="1401003136851902484"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="max-tickets" className="text-white flex items-center gap-2">
                                <Ticket className="w-4 h-4" />
                                Max Tickets por Categoria
                              </Label>
                              <Input
                                id="max-tickets"
                                type="number"
                                value={configData.MAX_TICKETS_POR_CATEGORIA || ''}
                                onChange={(e) => setConfigData({ ...configData, MAX_TICKETS_POR_CATEGORIA: parseInt(e.target.value) || 0 })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="50"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="limit-vendas" className="text-white flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" />
                                Limite de Vendas
                              </Label>
                              <Input
                                id="limit-vendas"
                                type="number"
                                value={configData.LIMIT_VENDAS || ''}
                                onChange={(e) => setConfigData({ ...configData, LIMIT_VENDAS: parseInt(e.target.value) || 0 })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="motivo-abertura" className="text-white flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Motivo de Abertura Ativo
                              </Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setConfigData({ ...configData, MOTIVO_ABERTURA_ATIVO: !configData.MOTIVO_ABERTURA_ATIVO })}
                                  className={`border-zinc-700 ${configData.MOTIVO_ABERTURA_ATIVO ? 'bg-green-600/20 border-green-500 text-green-400' : 'text-zinc-300 hover:bg-zinc-800'}`}
                                >
                                  {configData.MOTIVO_ABERTURA_ATIVO ? (
                                    <>
                                      <ToggleRight className="w-4 h-4 mr-2" />
                                      Ativado
                                    </>
                                  ) : (
                                    <>
                                      <ToggleLeft className="w-4 h-4 mr-2" />
                                      Desativado
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Textarea
                            value={configJson}
                            onChange={(e) => {
                              setConfigJson(e.target.value)
                              // Validar JSON em tempo real
                              try {
                                const parsed = JSON.parse(e.target.value)
                                setConfigData(parsed)
                                setConfigJsonError('')
                              } catch (error: any) {
                                setConfigJsonError('JSON inválido: ' + error.message)
                              }
                            }}
                            className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm min-h-[400px]"
                            placeholder={'{\n  "key": "value"\n}'}
                            style={{
                              fontFamily: 'monospace',
                              whiteSpace: 'pre',
                            }}
                          />
                          <p className="text-xs text-zinc-500">
                            Edite o JSON acima. O arquivo será validado antes de salvar.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab painel_config.json */}
                  <TabsContent value="painel" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-white text-lg">database/painel_config.json</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPainelConfigEditMode(painelConfigEditMode === 'form' ? 'json' : 'form')}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          >
                            {painelConfigEditMode === 'form' ? (
                              <>
                                <Code className="w-4 h-4 mr-2" />
                                Modo JSON
                              </>
                            ) : (
                              <>
                                <Settings className="w-4 h-4 mr-2" />
                                Modo Formulário
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={savePainelConfigJson}
                            disabled={isSavingPainelConfig || isSyncingPanel}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isSavingPainelConfig ? (
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
                          <Button
                            onClick={syncPanelToDiscord}
                            disabled={isSyncingPanel || isSavingPainelConfig}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {isSyncingPanel ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sincronizando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Sincronizar Painel
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      {painelConfigJsonError && (
                        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-md">
                          <p className="text-sm text-red-400">{painelConfigJsonError}</p>
                        </div>
                      )}
                      
                      {painelConfigEditMode === 'form' ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Formulário */}
                            <div className="space-y-4">
                              <div className="text-white font-semibold text-lg mb-4">Configurações do Embed</div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="painel-title" className="text-white flex items-center gap-2">
                                <Type className="w-4 h-4" />
                                Título (title)
                              </Label>
                              <Input
                                id="painel-title"
                                type="text"
                                value={painelConfigData?.title || ''}
                                onChange={(e) => setPainelConfigData({ ...(painelConfigData || {}), title: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="Sytem Ticket - Natsu Xiter"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="painel-description" className="text-white flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Descrição (description)
                              </Label>
                              <Textarea
                                id="painel-description"
                                value={painelConfigData?.description || ''}
                                onChange={(e) => setPainelConfigData({ ...(painelConfigData || {}), description: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white min-h-[120px]"
                                placeholder="Abra um ticket, e espere a minha resposta..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="painel-color" className="text-white flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                Cor (color) - Hex
                              </Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id="painel-color"
                                  type="text"
                                  value={painelConfigData?.color || ''}
                                  onChange={(e) => setPainelConfigData({ ...(painelConfigData || {}), color: e.target.value })}
                                  className="bg-zinc-900 border-zinc-800 text-white flex-1"
                                  placeholder="#696969"
                                />
                                <Input
                                  type="color"
                                  value={painelConfigData?.color || '#696969'}
                                  onChange={(e) => setPainelConfigData({ ...(painelConfigData || {}), color: e.target.value })}
                                  className="w-12 h-10 rounded border border-zinc-700 cursor-pointer bg-transparent"
                                  style={{
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    appearance: 'none',
                                    border: '1px solid #3f3f46',
                                    cursor: 'pointer',
                                  }}
                                  title="Escolher cor"
                                />
                                {painelConfigData?.color && (
                                  <div 
                                    className="w-10 h-10 rounded border border-zinc-700 flex-shrink-0"
                                    style={{ backgroundColor: painelConfigData.color }}
                                    title={painelConfigData.color}
                                  />
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="painel-image" className="text-white flex items-center gap-2">
                                <Image className="w-4 h-4" />
                                URL da Imagem (image_url)
                              </Label>
                              <Input
                                id="painel-image"
                                type="text"
                                value={painelConfigData?.image_url || ''}
                                onChange={(e) => {
                                  setPainelConfigData({ ...(painelConfigData || {}), image_url: e.target.value })
                                  setImageError(false) // Resetar erro quando URL mudar
                                }}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="https://..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="painel-thumbnail" className="text-white flex items-center gap-2">
                                <Image className="w-4 h-4" />
                                URL da Miniatura (thumbnail_url)
                              </Label>
                              <Input
                                id="painel-thumbnail"
                                type="text"
                                value={painelConfigData?.thumbnail_url || ''}
                                onChange={(e) => {
                                  setPainelConfigData({ ...(painelConfigData || {}), thumbnail_url: e.target.value || null })
                                  setThumbnailError(false) // Resetar erro quando URL mudar
                                }}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="https://... (deixe vazio para null)"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="painel-footer" className="text-white flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Rodapé (footer)
                              </Label>
                              <Input
                                id="painel-footer"
                                type="text"
                                value={painelConfigData?.footer || ''}
                                onChange={(e) => setPainelConfigData({ ...(painelConfigData || {}), footer: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="Selecione o tipo de atendimento:"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="painel-placeholder" className="text-white flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Placeholder (placeholder)
                              </Label>
                              <Input
                                id="painel-placeholder"
                                type="text"
                                value={painelConfigData?.placeholder || ''}
                                onChange={(e) => setPainelConfigData({ ...(painelConfigData || {}), placeholder: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 text-white"
                                placeholder="Selecione um Ticket"
                              />
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                              <div className="text-white font-semibold text-lg mb-4">Informações do Painel</div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="painel-guild-id" className="text-white flex items-center gap-2">
                                    <Hash className="w-4 h-4" />
                                    Guild ID
                                  </Label>
                                  <Input
                                    id="painel-guild-id"
                                    type="text"
                                    value={painelConfigData?.painel_info?.guild_id || ''}
                                    onChange={(e) => setPainelConfigData({ 
                                      ...(painelConfigData || {}), 
                                      painel_info: { 
                                        ...(painelConfigData?.painel_info || {}), 
                                        guild_id: e.target.value ? parseInt(e.target.value) || 0 : 0 
                                      } 
                                    })}
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                    placeholder="1401003136851902484"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="painel-channel-id" className="text-white flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Channel ID
                                  </Label>
                                  <Input
                                    id="painel-channel-id"
                                    type="text"
                                    value={painelConfigData?.painel_info?.channel_id || ''}
                                    onChange={(e) => setPainelConfigData({ 
                                      ...(painelConfigData || {}), 
                                      painel_info: { 
                                        ...(painelConfigData?.painel_info || {}), 
                                        channel_id: e.target.value ? parseInt(e.target.value) || 0 : 0 
                                      } 
                                    })}
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                    placeholder="1415540068894118071"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="painel-message-id" className="text-white flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Message ID
                                  </Label>
                                  <Input
                                    id="painel-message-id"
                                    type="text"
                                    value={painelConfigData?.painel_info?.message_id || ''}
                                    onChange={(e) => setPainelConfigData({ 
                                      ...(painelConfigData || {}), 
                                      painel_info: { 
                                        ...(painelConfigData?.painel_info || {}), 
                                        message_id: e.target.value ? parseInt(e.target.value) || 0 : 0 
                                      } 
                                    })}
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                    placeholder="1435437492168953907"
                                  />
                                </div>
                              </div>
                            </div>
                            </div>

                            {/* Preview do Embed */}
                            <div className="space-y-4">
                              <div className="text-white font-semibold text-lg mb-4">Preview do Embed</div>
                              <Card className="bg-zinc-900 border-zinc-800">
                                <CardContent className="p-4">
                                  <div 
                                    className="rounded-lg border-l-4 p-4 space-y-3"
                                    style={{ 
                                      borderLeftColor: painelConfigData?.color || '#696969',
                                      backgroundColor: 'rgba(0, 0, 0, 0.3)'
                                    }}
                                  >
                                    {/* Título */}
                                    {painelConfigData?.title && (
                                      <div className="text-white font-semibold text-lg">
                                        {painelConfigData.title}
                                      </div>
                                    )}

                                    {/* Descrição */}
                                    {painelConfigData?.description && (
                                      <div className="text-zinc-300 text-sm whitespace-pre-wrap break-words">
                                        {painelConfigData.description}
                                      </div>
                                    )}

                                    {/* Imagem principal (banner) - sempre mostrar primeiro se existir */}
                                    {painelConfigData?.image_url && painelConfigData.image_url.trim() !== '' ? (
                                      <div className="w-full mt-2">
                                        {!imageError ? (
                                          <div className="relative w-full">
                                            <img 
                                              src={painelConfigData.image_url} 
                                              alt="Banner"
                                              className="w-full rounded max-h-64 object-contain bg-zinc-800/50 border border-zinc-700 block"
                                              style={{ maxWidth: '100%', minHeight: '100px', display: 'block' }}
                                              onError={() => {
                                                setImageError(true)
                                                console.error('Erro ao carregar imagem:', painelConfigData.image_url)
                                              }}
                                              onLoad={() => {
                                                setImageError(false)
                                                console.log('✅ Imagem carregada com sucesso:', painelConfigData.image_url)
                                              }}
                                            />
                                          </div>
                                        ) : (
                                          <div className="w-full rounded max-h-64 bg-zinc-800/50 border border-zinc-700 p-4 flex items-center justify-center min-h-[100px]">
                                            <div className="text-center">
                                              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                                              <p className="text-xs text-red-400">Erro ao carregar imagem</p>
                                              <p className="text-xs text-zinc-500 mt-1 break-all max-w-full">{painelConfigData.image_url}</p>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-2 text-xs"
                                                onClick={() => {
                                                  setImageError(false)
                                                }}
                                              >
                                                Tentar novamente
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="w-full mt-2 rounded bg-zinc-800/30 border border-zinc-700 p-4 text-center min-h-[100px] flex items-center justify-center">
                                        <p className="text-xs text-zinc-500">Nenhuma imagem configurada</p>
                                      </div>
                                    )}

                                    {/* Miniatura - mostrar separadamente se existir */}
                                    {painelConfigData?.thumbnail_url && (
                                      <div className="flex items-start gap-3 mt-2">
                                        {!thumbnailError ? (
                                          <img 
                                            src={painelConfigData.thumbnail_url} 
                                            alt="Thumbnail"
                                            className="w-20 h-20 rounded object-cover flex-shrink-0 border border-zinc-700"
                                            onError={() => {
                                              setThumbnailError(true)
                                              console.error('Erro ao carregar miniatura:', painelConfigData.thumbnail_url)
                                            }}
                                            onLoad={() => {
                                              setThumbnailError(false)
                                            }}
                                          />
                                        ) : (
                                          <div className="w-20 h-20 rounded bg-zinc-800/50 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle className="w-6 h-6 text-red-400" />
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Rodapé */}
                                    {painelConfigData?.footer && (
                                      <div className="pt-2 border-t border-zinc-700">
                                        <div className="text-zinc-400 text-xs">
                                          {painelConfigData.footer}
                                        </div>
                                      </div>
                                    )}

                                    {/* Placeholder do Select */}
                                    {painelConfigData?.placeholder && (
                                      <div className="pt-2">
                                        <div className="text-zinc-500 text-xs italic">
                                          Placeholder: "{painelConfigData.placeholder}"
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Informações do Painel */}
                                  {painelConfigData?.painel_info && (
                                    <div className="mt-4 pt-4 border-t border-zinc-800">
                                      <div className="text-zinc-400 text-xs font-semibold mb-2">Informações do Painel:</div>
                                      <div className="space-y-1 text-xs text-zinc-500">
                                        <div>Guild ID: {painelConfigData.painel_info.guild_id || 'Não definido'}</div>
                                        <div>Channel ID: {painelConfigData.painel_info.channel_id || 'Não definido'}</div>
                                        <div>Message ID: {painelConfigData.painel_info.message_id || 'Não definido'}</div>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Textarea
                            value={painelConfigJson || ''}
                            onChange={(e) => {
                              const newValue = e.target.value
                              setPainelConfigJson(newValue)
                              // Validar JSON em tempo real
                              try {
                                const parsed = JSON.parse(newValue)
                                // Garantir que painel_info existe
                                if (!parsed.painel_info) {
                                  parsed.painel_info = { guild_id: 0, channel_id: 0, message_id: 0 }
                                }
                                setPainelConfigData(parsed)
                                setPainelConfigJsonError('')
                              } catch (error: any) {
                                setPainelConfigJsonError('JSON inválido: ' + error.message)
                              }
                            }}
                            className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm min-h-[400px]"
                            placeholder={'{\n  "key": "value"\n}'}
                            style={{
                              fontFamily: 'monospace',
                              whiteSpace: 'pre',
                            }}
                          />
                          <p className="text-xs text-zinc-500">
                            Edite o JSON acima. O arquivo será validado antes de salvar.
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para Adicionar Key */}
        <Dialog 
          open={showAddKeyDialog} 
          onOpenChange={(open) => {
            setShowAddKeyDialog(open)
            if (!open) {
              // Limpar campos quando o dialog fechar
              setNewKey('')
              const options = getValidityOptions(keyType)
              setNewKeyValidity(options[0]?.toString() || '7')
            }
          }}
        >
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>
                Adicionar Key {keyType === 'normal' ? 'Normal' : keyType === 'android' ? 'Android' : 'iOS Safe'}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Adicione uma ou mais keys ao estoque (uma por linha)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="key-value">Keys (opcional - serão formatadas automaticamente)</Label>
                <Textarea
                  id="key-value"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Deixe vazio para gerar automaticamente ou cole hashes (um por linha)"
                  className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm min-h-[120px]"
                  rows={6}
                />
                <p className="text-xs text-zinc-500">
                  Se deixar vazio, será gerada uma key automaticamente no formato: Sensimenstruada-{newKeyValidity === '30' ? 'month' : newKeyValidity === '7' ? 'week' : 'day'}-[hash]
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-validity">Validade (dias)</Label>
                <Select value={newKeyValidity} onValueChange={setNewKeyValidity}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Selecione a validade" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {getValidityOptions(keyType).map((days) => (
                      <SelectItem key={days} value={days.toString()} className="hover:bg-zinc-800">
                        {days} dias
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddKey}
                  disabled={isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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

        {/* Dialog para ver Keys Selecionadas */}
        <Dialog open={showSelectedKeysDialog} onOpenChange={setShowSelectedKeysDialog}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Keys Selecionadas</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Copie as keys selecionadas abaixo (uma por linha)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                value={selectedKeysText}
                readOnly
                rows={5}
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm overflow-y-scroll resize-none"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#52525b #18181b'
                }}
                onClick={(e) => {
                  e.currentTarget.select()
                  navigator.clipboard.writeText(selectedKeysText)
                  toast({
                    title: 'Copiado!',
                    description: 'Keys copiadas para a área de transferência.',
                  })
                }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedKeysText)
                    toast({
                      title: 'Copiado!',
                      description: 'Keys copiadas para a área de transferência.',
                    })
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Todas
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para Editar Key */}
        <Dialog open={showEditKeyDialog} onOpenChange={setShowEditKeyDialog}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>
                Editar Key {editingKeyType === 'normal' ? 'Normal' : editingKeyType === 'android' ? 'Android' : 'iOS Safe'}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Edite os dados da key
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-key-value">Key</Label>
                <Input
                  id="edit-key-value"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="Cole a key aqui"
                  className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-key-validity">Validade (dias)</Label>
                <Input
                  id="edit-key-validity"
                  type="number"
                  value={newKeyValidity}
                  onChange={(e) => setNewKeyValidity(e.target.value)}
                  placeholder="7"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateKey}
                  disabled={isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
      </div>
    </div>
  )
}

