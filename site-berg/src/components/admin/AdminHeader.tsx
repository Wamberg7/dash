import { useState, useEffect } from 'react'
import { ExternalLink, LogOut, User, Bot, Bell } from 'lucide-react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/stores/auth'
import { cn } from '@/lib/utils'

interface AdminHeaderProps {
  onMenuClick?: () => void
}

interface Notification {
  id: string
  title: string
  timestamp: string
  description: string
  deviceInfo?: string
}

interface DeviceInfo {
  fingerprint: string
  userAgent: string
  platform: string
  timestamp: number
}

const STORAGE_DEVICES = 'known_devices'
const STORAGE_NOTIFICATIONS = 'login_notifications'

// Função para gerar fingerprint do dispositivo
function getDeviceFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx?.fillText('Device fingerprint', 2, 2)
  const canvasFingerprint = canvas.toDataURL()
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvasFingerprint,
  ].join('|')
  
  return btoa(fingerprint).substring(0, 32)
}

// Função para obter informações do dispositivo
function getDeviceInfo(): DeviceInfo {
  const platform = navigator.platform || 'Unknown'
  const userAgent = navigator.userAgent || 'Unknown'
  
  return {
    fingerprint: getDeviceFingerprint(),
    userAgent,
    platform,
    timestamp: Date.now(),
  }
}

// Função para formatar data
function formatDate(date: Date): string {
  const day = date.getDate()
  const month = date.toLocaleDateString('pt-BR', { month: 'short' })
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day} ${month} às ${hours}:${minutes}`
}

// Função para obter localização (simplificada)
function getLocation(): string {
  // Em produção, você pode usar uma API de geolocalização
  // Por enquanto, vamos usar informações básicas
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return timezone || 'Localização desconhecida'
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notificationTab, setNotificationTab] = useState<'alertas' | 'atividades' | 'sistema' | 'novidades'>('sistema')
  const [notifications, setNotifications] = useState<{
    alertas: Notification[]
    atividades: Notification[]
    sistema: Notification[]
    novidades: Notification[]
  }>({
    alertas: [],
    atividades: [],
    sistema: [],
    novidades: [],
  })

  // Verificar novo login ao montar o componente
  useEffect(() => {
    if (!user) return

    const currentDevice = getDeviceInfo()
    const knownDevicesStr = localStorage.getItem(STORAGE_DEVICES)
    const knownDevices: DeviceInfo[] = knownDevicesStr ? JSON.parse(knownDevicesStr) : []
    
    // Verificar se este dispositivo já é conhecido
    const isKnownDevice = knownDevices.some(
      (device) => device.fingerprint === currentDevice.fingerprint
    )

    if (!isKnownDevice) {
      // Novo dispositivo detectado - criar notificação
      const now = new Date()
      const location = getLocation()
      
      const newNotification: Notification = {
        id: `login-${Date.now()}`,
        title: 'Novo login detectado',
        timestamp: formatDate(now),
        description: `Um novo login foi realizado na sua conta em ${location}.`,
        deviceInfo: `${currentDevice.platform} - ${currentDevice.userAgent.substring(0, 50)}...`,
      }

      // Adicionar à lista de notificações
      const notificationsStr = localStorage.getItem(STORAGE_NOTIFICATIONS)
      const allNotifications: Notification[] = notificationsStr ? JSON.parse(notificationsStr) : []
      allNotifications.unshift(newNotification) // Adicionar no início
      
      // Manter apenas as últimas 50 notificações
      const limitedNotifications = allNotifications.slice(0, 50)
      localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(limitedNotifications))

      // Adicionar dispositivo à lista de conhecidos
      knownDevices.push(currentDevice)
      // Manter apenas os últimos 10 dispositivos
      const limitedDevices = knownDevices.slice(-10)
      localStorage.setItem(STORAGE_DEVICES, JSON.stringify(limitedDevices))

      // Atualizar estado
      setNotifications((prev) => ({
        ...prev,
        sistema: [newNotification, ...prev.sistema],
      }))
    }

    // Carregar notificações existentes
    const notificationsStr = localStorage.getItem(STORAGE_NOTIFICATIONS)
    if (notificationsStr) {
      const allNotifications: Notification[] = JSON.parse(notificationsStr)
      setNotifications((prev) => ({
        ...prev,
        sistema: allNotifications,
      }))
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-black/50 backdrop-blur-xl border-b border-zinc-800 px-4 md:px-6 w-full">
        {/* Logo à esquerda */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center text-black font-bold text-xl tracking-tighter">
            ES
          </div>
          <span className="font-bold text-base text-white lowercase">
            berg
          </span>
        </div>

        {/* Ícones à direita */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Botão "Ver Loja" - apenas em desktop */}
          <Button
            variant="outline"
            size="sm"
            className="hidden lg:flex gap-2 border-zinc-800 bg-black text-white hover:bg-zinc-900"
            onClick={() => window.open('/', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Ver Loja
          </Button>

          {/* Separador - apenas em desktop */}
          <div className="hidden lg:block h-6 w-px bg-zinc-800 mx-2" />

          {/* Ícone de notificação */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-white hover:bg-zinc-800 rounded-full"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              align="end" 
              className="w-96 p-0 bg-white border-zinc-200 shadow-lg"
            >
              <div className="p-4">
                <h3 className="font-semibold text-black text-base mb-4">
                  Notificações
                </h3>
                
                {/* Tabs */}
                <div className="flex gap-1 mb-4 border-b border-zinc-200">
                  {[
                    { id: 'alertas', label: 'Alertas' },
                    { id: 'atividades', label: 'Atividades' },
                    { id: 'sistema', label: 'Sistema' },
                    { id: 'novidades', label: 'Novidades' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setNotificationTab(tab.id as typeof notificationTab)}
                      className={cn(
                        'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                        notificationTab === tab.id
                          ? 'text-black border-black'
                          : 'text-zinc-500 border-transparent hover:text-zinc-700'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Lista de notificações */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {notifications[notificationTab].length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications[notificationTab].map((notification) => (
                      <div key={notification.id} className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <Bell className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-black text-sm mb-1">
                            {notification.title}
                          </p>
                          <p className="text-xs text-zinc-500 mb-2">
                            {notification.timestamp}
                          </p>
                          <p className="text-sm text-zinc-600 leading-relaxed mb-1">
                            {notification.description}
                          </p>
                          {notification.deviceInfo && (
                            <p className="text-xs text-zinc-400 italic">
                              {notification.deviceInfo}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Perfil do usuário */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-full p-0 h-9 w-9 hover:bg-zinc-800"
                  size="sm"
                >
                  <Avatar className="h-9 w-9 border border-zinc-700 bg-zinc-800">
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
                {/* Botão "Ver Loja" - apenas em mobile/tablet */}
                <DropdownMenuItem
                  className="lg:hidden text-white hover:bg-zinc-800 cursor-pointer"
                  onClick={() => window.open('/', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver Loja
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white hover:bg-zinc-800 cursor-pointer"
                  onClick={() => navigate('/my-bots')}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  Meus Bots
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="hidden lg:flex text-white hover:bg-zinc-800 cursor-pointer"
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
