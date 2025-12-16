import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Users,
  Bell,
  Bot,
  FileText,
  Upload,
  Terminal,
  CreditCard,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AdminSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral', path: '/admin' },
    { id: 'products', icon: Package, label: 'Produtos', path: '/admin' },
    { id: 'orders', icon: ShoppingCart, label: 'Pedidos', path: '/admin' },
    { id: 'payment', icon: CreditCard, label: 'Configuração de Pagamento', path: '/admin' },
    { id: 'bots', icon: Bot, label: 'Estatísticas dos Bots', path: '/admin' },
    { id: 'upload', icon: Upload, label: 'Enviar Aplicação', path: '/admin/upload' },
    { id: 'logs', icon: Terminal, label: 'Logs do Bot', path: '/admin' },
    { id: 'bot', icon: Settings, label: 'Configurações do Bot', path: '/admin' },
    { id: 'activity', icon: FileText, label: 'Registro de Atividades', path: '/admin' },
  ]

  const handleMenuClick = (item: typeof menuItems[0]) => {
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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-black px-4 py-6 overflow-y-auto flex flex-col">
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => (
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
            <item.icon className="h-5 w-5" />
            {item.label}
          </Button>
        ))}
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
  )
}
