import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Users,
  Bell,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AdminSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Visão Geral' },
    { id: 'bots', icon: Bot, label: 'Estatísticas dos Bots' },
    { id: 'bot', icon: Settings, label: 'Configurações' },
  ]

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-black px-4 py-6 overflow-y-auto flex flex-col">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-black font-bold">
          ES
        </div>
        <span className="font-bold text-white text-lg">Admin</span>
      </div>

      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'w-full justify-start gap-3 px-3 py-6 text-base',
              activeTab === item.id
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
