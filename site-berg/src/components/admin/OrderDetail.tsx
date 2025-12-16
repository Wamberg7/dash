import { ArrowLeft, Copy, CheckCircle2, Bot, Server, User, Calendar, DollarSign, CreditCard, FileText, Wifi, WifiOff, AlertTriangle, Edit, Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Order } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/main'
import { useAuth } from '@/stores/auth'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OrderDetailProps {
  order: Order
  onBack: () => void
}

export function OrderDetail({ order, onBack }: OrderDetailProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { updateOrder, orders, refreshData } = useAppStore()
  const { isAdmin } = useAuth()
  const [copied, setCopied] = useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isEditingExpiry, setIsEditingExpiry] = useState(false)
  const [newExpiryDate, setNewExpiryDate] = useState('')
  const [isUpdatingExpiry, setIsUpdatingExpiry] = useState(false)
  
  // Buscar o pedido mais atualizado do store para evitar usar props desatualizadas
  const currentOrder = orders.find((o) => o.id === order.id) || order

  // Inicializar data de expiração quando entrar em modo de edição
  useEffect(() => {
    if (isEditingExpiry && currentOrder.subscriptionExpiryDate) {
      const date = new Date(currentOrder.subscriptionExpiryDate)
      const dateString = date.toISOString().split('T')[0]
      setNewExpiryDate(dateString)
    }
  }, [isEditingExpiry, currentOrder.subscriptionExpiryDate])

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    toast({
      title: 'Copiado!',
      description: `${label} copiado para a área de transferência.`,
    })
    setTimeout(() => setCopied(null), 2000)
  }

  const getStatusBadge = () => {
    switch (currentOrder.status) {
      case 'completed':
        return (
          <Badge className="bg-green-900/30 text-green-400 border-green-900">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Aprovado
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-900/30 text-red-400 border-red-900">
            Falhou
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-900">
            Pendente
          </Badge>
        )
      default:
        return null
    }
  }

  const getBotStatusBadge = () => {
    if (!currentOrder.botStatus) return null
    
    switch (currentOrder.botStatus) {
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

  const handleBotStatusChange = async (newStatus: string) => {
    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem alterar o status do bot.',
        variant: 'destructive',
      })
      return
    }

    // Não fazer nada se o status for o mesmo
    if (currentOrder.botStatus === newStatus) {
      console.log(`ℹ️ Status já é "${newStatus}", não precisa atualizar`)
      return
    }

    // Prevenir múltiplas atualizações simultâneas
    if (isUpdatingStatus) {
      console.log('⚠️ Atualização já em andamento, ignorando...')
      return
    }

    setIsUpdatingStatus(true)
    try {
      console.log(`🔄 Atualizando status do bot ${currentOrder.id} de "${currentOrder.botStatus}" para "${newStatus}"`)
      await updateOrder(currentOrder.id, { botStatus: newStatus as Order['botStatus'] })
      console.log(`✅ Status do bot ${currentOrder.id} atualizado com sucesso`)
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
      // Sempre resetar o estado de loading, mesmo se houver erro
      // Usar setTimeout para garantir que o estado seja resetado após o próximo render
      setTimeout(() => {
        setIsUpdatingStatus(false)
      }, 100)
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

  const handleUpdateExpiry = async () => {
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

      await api.updateExpiryDate(currentOrder.id, expiryDateTime.toISOString())
      
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-white">Detalhes do Pedido</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info Card */}
        <Card className="bg-zinc-950 border-zinc-800 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Informações do Pedido</CardTitle>
              {getStatusBadge()}
            </div>
            <CardDescription className="text-zinc-400">
              ID: {order.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <FileText className="w-4 h-4" />
                  Produto
                </div>
                <p className="text-white font-medium">{order.productName}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <DollarSign className="w-4 h-4" />
                  Valor
                </div>
                <p className="text-white font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(order.amount)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  Data
                </div>
                <p className="text-white font-medium">
                  {format(new Date(order.date), 'dd/MM/yyyy HH:mm', {
                    locale: ptBR,
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <CreditCard className="w-4 h-4" />
                  Método de Pagamento
                </div>
                <p className="text-white font-medium capitalize">
                  {order.paymentMethod.replace('_', ' ')}
                </p>
              </div>
            </div>

            {order.paymentId && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <FileText className="w-4 h-4" />
                  ID do Pagamento
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-mono text-sm">{order.paymentId}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(order.paymentId!, 'ID do Pagamento')}
                    className="h-6 w-6 text-zinc-400 hover:text-zinc-300"
                  >
                    {copied === 'ID do Pagamento' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div className="pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">Cliente</h3>
              <div className="space-y-2">
                <p className="text-white">{order.customerName}</p>
                <p className="text-zinc-400 text-sm">{order.customerEmail}</p>
              </div>
            </div>

            {/* Subscription Info */}
            {currentOrder.subscriptionExpiryDate && (
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-400">Assinatura</h3>
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
                      Data atual: {format(new Date(currentOrder.subscriptionExpiryDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      Data de Expiração
                    </div>
                    <p className="text-white font-medium">
                      {format(new Date(currentOrder.subscriptionExpiryDate), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </p>
                    {currentOrder.subscriptionStartDate && (
                      <p className="text-zinc-500 text-xs">
                        Início: {format(new Date(currentOrder.subscriptionStartDate), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bot Configuration Card */}
        {order.productName.includes('Bot') && (
          <Card className="bg-zinc-950 border-zinc-800 lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Configuração do Bot</CardTitle>
                {getBotStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.botToken ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Bot className="w-4 h-4" />
                      Token do Bot
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono text-xs truncate flex-1">
                        {order.botToken.substring(0, 20)}...
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(order.botToken!, 'Token')}
                        className="h-6 w-6 text-zinc-400 hover:text-zinc-300"
                      >
                        {copied === 'Token' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
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
                        <p className="text-white font-mono text-sm">{order.serverId}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(order.serverId!, 'Server ID')}
                          className="h-6 w-6 text-zinc-400 hover:text-zinc-300"
                        >
                          {copied === 'Server ID' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
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
                        <p className="text-white font-mono text-sm">{order.ownerId}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(order.ownerId!, 'Owner ID')}
                          className="h-6 w-6 text-zinc-400 hover:text-zinc-300"
                        >
                          {copied === 'Owner ID' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Controle de Status do Bot (Apenas para Admin) */}
                  {isAdmin && currentOrder.botToken && (
                    <div className="space-y-2 pt-4 border-t border-zinc-800">
                      <label className="text-sm text-zinc-400">Status do Bot</label>
                      <Select
                        value={currentOrder.botStatus || 'waiting'}
                        onValueChange={handleBotStatusChange}
                        disabled={isUpdatingStatus}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                  )}

                  {order.status === 'completed' && (
                    <Button
                      className="w-full mt-4 bg-white text-black hover:bg-zinc-200"
                      onClick={() => navigate(`/bot-status/${order.id}`)}
                    >
                      Ver Status do Bot
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-400 text-sm mb-4">
                    Bot ainda não configurado
                  </p>
                  {order.status === 'completed' && (
                    <Button
                      className="w-full bg-white text-black hover:bg-zinc-200"
                      onClick={() => navigate(`/bot-setup/${order.id}`)}
                    >
                      Configurar Bot
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

