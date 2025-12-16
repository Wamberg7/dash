import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, User, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAuth } from '@/stores/auth'

const navItems = [
  { label: 'Início', href: '/#home' },
  { label: 'Planos', href: '/#products' },
  { label: 'Legal', href: '/#legal' },
  { label: 'Suporte', href: '/support' },
]

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogin = () => {
    setIsOpen(false)
    navigate('/login')
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    navigate('/')
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        isScrolled
          ? 'bg-black/80 backdrop-blur-md border-white/10 py-4'
          : 'bg-transparent border-transparent py-6',
      )}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          {/* Visual 'E' Logo */}
          <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center text-black font-bold text-xl tracking-tighter group-hover:opacity-90 transition-opacity">
            ES
          </div>
          <span className="font-bold text-xl text-white hidden md:block">
            Berg
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                // Se for uma âncora (#), fazer scroll suave
                if (item.href.startsWith('/#')) {
                  e.preventDefault()
                  const hash = item.href.split('#')[1]
                  // Se estiver na página inicial, fazer scroll direto
                  if (window.location.pathname === '/') {
                    const element = document.getElementById(hash)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' })
                    }
                  } else {
                    // Se estiver em outra página, navegar primeiro
                    navigate('/')
                    setTimeout(() => {
                      const el = document.getElementById(hash)
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }, 100)
                  }
                }
              }}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-full px-3 gap-2 text-white hover:bg-zinc-800"
                  size="sm"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={user.avatar || undefined}
                    />
                    <AvatarFallback className="bg-zinc-700 text-white text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user.username}</span>
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
                {isAdmin && (
                  <>
                    <DropdownMenuItem
                      className="text-white hover:bg-zinc-800 cursor-pointer"
                      onClick={() => navigate('/admin')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                  </>
                )}
                <DropdownMenuItem
                  className="text-red-400 hover:bg-zinc-800 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              className="rounded-full px-6 font-medium bg-white text-black hover:bg-zinc-200"
              size="sm"
              onClick={handleLogin}
            >
              Entrar
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-zinc-800"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[300px] bg-black border-zinc-800 text-white p-6"
          >
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <SheetDescription className="sr-only">
              Menu de navegação mobile
            </SheetDescription>
            <div className="flex flex-col gap-8 mt-8">
              <nav className="flex flex-col gap-6">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      setIsOpen(false)
                      // Se for uma âncora (#), fazer scroll suave
                      if (item.href.startsWith('/#')) {
                        e.preventDefault()
                        const hash = item.href.split('#')[1]
                        const element = document.getElementById(hash)
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' })
                        } else {
                          // Se não encontrar o elemento, navegar para a rota
                          navigate('/')
                          setTimeout(() => {
                            const el = document.getElementById(hash)
                            if (el) el.scrollIntoView({ behavior: 'smooth' })
                          }, 100)
                        }
                      }
                    }}
                    className="text-lg font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={user.avatar || undefined}
                      />
                      <AvatarFallback className="bg-zinc-700 text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.username}
                      </p>
                      {user.email && (
                        <p className="text-xs text-zinc-400 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-zinc-700 text-white hover:bg-zinc-800"
                    onClick={() => {
                      setIsOpen(false)
                      navigate('/my-bots')
                    }}
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    Meus Bots
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="w-full border-zinc-700 text-white hover:bg-zinc-800"
                      onClick={() => {
                        setIsOpen(false)
                        navigate('/admin')
                      }}
                    >
                      Dashboard
                    </Button>
                  )}
                  <Button
                    className="rounded-full w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              ) : (
                <Button
                  className="rounded-full w-full bg-white text-black hover:bg-zinc-200"
                  onClick={handleLogin}
                >
                  Entrar
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
