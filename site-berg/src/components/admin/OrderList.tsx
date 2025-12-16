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
    if (!settings?.mercadoPagoAccessToken) {
      toast({
        title: 'Erro',
        description: 'Access Token do Mercado Pago não configurado.',
        variant: 'destructive',
      })
      return
    }

    setIsChecking(true)
    try {
      // Buscar pedidos diretamente do banco para garantir dados atualizados
      const allOrders = await api.getOrders()
      const pendingOrders = allOrders.filter(
        (o) => o.status === 'pending' && o.paymentId
      )
      
      if (pendingOrders.length === 0) {
        toast({
          title: 'Nenhum pedido pendente',
          description: 'Não há pedidos pendentes com payment_id para verificar.',
        })
        setIsChecking(false)
        return
      }

      console.log(`🔍 Verificando ${pendingOrders.length} pedido(s) pendente(s)...`)

      let updatedCount = 0

      for (const order of pendingOrders) {
        try {
          const payment = await getPaymentStatus(
            settings.mercadoPagoAccessToken!,
            order.paymentId!
          )

          console.log(`📊 Status do pagamento ${order.paymentId}:`, {
            paymentStatus: payment.status,
            orderStatus: order.status,
            orderId: order.id,
          })

          if (payment.status === 'approved' && order.status !== 'completed') {
            console.log(`✅ Atualizando pedido ${order.id} para completed`)
            await updateOrder(order.id, { status: 'completed' })
            updatedCount++
          } else if ((payment.status === 'rejected' || payment.status === 'cancelled') && order.status !== 'failed') {
            console.log(`❌ Atualizando pedido ${order.id} para failed`)
            await updateOrder(order.id, { status: 'failed' })
            updatedCount++
          }
        } catch (error) {
          console.error(`Erro ao verificar pedido ${order.id}:`, error)
        }
      }

      // Recarregar dados após verificação
      await refreshData()
      
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Pedidos Recentes</CardTitle>
          <div className="flex items-center gap-2">
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
              Recarregar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckPendingOrders}
              disabled={isChecking}
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Verificando...' : 'Verificar Pendentes'}
            </Button>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Buscar pedidos..."
                className="pl-8 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-zinc-800">
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
      </CardContent>
    </Card>
  )
}
