import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function Register() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  })

  // Se já estiver autenticado, redirecionar
  if (isAuthenticated) {
    navigate('/')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validações
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      })
      setIsLoading(false)
      return
    }

    try {
      // Criar conta no Supabase (sem confirmação de email)
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Não redirecionar para confirmação
          data: {
            username: formData.username,
            full_name: formData.username,
          },
        },
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // Verificar se há sessão (pode não haver se email confirmation estiver habilitado)
        const {
          data: { session },
        } = await supabase.auth.getSession()

        // Tentar criar registro na tabela users
        // Se não houver sessão, ainda tentamos inserir (a política deve permitir)
        let userData = null
        let userError = null

        try {
          const result = await supabase
            .from('users')
            .insert({
              discord_id: data.user.id,
              username:
                formData.username || data.user.email?.split('@')[0] || 'Usuario',
              discriminator: '0',
              avatar: null,
              email: formData.email,
              verified: data.user.email_confirmed_at ? true : false,
              is_admin: false,
            })
            .select()
            .single()

          userData = result.data
          userError = result.error
        } catch (err: any) {
          userError = err
          console.error('Erro ao inserir usuário:', err)
        }

        if (userError) {
          console.error('Erro ao criar usuário:', userError)
          console.error('Detalhes do erro:', JSON.stringify(userError, null, 2))

          // Se o erro for de política RLS, informar ao usuário
          if (userError.code === '42501' || userError.message?.includes('policy')) {
            toast({
              title: 'Erro de permissão',
              description:
                'Erro ao salvar dados. Execute o script fix-users-policy.sql no Supabase.',
              variant: 'destructive',
            })
          } else {
            toast({
              title: 'Aviso',
              description:
                'Conta criada, mas houve um problema ao salvar seus dados. O usuário será criado automaticamente no primeiro login.',
              variant: 'destructive',
            })
          }
        } else {
          console.log('Usuário criado com sucesso na tabela users:', userData)
        }

        toast({
          title: 'Conta criada com sucesso!',
          description: 'Sua conta foi criada! Você já pode fazer login.',
        })

        // Redirecionar para login após 1 segundo
        setTimeout(() => {
          navigate('/login')
        }, 1000)
      }
    } catch (error: any) {
      console.error('Erro ao criar conta:', error)
      toast({
        title: 'Erro ao criar conta',
        description:
          error.message || 'Ocorreu um erro ao criar sua conta. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Criar Conta
            </h1>
            <p className="text-zinc-400">
              Preencha os dados abaixo para criar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                Nome de Usuário
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Seu nome de usuário"
                value={formData.username}
                onChange={handleChange}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Senha
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirmar Senha
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-zinc-200 rounded-lg py-6 text-lg font-medium transition-colors"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-400">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="text-white hover:text-zinc-300 font-medium underline"
              >
                Fazer login
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 text-center">
              Ao criar uma conta, você concorda com nossos Termos de Serviço e
              Política de Privacidade
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

