import { ArrowLeft, ShoppingBag, ShieldCheck } from 'lucide-react'

import { Order } from '@/types'

import { Button } from '@/components/ui/button'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Badge } from '@/components/ui/badge'

import { format } from 'date-fns'

import { ptBR } from 'date-fns/locale'

interface UserGroup {
  email: string
  name: string
  totalSpent: number
  orders: Order[]
}

interface UserProfileProps {
  user: UserGroup
  onBack: () => void
  onOrderClick: (order: Order) => void
}

export function UserProfile({ user, onBack, onOrderClick }: UserProfileProps) {
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
        <h1 className="text-xl font-bold text-white">Perfil do Cliente</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card className="bg-zinc-950 border-zinc-800 lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 border-2 border-zinc-800 mb-4">
              <AvatarImage
                src={`https://img.usecurling.com/ppl/medium?gender=male&seed=${user.email.length}`}
              />
              <AvatarFallback className="text-2xl">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
            <p className="text-sm text-zinc-500 mb-6">{user.email}</p>

            <div className="w-full space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800">
                    <ShoppingBag className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-zinc-500">Total Pedidos</p>
                    <p className="text-sm font-bold text-white">
                      {user.orders.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800">
                    <ShieldCheck className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-zinc-500">Total Gasto</p>
                    <p className="text-sm font-bold text-white">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(user.totalSpent)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card className="bg-zinc-950 border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Histórico de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-zinc-800">
              <Table>
                <TableHeader className="bg-zinc-900/50">
                  <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                    <TableHead className="text-zinc-400">ID</TableHead>
                    <TableHead className="text-zinc-400">Produto</TableHead>
                    <TableHead className="text-zinc-400">Data</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-right text-zinc-400">
                      Valor
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="border-zinc-800 hover:bg-zinc-900/30 cursor-pointer transition-colors"
                      onClick={() => onOrderClick(order)}
                    >
                      <TableCell className="font-mono text-xs text-zinc-500">
                        {order.id}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {order.productName}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs">
                        {format(new Date(order.date), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-right text-white">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(order.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

