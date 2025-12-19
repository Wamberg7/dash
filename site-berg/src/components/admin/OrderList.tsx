import { useAppStore } from '@/stores/main'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useMemo } from 'react'
import { getPaymentStatus } from '@/lib/mercadopago'
import { getCentralCartPaymentStatus } from '@/lib/centralcart'
import { useToast } from '@/hooks/use-toast'
import { UserProfile } from './UserProfile'
import { Order } from '@/types'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'

interface UserGroup {
  email: string
  name: string
  totalSpent: number
  orders: Order[]
}

export function OrderList() {
  const { orders, settings, updateOrder, refreshData } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserGroup | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  // Verificação automática desabilitada - usar apenas o botão "Verificar Pendentes"
  // Isso evita loops infinitos e sobrecarga do sistema

  const handleCheckPendingOrders = async () => {
    const gateway = settings?.paymentGateway || 'MercadoPago'
    
    // Verificar credenciais baseado no gateway
    if (gateway === 'CentralCart' || gateway === 'centralcart') {
      if (!settings?.centralCartApiToken) {
        toast({
          title: 'Erro',
          description: 'Token da API da CentralCart não configurado.',
          variant: 'destructive',
        })
        return
      }
    } else {
      if (!settings?.mercadoPagoAccessToken) {
        toast({
          title: 'Erro',
          description: 'Access Token do Mercado Pago não configurado.',
          variant: 'destructive',
        })
        return
      }
    }

    setIsChecking(true)
    try {
      // Buscar pedidos diretamente do banco para garantir dados atualizados
      const allOrders = await api.getOrders()
      // Verificar TODOS os pedidos pendentes, mas também verificar pedidos completed que podem ter sido atualizados na CentralCart
      // Isso garante que pedidos que foram aprovados na CentralCart mas ainda estão como pending local sejam atualizados
      const pendingOrders = allOrders.filter(
        (o) => (o.status === 'pending' || o.status === 'completed') && (o.paymentId || o.customerEmail)
      )
      
      if (pendingOrders.length === 0) {
        toast({
          title: 'Nenhum pedido pendente',
          description: 'Não há pedidos pendentes para verificar.',
        })
        setIsChecking(false)
        return
      }

      console.log(`🔍 Verificando ${pendingOrders.length} pedido(s) pendente(s) com gateway ${gateway}...`)

      let updatedCount = 0

      for (const order of pendingOrders) {
        try {
          let payment: any
          
          if (gateway === 'CentralCart' || gateway === 'centralcart') {
            // Para CentralCart, usar paymentId ou buscar pelo email
            payment = await getCentralCartPaymentStatus(
              settings.centralCartApiToken!,
              order.paymentId || '',
              order.paymentId,
              order.id,
              order.customerEmail
            )
          } else {
            // Mercado Pago
            if (!order.paymentId) {
              console.warn(`Pedido ${order.id} não tem paymentId, pulando...`)
              continue
            }
            payment = await getPaymentStatus(
              settings.mercadoPagoAccessToken!,
              order.paymentId
            )
          }

          console.log(`📊 Status do pagamento ${order.paymentId || 'N/A'}:`, {
            paymentStatus: payment.status,
            orderStatus: order.status,
            orderId: order.id,
            gateway,
          })

          // IMPORTANTE: Só atualizar para completed se o status da CentralCart for approved
          // NÃO reverter pedidos já aprovados localmente se a CentralCart ainda mostrar pending
          if (payment.status === 'approved') {
            if (order.status !== 'completed') {
              console.log(`✅✅✅ ATUALIZANDO PEDIDO ${order.id} PARA COMPLETED (status CentralCart: approved) ✅✅✅`)
              
              // Atualizar status para completed
              await updateOrder(order.id, { status: 'completed' })
              
              // Verificar se foi salvo corretamente
              try {
                const allOrders = await api.getOrders()
                const updatedOrder = allOrders.find((o) => o.id === order.id)
                if (updatedOrder && updatedOrder.status === 'completed') {
                  console.log(`✅✅✅ CONFIRMADO: Pedido ${order.id} está como completed no banco ✅✅✅`)
                } else {
                  console.error(`❌❌❌ ERRO: Pedido ${order.id} NÃO está como completed no banco! Status: ${updatedOrder?.status}`)
                  // Tentar atualizar novamente
                  await updateOrder(order.id, { status: 'completed' })
                }
              } catch (verifyErr) {
                console.error('❌ Erro ao verificar se pedido foi atualizado:', verifyErr)
              }
              
              // Se encontrou checkout_id e não tinha salvo, salvar agora
              if (payment.checkout_id && !order.paymentId) {
                await updateOrder(order.id, { paymentId: payment.checkout_id })
                console.log(`✅ Checkout ID salvo: ${payment.checkout_id}`)
              }
              
              updatedCount++
            } else {
              console.log(`✅ Pedido ${order.id} já está como completed, mantendo status`)
            }
          } else if ((payment.status === 'rejected' || payment.status === 'cancelled' || payment.status === 'failed') && order.status !== 'failed') {
            // Só atualizar para failed se o pedido ainda não foi aprovado localmente
            if (order.status !== 'completed') {
              console.log(`❌ Atualizando pedido ${order.id} para failed`)
              await updateOrder(order.id, { status: 'failed' })
              updatedCount++
            } else {
              console.log(`⚠️ Pedido ${order.id} está como completed localmente, mas CentralCart mostra ${payment.status}. Mantendo completed.`)
            }
          } else if (payment.status === 'pending' && order.status === 'completed') {
            // Se o pedido já está completed localmente mas CentralCart mostra pending,
            // pode ser delay na API. Não reverter para pending.
            console.log(`⚠️ Pedido ${order.id} está completed localmente, mas CentralCart mostra pending. Mantendo completed (pode ser delay na API).`)
          } else if (payment.status === 'pending' && order.status === 'pending') {
            // Log para debug - pedido ainda está pendente
            console.log(`⏳ Pedido ${order.id} ainda está pendente na CentralCart`)
          }
        } catch (error) {
          console.error(`Erro ao verificar pedido ${order.id}:`, error)
        }
      }

      // Recarregar dados após verificação para atualizar dashboard
      console.log('🔄 Recarregando dados para atualizar dashboard...')
      await refreshData()
      console.log('✅ Dados recarregados. Dashboard deve estar atualizado agora.')
      
      toast({
        title: 'Verificação concluída',
        description: `${updatedCount} pedido(s) atualizado(s) de ${pendingOrders.length} verificado(s).`,
      })
    } catch (error) {
      console.error('Erro ao verificar pedidos:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao verificar pedidos pendentes.',
        variant: 'destructive',
      })
    } finally {
      setIsChecking(false)
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Agrupar pedidos por email do cliente
  const userGroups = useMemo(() => {
    const groups = new Map<string, UserGroup>()
    
    filteredOrders.forEach((order) => {
      const email = order.customerEmail.toLowerCase()
      if (!groups.has(email)) {
        groups.set(email, {
          email: order.customerEmail,
          name: order.customerName,
          totalSpent: 0,
          orders: [],
        })
      }
      const group = groups.get(email)!
      group.orders.push(order)
      group.totalSpent += order.amount
    })
    
    return Array.from(groups.values())
  }, [filteredOrders])

  const handleCustomerClick = (email: string) => {
    const user = userGroups.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (user) {
      setSelectedUser(user)
    }
  }

  const handleOrderClick = (order: Order) => {
    // Se o pedido tem bot e está completo, pode redirecionar para configuração
    if (order.status === 'completed' && order.productName.includes('Bot')) {
      if (!order.botToken || !order.serverId || !order.ownerId) {
        navigate(`/bot-setup/${order.id}`)
      } else {
        navigate(`/bot-status/${order.id}`)
      }
    }
  }

  // Se um usuário está selecionado, mostrar o perfil
  if (selectedUser) {
    return (
      <UserProfile
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onOrderClick={handleOrderClick}
      />
    )
  }

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex flex-col gap-4">
          <CardTitle className="text-white text-lg md:text-xl">Pedidos Recentes</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar pedidos..."
                className="pl-8 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await refreshData()
                toast({
                  title: 'Dados recarregados',
                  description: 'Os pedidos foram atualizados do banco de dados.',
                })
              }}
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Recarregar</span>
              <span className="sm:hidden">Atualizar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckPendingOrders}
              disabled={isChecking}
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isChecking ? 'Verificando...' : 'Verificar Pendentes'}</span>
              <span className="sm:hidden">{isChecking ? 'Verificando...' : 'Verificar'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 md:px-6 pb-4 md:pb-6">
        {/* Desktop: Tabela */}
        <div className="hidden md:block rounded-md border border-zinc-800 overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                <TableHead className="text-zinc-400">ID</TableHead>
                <TableHead className="text-zinc-400">Data</TableHead>
                <TableHead className="text-zinc-400">Cliente</TableHead>
                <TableHead className="text-zinc-400">Produto</TableHead>
                <TableHead className="text-zinc-400">Valor</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Método</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-zinc-500"
                  >
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-zinc-800 hover:bg-zinc-900/30"
                  >
                    <TableCell className="font-mono text-xs text-zinc-500">
                      {order.id}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {format(new Date(order.date), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div 
                        className="flex flex-col cursor-pointer hover:text-blue-400 transition-colors"
                        onClick={() => handleCustomerClick(order.customerEmail)}
                      >
                        <span className="text-white font-medium">
                          {order.customerName}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {order.customerEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {order.productName}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(order.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                            ? 'Aprovado'
                            : order.status === 'failed'
                            ? 'Falhou'
                            : 'Pendente'}
                        </Badge>
                        {order.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              window.location.href = `/bot-setup/${order.id}`
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Configurar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-zinc-400">
                      {order.paymentMethod.replace('_', ' ')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-3 px-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              Nenhum pedido encontrado.
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-zinc-500 truncate">
                        {order.id}
                      </p>
                      <p className="text-sm text-zinc-300 mt-1">
                        {format(new Date(order.date), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
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
                        ? 'Aprovado'
                        : order.status === 'failed'
                        ? 'Falhou'
                        : 'Pendente'}
                    </Badge>
                  </div>

                  <div
                    className="cursor-pointer hover:text-blue-400 transition-colors"
                    onClick={() => handleCustomerClick(order.customerEmail)}
                  >
                    <p className="text-white font-medium truncate">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {order.customerEmail}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <div>
                      <p className="text-sm text-zinc-400">Produto</p>
                      <p className="text-white font-medium">{order.productName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-400">Valor</p>
                      <p className="text-white font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(order.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <div>
                      <p className="text-xs text-zinc-500 capitalize">
                        {order.paymentMethod.replace('_', ' ')}
                      </p>
                    </div>
                    {order.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          window.location.href = `/bot-setup/${order.id}`
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Configurar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
