import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { User } from '@/types'
import { supabase, mapSupabaseUserToAppUser } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  login: () => void
  logout: () => void
  checkAuth: () => void
}

// Lista de IDs de Discord que são administradores
// Configure via variável de ambiente ou adicione manualmente
const getAdminIds = (): string[] => {
  const envAdmins = import.meta.env.VITE_ADMIN_IDS
  if (envAdmins) {
    return envAdmins.split(',').map((id: string) => id.trim())
  }
  // IDs de admin padrão (adicione seus IDs do Discord aqui)
  return []
}

// Função para verificar se um usuário é admin
const checkIsAdmin = (userId: string): boolean => {
  const adminIds = getAdminIds()
  return adminIds.includes(userId)
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_USER = 'berg_user'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Fallback de segurança - garantir que o loading sempre termine
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false)
      console.warn('Fallback: Forçando fim do loading após 5 segundos')
    }, 5000)
    
    return () => clearTimeout(fallbackTimer)
  }, [])

  // Load user from Supabase session on mount
  useEffect(() => {
    let isMounted = true
    
    const loadUser = async () => {
      try {
        // Timeout de segurança - garantir que o loading sempre termine
        const timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Timeout ao carregar usuário, finalizando loading...')
            setIsLoading(false)
          }
        }, 10000) // 10 segundos máximo

        // Verificar se há uma sessão ativa no Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Erro ao obter sessão:', sessionError)
          clearTimeout(timeoutId)
          if (isMounted) {
            setIsLoading(false)
          }
          return
        }

        if (session?.user) {
          // Buscar informações adicionais do usuário na tabela users
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', session.user.id)
            .single()

          // Se houver erro mas não for "não encontrado", logar
          if (userError && userError.code !== 'PGRST116') {
            console.error('Erro ao buscar usuário:', userError)
          }

          let isAdmin = false
          let userRecord = userData

          // Se não existe registro, criar um novo
          if (!userData) {
            // Pegar username do Discord
            const discordUsername = 
              session.user.user_metadata?.custom_claims?.global_name ||
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.preferred_username ||
              session.user.user_metadata?.name?.split('#')[0] ||
              session.user.user_metadata?.username ||
              session.user.email?.split('@')[0] ||
              'Usuario'
            
            // Pegar avatar do Discord (URL completa já vem pronta)
            const discordAvatar = 
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              session.user.user_metadata?.avatar ||
              null
            
            const newUser = {
              discord_id: session.user.id,
              username: discordUsername,
              discriminator: '0',
              avatar: discordAvatar,
              email: session.user.email || null,
              verified: session.user.email_confirmed_at ? true : false,
              is_admin: checkIsAdmin(session.user.id),
            }

            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert(newUser)
              .select()
              .single()

            if (createError) {
              console.error('Erro ao criar usuário:', createError)
              // Continuar mesmo com erro
            }

            if (createdUser) {
              userRecord = createdUser
              isAdmin = createdUser.is_admin
            } else {
              isAdmin = newUser.is_admin
            }
          } else {
            isAdmin = userData.is_admin || checkIsAdmin(session.user.id)
          }

          if (isMounted) {
            const appUser = mapSupabaseUserToAppUser(session.user, isAdmin, userRecord)
            setUser(appUser)
            localStorage.setItem(STORAGE_USER, JSON.stringify(appUser))
          }
        } else {
          // Tentar carregar do localStorage como fallback
          const storedUser = localStorage.getItem(STORAGE_USER)
          if (storedUser && isMounted) {
            try {
              const parsedUser = JSON.parse(storedUser)
              parsedUser.isAdmin = checkIsAdmin(parsedUser.id)
              setUser(parsedUser)
            } catch (error) {
              console.error('Failed to parse stored user', error)
              localStorage.removeItem(STORAGE_USER)
            }
          }
        }

        clearTimeout(timeoutId)
        if (isMounted) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error loading user:', error)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }

    // Escutar mudanças na autenticação do Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Buscar informações adicionais do usuário
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', session.user.id)
          .single()

        let isAdmin = false
        let userRecord = userData

        // Se não existe registro, criar um novo
        if (!userData) {
          // Pegar username do Discord
          const discordUsername = 
            session.user.user_metadata?.custom_claims?.global_name ||
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.preferred_username ||
            session.user.user_metadata?.name?.split('#')[0] ||
            session.user.user_metadata?.username ||
            session.user.email?.split('@')[0] ||
            'Usuario'
          
          // Pegar avatar do Discord (URL completa já vem pronta)
          const discordAvatar = 
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            session.user.user_metadata?.avatar ||
            null
          
          const newUser = {
            discord_id: session.user.id,
            username: discordUsername,
            discriminator: '0',
            avatar: discordAvatar,
            email: session.user.email || null,
            verified: session.user.email_confirmed_at ? true : false,
            is_admin: checkIsAdmin(session.user.id),
          }

          const { data: createdUser } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single()

          if (createdUser) {
            userRecord = createdUser
            isAdmin = createdUser.is_admin
          } else {
            isAdmin = newUser.is_admin
          }
        } else {
          isAdmin = userData.is_admin || checkIsAdmin(session.user.id)
          
          // Atualizar avatar e username caso tenham mudado no Discord
          const discordUsername = 
            session.user.user_metadata?.custom_claims?.global_name ||
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.preferred_username ||
            session.user.user_metadata?.name?.split('#')[0] ||
            session.user.user_metadata?.username ||
            userData.username
          
          const discordAvatar = 
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            session.user.user_metadata?.avatar ||
            userData.avatar
          
          // Atualizar apenas se mudou
          if (discordUsername !== userData.username || discordAvatar !== userData.avatar) {
            await supabase
              .from('users')
              .update({
                username: discordUsername,
                avatar: discordAvatar,
                email: session.user.email || userData.email,
              })
              .eq('discord_id', session.user.id)
            
            // Atualizar userRecord para refletir as mudanças
            userRecord = {
              ...userData,
              username: discordUsername,
              avatar: discordAvatar,
              email: session.user.email || userData.email,
            }
          }
        }

        const appUser = mapSupabaseUserToAppUser(session.user, isAdmin, userRecord)
        setUser(appUser)
        localStorage.setItem(STORAGE_USER, JSON.stringify(appUser))
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        localStorage.removeItem(STORAGE_USER)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async () => {
    try {
      // Garantir que a URL de redirecionamento use a porta correta
      const redirectUrl = `${window.location.origin}/auth/callback`
      console.log('🔗 URL de redirecionamento:', redirectUrl)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          scopes: 'identify email',
        },
      })

      if (error) {
        console.error('Erro ao fazer login:', error)
        alert('Erro ao fazer login com Discord. Verifique as configurações do Supabase.')
      }
    } catch (error) {
      console.error('Erro ao iniciar login:', error)
      alert('Erro ao iniciar login. Verifique as configurações do Supabase.')
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      localStorage.removeItem(STORAGE_USER)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Limpar mesmo se houver erro
      setUser(null)
      localStorage.removeItem(STORAGE_USER)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('discord_id', session.user.id)
          .single()

        let isAdmin = false
        let userRecord = userData
        if (userData) {
          isAdmin = userData.is_admin || checkIsAdmin(session.user.id)
        } else {
          isAdmin = checkIsAdmin(session.user.id)
        }

        const appUser = mapSupabaseUserToAppUser(session.user, isAdmin, userRecord)
        setUser(appUser)
        localStorage.setItem(STORAGE_USER, JSON.stringify(appUser))
      } else {
        setUser(null)
        localStorage.removeItem(STORAGE_USER)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      setUser(null)
      localStorage.removeItem(STORAGE_USER)
    }
  }, [])

  // O callback de OAuth é tratado pelo componente AuthCallback
  // Não precisamos processar aqui para evitar loops

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.isAdmin || false,
    login,
    logout,
    checkAuth,
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

