import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Bot,
  FileText,
  Upload,
  CreditCard,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef } from 'react'

interface AdminSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // Itens principais para mobile (barra inferior)
  const mobileMenuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { id: 'products', icon: Package, label: 'Produtos', path: '/admin' },
    { id: 'orders', icon: ShoppingCart, label: 'Pedidos', path: '/admin' },
    { id: 'payment', icon: CreditCard, label: 'Gateway', path: '/admin' },
    { id: 'more', icon: Bot, label: 'Mais', path: '/admin', isMoreButton: true },
  ]

  // Itens do menu "Mais" para mobile
  const moreMenuItems = [
    { id: 'bots', icon: Bot, label: 'Estatísticas dos Bots', path: '/admin' },
    { id: 'upload', icon: Upload, label: 'Enviar Aplicação', path: '/admin/upload' },
    { id: 'bot', icon: Settings, label: 'Configurações do Bot', path: '/admin' },
    { id: 'activity', icon: FileText, label: 'Registro de Atividades', path: '/admin' },
  ]

  // Todos os itens para desktop
  const desktopMenuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral', path: '/admin' },
    { id: 'products', icon: Package, label: 'Produtos', path: '/admin' },
    { id: 'orders', icon: ShoppingCart, label: 'Pedidos', path: '/admin' },
    { id: 'payment', icon: CreditCard, label: 'Gateway', path: '/admin' },
    { id: 'bots', icon: Bot, label: 'Estatísticas dos Bots', path: '/admin' },
    { id: 'upload', icon: Upload, label: 'Enviar Aplicação', path: '/admin/upload' },
    { id: 'bot', icon: Settings, label: 'Configurações do Bot', path: '/admin' },
    { id: 'activity', icon: FileText, label: 'Registro de Atividades', path: '/admin' },
  ]

  const handleMenuClick = (item: typeof desktopMenuItems[0] | typeof moreMenuItems[0]) => {
    // Se for o botão "Mais", apenas abrir/fechar o menu
    if ('isMoreButton' in item && item.isMoreButton) {
      setIsMoreMenuOpen(!isMoreMenuOpen)
      return
    }

    // Fechar menu "Mais" se estiver aberto
    setIsMoreMenuOpen(false)

    if (item.id === 'upload' && item.path === '/admin/upload') {
      navigate(item.path)
    } else {
      setActiveTab(item.id)
      if (location.pathname !== '/admin') {
        navigate('/admin')
      }
    }
  }

  // Determinar activeTab baseado na rota atual
  const currentActiveTab = location.pathname === '/admin/upload' 
    ? 'upload' 
    : activeTab

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false)
      }
    }

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMoreMenuOpen])

  return (
    <>
      {/* Menu "Mais" para mobile - aparece acima da barra */}
      {isMoreMenuOpen && (
        <>
          {/* Overlay escuro */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          
          {/* Menu vertical */}
          <div
            ref={moreMenuRef}
            className="lg:hidden fixed bottom-16 left-4 right-4 z-50 bg-white rounded-xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto border border-zinc-200"
            style={{
              animation: 'slideUp 0.2s ease-out',
            }}
          >
            <div className="py-1">
              {moreMenuItems.map((item, index) => {
                const Icon = item.icon
                const isActive = currentActiveTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                      isActive
                        ? 'bg-zinc-100 text-zinc-900 font-semibold'
                        : 'text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 flex-shrink-0',
                      isActive ? 'text-zinc-700' : 'text-zinc-500'
                    )} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
          <style>{`
            @keyframes slideUp {
              from {
                transform: translateY(20px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}</style>
        </>
      )}

      {/* Barra de navegação inferior para mobile - sempre visível */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800 px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {mobileMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentActiveTab === item.id || (item.id === 'more' && isMoreMenuOpen)
            const isMoreButton = 'isMoreButton' in item && item.isMoreButton
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                  isActive
                    ? 'text-white bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Sidebar lateral para desktop */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-black px-4 py-6 overflow-y-auto flex-col'
        )}
      >
        {/* Logo e nome do site */}
        <div className="flex flex-col items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-white">ES</span>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">ES Berg</h2>
            <p className="text-xs text-zinc-500">Painel Admin</p>
          </div>
        </div>

        {/* Menu desktop */}
        <nav className="space-y-2 flex-1">
          {desktopMenuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => handleMenuClick(item)}
                className={cn(
                  'w-full justify-start gap-3 px-3 py-6 text-base',
                  currentActiveTab === item.id
                    ? 'bg-zinc-900 text-white font-medium'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Button>
            )
          })}
        </nav>

        <div className="border-t border-zinc-800 pt-4 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-zinc-500 hover:text-red-400 hover:bg-red-900/10"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>
    </>
  )
}
