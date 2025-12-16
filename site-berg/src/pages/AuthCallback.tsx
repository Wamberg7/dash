import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/stores/auth'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { checkAuth } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Verificar se há hash fragments na URL (OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const errorParam = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        if (errorParam) {
          console.error('Erro no callback:', errorParam, errorDescription)
          setError(errorDescription || errorParam)
          setTimeout(() => {
            navigate('/login?error=' + encodeURIComponent(errorDescription || errorParam))
          }, 2000)
          return
        }

        // Se tiver access_token no hash, processar
        if (accessToken) {
          // O Supabase processa automaticamente via hash fragments
          // Aguardar um pouco para o Supabase processar
          await new Promise(resolve => setTimeout(resolve, 800))
          
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession()

          if (sessionError) {
            console.error('Erro ao obter sessão:', sessionError)
            setError('Erro ao obter sessão')
            setTimeout(() => {
              navigate('/login?error=session_error')
            }, 2000)
            return
          }

          if (session) {
            // Recarregar dados do usuário
            await checkAuth()
            
            // Limpar hash da URL
            window.history.replaceState({}, '', '/')
            
            // Redirecionar para home
            setTimeout(() => {
              navigate('/', { replace: true })
            }, 500)
            return
          }
        }

        // Se não tiver hash, verificar se já tem sessão
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // Recarregar dados do usuário
          await checkAuth()
          
          // Login bem-sucedido, redirecionar para home
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 500)
        } else {
          // Sem sessão, redirecionar para login
          setTimeout(() => {
            navigate('/login', { replace: true })
          }, 1000)
        }
      } catch (error) {
        console.error('Erro ao processar callback:', error)
        setError('Erro ao processar login')
        setTimeout(() => {
          navigate('/login?error=callback_error', { replace: true })
        }, 2000)
      }
    }

    // Aguardar um pouco para garantir que o Supabase processou o hash
    const timer = setTimeout(() => {
      handleCallback()
    }, 200)

    return () => clearTimeout(timer)
  }, [navigate, checkAuth])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
        <p className="text-white">
          {error ? `Erro: ${error}. Redirecionando...` : 'Processando login...'}
        </p>
      </div>
    </div>
  )
}

