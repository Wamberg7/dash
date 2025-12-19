import { useEffect, useState } from 'react'
import { Settings, RefreshCw, Eye, EyeOff, Plus, Loader2 } from 'lucide-react'
import { BotSettings } from '@/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import { getSavedAppIds } from './BotAppManager'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface User {
  id: string
  discord_id: string
  username: string
  email: string | null
}

export function BotSettingsForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [squareCloudToken, setSquareCloudToken] = useState('')
  const [newAppId, setNewAppId] = useState('')
  const [isAddingApp, setIsAddingApp] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('none')
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

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

  // Carregar configurações do bot
  useEffect(() => {
    async function loadBotSettings() {
      try {
        setIsLoading(true)
        const settings = await api.getBotSettings()
        setSquareCloudToken(settings.squarecloudAccessToken || '')
      } catch (error: any) {
        console.error('Erro ao carregar configurações do bot:', error)
        toast({
          title: 'Erro ao carregar',
          description: error?.message || 'Não foi possível carregar as configurações.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadBotSettings()
  }, [toast])

  async function handleSave() {
    try {
      setIsSaving(true)
      const currentSettings = await api.getBotSettings()
      // Limpar o token antes de salvar
      const cleanToken = squareCloudToken.trim().replace(/\n/g, '').replace(/\r/g, '')
      const updatedSettings: BotSettings = {
        ...currentSettings,
        squarecloudAccessToken: cleanToken,
      }
      await api.updateBotSettings(updatedSettings)
      toast({
        title: 'Sucesso',
        description: 'Token da SquareCloud salvo com sucesso!',
      })
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddAppId = async () => {
    const trimmedId = newAppId.trim()
    if (!trimmedId) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um ID válido.',
        variant: 'destructive',
      })
      return
    }

    setIsAddingApp(true)
    
    // Verificar se já existe no banco de dados
    try {
      const exists = await api.checkApplicationExists(trimmedId)
      if (exists) {
        setIsAddingApp(false)
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
        setIsAddingApp(false)
        toast({
          title: 'Erro',
          description: 'Token da SquareCloud não configurado. Configure o token primeiro.',
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
      setIsAddingApp(false)
      toast({
        title: 'Sucesso',
        description: 'Aplicação adicionada com sucesso!',
      })
    } catch (error: any) {
      setIsAddingApp(false)
      console.error('Erro ao adicionar aplicação:', error)
      toast({
        title: 'Erro',
        description: error.message || 'ID inválido ou aplicação não encontrada. Verifique o ID e o token.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações da SquareCloud
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Configure o token da API da SquareCloud para gerenciar seus bots.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="squarecloud-token" className="text-white">
              Token da API SquareCloud
            </Label>
            <div className="relative">
              <Input
                id="squarecloud-token"
                type={showToken ? 'text' : 'password'}
                value={squareCloudToken}
                onChange={(e) => setSquareCloudToken(e.target.value)}
                placeholder="Cole seu token da API SquareCloud aqui"
                className="bg-zinc-900 border-zinc-800 text-white pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4 text-zinc-400" />
                ) : (
                  <Eye className="h-4 w-4 text-zinc-400" />
                )}
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              Você pode encontrar seu token da API no{' '}
              <a
                href="https://squarecloud.app/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                dashboard da SquareCloud
              </a>
              {' '}em <strong>Settings</strong> → <strong>API</strong>. Certifique-se de copiar o token completo sem espaços.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-white text-black hover:bg-zinc-200"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Token'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Campo para adicionar ID da aplicação */}
      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Aplicação
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Adicione o ID da aplicação da SquareCloud para visualizar suas estatísticas.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-id" className="text-white">
              ID da Aplicação
            </Label>
            <div className="flex gap-3">
              <Input
                id="app-id"
                type="text"
                value={newAppId}
                onChange={(e) => setNewAppId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddAppId()
                  }
                }}
                placeholder="Cole o ID da aplicação aqui (ex: 64d0c750212742ca8704fb458c9771af)"
                className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                disabled={isAddingApp}
              />
              <Button
                onClick={handleAddAppId}
                disabled={isAddingApp || !newAppId.trim()}
                className="bg-white text-black hover:bg-zinc-200"
              >
                {isAddingApp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-user-select" className="text-zinc-300">
                Vincular a usuário (opcional)
              </Label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={isAddingApp || isLoadingUsers}
              >
                <SelectTrigger
                  id="settings-user-select"
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
            <p className="text-xs text-zinc-500">
              Você pode encontrar o ID da aplicação no{' '}
              <a
                href="https://squarecloud.app/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                dashboard da SquareCloud
              </a>
              . O ID é um código de 32 caracteres hexadecimal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
