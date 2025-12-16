import { useEffect, useState } from 'react'
import { Plus, X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const STORAGE_APP_IDS = 'squarecloud_app_ids'

interface User {
  id: string
  discord_id: string
  username: string
  email: string | null
}

export function BotAppManager() {
  const { toast } = useToast()
  const [appIds, setAppIds] = useState<string[]>([])
  const [newAppId, setNewAppId] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  useEffect(() => {
    // Carregar IDs salvos do localStorage
    const saved = localStorage.getItem(STORAGE_APP_IDS)
    if (saved) {
      try {
        const ids = JSON.parse(saved)
        setAppIds(Array.isArray(ids) ? ids : [])
      } catch (e) {
        console.error('Erro ao carregar IDs salvos:', e)
      }
    }

    // Carregar usuários
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

  const saveAppIds = (ids: string[]) => {
    setAppIds(ids)
    localStorage.setItem(STORAGE_APP_IDS, JSON.stringify(ids))
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
      // Verificar se o ID é válido fazendo uma requisição à API
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

      // Tentar buscar informações da aplicação para validar o ID
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

      // Se chegou aqui, o ID é válido
      const updatedIds = [...appIds, trimmedId]
      saveAppIds(updatedIds)
      setNewAppId('')
      setSelectedUserId('none')
      setIsAdding(false)
      toast({
        title: 'Sucesso',
        description: 'Aplicação adicionada com sucesso!',
      })
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

  const handleRemoveAppId = (idToRemove: string) => {
    const updatedIds = appIds.filter((id) => id !== idToRemove)
    saveAppIds(updatedIds)
    toast({
      title: 'Sucesso',
      description: 'Aplicação removida da lista.',
    })
  }

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Gerenciar IDs das Aplicações</CardTitle>
        <CardDescription className="text-zinc-400">
          Adicione os IDs das aplicações da SquareCloud que deseja monitorar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cole o ID da aplicação (ex: 64d0c750212742ca8704fb458c9771af)"
              value={newAppId}
              onChange={(e) => setNewAppId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddAppId()
                }
              }}
              className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
              disabled={isAdding}
            />
            <Button
              onClick={handleAddAppId}
              disabled={isAdding || !newAppId.trim()}
              className="bg-white text-black hover:bg-zinc-200"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-select" className="text-zinc-300">
              Vincular a usuário (opcional)
            </Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={isAdding || isLoadingUsers}
            >
              <SelectTrigger
                id="user-select"
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
        </div>

        {appIds.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">IDs adicionados ({appIds.length}):</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {appIds.map((id) => (
                <div
                  key={id}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-3"
                >
                  <code className="text-sm text-white font-mono">{id}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAppId(id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {appIds.length === 0 && (
          <div className="text-center py-8 border-t border-zinc-800">
            <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">
              Nenhuma aplicação adicionada. Adicione IDs para começar a monitorar.
            </p>
          </div>
        )}

        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mt-4">
          <p className="text-xs text-blue-400">
            <strong>Dica:</strong> Você pode encontrar o ID da aplicação na URL do dashboard da SquareCloud ou
            nas informações da aplicação. O ID geralmente tem 32 caracteres hexadecimal.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Função helper para obter os IDs salvos
export function getSavedAppIds(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_APP_IDS)
    if (saved) {
      const ids = JSON.parse(saved)
      return Array.isArray(ids) ? ids : []
    }
  } catch (e) {
    console.error('Erro ao carregar IDs salvos:', e)
  }
  return []
}


