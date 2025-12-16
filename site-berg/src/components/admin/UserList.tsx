import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/stores/main'
import { Users, Search, ShoppingBag } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserProfile } from '@/components/admin/UserProfile'
import { OrderDetail } from '@/components/admin/OrderDetail'
import { Order } from '@/types'

interface UserGroup {
  email: string
  name: string
  totalSpent: number
  orders: Order[]
}

type ViewState = 'list' | 'profile' | 'order'

export function UserList() {
  const { orders } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [view, setView] = useState<ViewState>('list')
  const [selectedUser, setSelectedUser] = useState<UserGroup | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Group orders by email to mimic "Users"
  const usersMap = orders.reduce<Record<string, UserGroup>>((acc, order) => {
    if (!acc[order.customerEmail]) {
      acc[order.customerEmail] = {
        email: order.customerEmail,
        name: order.customerName,
        totalSpent: 0,
        orders: [],
      }
    }
    acc[order.customerEmail].totalSpent += order.amount
    acc[order.customerEmail].orders.push(order)
    return acc
  }, {})

  const users = Object.values(usersMap).filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleUserClick = (user: UserGroup) => {
    setSelectedUser(user)
    setView('profile')
  }

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setView('order')
  }

  const handleBackToProfile = () => {
    setSelectedOrder(null)
    setView('profile')
  }

  const handleBackToList = () => {
    setSelectedUser(null)
    setView('list')
  }

  if (view === 'order' && selectedOrder) {
    return <OrderDetail order={selectedOrder} onBack={handleBackToProfile} />
  }

  if (view === 'profile' && selectedUser) {
    return (
      <UserProfile
        user={selectedUser}
        onBack={handleBackToList}
        onOrderClick={handleOrderClick}
      />
    )
  }

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Base de Usuários
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-8 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-zinc-800">
          <Table>
            <TableHeader className="bg-zinc-900/50">
              <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                <TableHead className="text-zinc-400">Cliente</TableHead>
                <TableHead className="text-zinc-400">Total Gasto</TableHead>
                <TableHead className="text-zinc-400">Bots Adquiridos</TableHead>
                <TableHead className="text-right text-zinc-400">
                  Pedidos
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-zinc-500"
                  >
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.email}
                    className="border-zinc-800 hover:bg-zinc-900/30 cursor-pointer transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-zinc-700">
                          <AvatarImage
                            src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${user.email.length}`}
                          />
                          <AvatarFallback>
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {user.name}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(user.totalSpent)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {user.orders.map((order, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-zinc-700"
                          >
                            {order.productName}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-zinc-400">
                        <ShoppingBag className="w-4 h-4" />
                        <span className="text-sm">{user.orders.length}</span>
                      </div>
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

