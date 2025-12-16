import { Navigate } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { Loader2 } from 'lucide-react'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/access-denied" replace />
  }

  return <>{children}</>
}

