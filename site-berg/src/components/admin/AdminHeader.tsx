import { ExternalLink, LogOut, User, Bot } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/stores/auth'

export function AdminHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-black/50 backdrop-blur-xl px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white hidden md:block">
          Painel Administrativo
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-zinc-800 bg-black text-white hover:bg-zinc-900"
          onClick={() => window.open('/', '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
          Ver Loja
        </Button>

        <div className="h-6 w-px bg-zinc-800 mx-2" />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full px-3 gap-2 text-white hover:bg-zinc-800 h-auto py-2"
                size="sm"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-white leading-none">
                    {user.username || 'Admin'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {user.email || 'admin@berg.com'}
                  </p>
                </div>
                <Avatar className="h-8 w-8 border border-zinc-700">
                  <AvatarImage
                    src={user.avatar || undefined}
                  />
                  <AvatarFallback className="bg-zinc-700 text-white text-xs">
                    {user.username
                      ? user.username.charAt(0).toUpperCase()
                      : 'AD'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-zinc-900 border-zinc-800 text-white"
            >
              <DropdownMenuLabel className="text-zinc-400">
                Minha Conta
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                className="text-white hover:bg-zinc-800 cursor-pointer"
                onClick={() => navigate('/my-bots')}
              >
                <Bot className="mr-2 h-4 w-4" />
                Meus Bots
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-white hover:bg-zinc-800 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <User className="mr-2 h-4 w-4" />
                Ver Loja
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                className="text-red-400 hover:bg-zinc-800 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
