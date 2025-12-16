import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Copy, ScanLine, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/stores/main'
import { Separator } from '@/components/ui/separator'
import { getPaymentStatus } from '@/lib/mercadopago'
import { getLivePixPaymentStatus } from '@/lib/livepix'
import { api } from '@/lib/api'
import { getApiUrl } from '@/lib/api-config'

export default function PaymentPix() {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pixQrCode, setPixQrCode] = useState<string | null>(null)
  const [pixCode, setPixCode] = useState<string>('')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const { orders, settings, updateOrder, refreshData } = useAppStore()

  // Buscar dados do pagamento Pix
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        // Tentar obter payment_id e gateway da URL
        const paymentIdFromUrl = searchParams.get('payment_id')
        const gateway = searchParams.get('gateway') || settings?.paymentGateway || 'MercadoPago'

        if (!paymentIdFromUrl) {
          toast({
            title: 'Erro',
            description: 'ID do pagamento não encontrado na URL.',
            variant: 'destructive',
          })
          setIsLoading(false)
          return
        }

        setPaymentId(paymentIdFromUrl)

        if (gateway === 'LivePix') {
          // Processar com LivePix
          if (!settings?.livepixClientId || !settings?.livepixClientSecret) {
            toast({
              title: 'Erro',
              description: 'Credenciais do LivePix não configuradas.',
              variant: 'destructive',
            })
            setIsLoading(false)
            return
          }

          // Buscar dados do pagamento no LivePix
          const payment = await getLivePixPaymentStatus(
            settings.livepixClientId,
            settings.livepixClientSecret,
            paymentIdFromUrl
          )

          // LivePix retorna qr_code e qr_code_base64
          if (payment.qr_code_base64) {
            setPixQrCode(payment.qr_code_base64)
          }
          if (payment.qr_code) {
            setPixCode(payment.qr_code)
          }
        } else {
          // Processar com Mercado Pago
          if (!settings?.mercadoPagoAccessToken) {
            toast({
              title: 'Erro',
              description: 'Access Token do Mercado Pago não configurado.',
              variant: 'destructive',
            })
            setIsLoading(false)
            return
          }

          // Buscar dados do pagamento no Mercado Pago
          const payment = await getPaymentStatus(
            settings.mercadoPagoAccessToken,
            paymentIdFromUrl
          )

          if (payment.point_of_interaction?.transaction_data) {
            const transactionData = payment.point_of_interaction.transaction_data
            const qrCodeBase64 = transactionData.qr_code_base64
            const qrCode = transactionData.qr_code

            if (qrCodeBase64) {
              setPixQrCode(qrCodeBase64)
            }
            if (qrCode) {
              setPixCode(qrCode)
            }
          } else {
            // Se não tiver transaction_data, tentar usar dados diretos do payment
            console.warn('Transaction data não encontrado no pagamento:', payment)
          }
        }
      } catch (error: any) {
        console.error('Erro ao carregar dados do pagamento:', error)
        toast({
          title: 'Erro',
          description: error?.message || 'Não foi possível carregar os dados do pagamento Pix.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (orderId) {
      loadPaymentData()
    } else {
      setIsLoading(false)
    }
  }, [orderId, searchParams, settings, toast])

  // Verificar status do pagamento periodicamente e atualizar pedido
  useEffect(() => {
    const gateway = searchParams.get('gateway') || settings?.paymentGateway || 'MercadoPago'
    
    // Verificar se tem as credenciais necessárias
    if (gateway === 'LivePix') {
      if (!paymentId || !settings?.livepixClientId || !settings?.livepixClientSecret || !orderId || isRedirecting) return
    } else {
      if (!paymentId || !settings?.mercadoPagoAccessToken || !orderId || isRedirecting) return
    }

    const checkPaymentStatus = async () => {
      try {
        let payment: any
        let currentStatus: string

        if (gateway === 'LivePix') {
          payment = await getLivePixPaymentStatus(
            settings!.livepixClientId!,
            settings!.livepixClientSecret!,
            paymentId!
          )
          currentStatus = payment.status
        } else {
          payment = await getPaymentStatus(
            settings!.mercadoPagoAccessToken!,
            paymentId!
          )
          currentStatus = payment.status
        }

        setPaymentStatus(currentStatus)

        console.log('Status do pagamento verificado:', {
          paymentId,
          status: currentStatus,
          orderId,
        })

        // Mapear status do LivePix para o formato esperado
        const isApproved = gateway === 'LivePix' 
          ? (currentStatus === 'paid' || currentStatus === 'approved')
          : (currentStatus === 'approved')

        if (isApproved) {
          // Prevenir múltiplos redirecionamentos
          setIsRedirecting(true)
          
          // Verificar se é um upgrade de RAM
          const upgradeType = searchParams.get('upgrade')
          const upgradeOrderId = searchParams.get('orderId')
          const upgradeRamMb = searchParams.get('ramMb')
          
          // Verificar se é uma renovação
          const renewOrderId = searchParams.get('renew')
          
          // Atualizar pedido no banco de dados
          try {
            if (upgradeType === 'ram' && upgradeOrderId && upgradeRamMb) {
              // Processar upgrade de RAM
              const orders = await api.getOrders()
              const originalOrder = orders.find((o) => o.id === upgradeOrderId)
              
              if (originalOrder) {
                const newRamMb = (originalOrder.botRamMb || 512) + Number(upgradeRamMb)
                await updateOrder(upgradeOrderId, { 
                  botRamMb: newRamMb,
                  // Manter outros campos
                })
                console.log(`✅ Upgrade de RAM aplicado: ${originalOrder.botRamMb || 512} MB → ${newRamMb} MB`)
                
                toast({
                  title: 'Upgrade aplicado!',
                  description: `Sua RAM foi atualizada para ${newRamMb} MB.`,
                })
                
                // Redirecionar para status do bot
                setTimeout(() => {
                  navigate(`/bot-status/${upgradeOrderId}`, { replace: true })
                }, 1500)
                return
              }
            }
            
            // Verificar se é renovação
            if (renewOrderId) {
              try {
                const result = await api.renewSubscription(renewOrderId)
                console.log('✅ Assinatura renovada:', result)
                
                toast({
                  title: 'Renovação concluída!',
                  description: `Sua assinatura foi renovada. Nova data de expiração: ${new Date(result.newExpiryDate).toLocaleDateString('pt-BR')}`,
                })
                
                // Recarregar dados
                await refreshData()
                
                // Redirecionar para meus bots
                setTimeout(() => {
                  navigate('/my-bots', { replace: true })
                }, 1500)
                return
              } catch (renewError: any) {
                console.error('Erro ao renovar assinatura:', renewError)
                toast({
                  title: 'Erro na renovação',
                  description: renewError.message || 'Não foi possível renovar a assinatura automaticamente.',
                  variant: 'destructive',
                })
              }
            }
            
            // Processamento normal de pedido
            await updateOrder(orderId, { status: 'completed' })
            console.log('Pedido atualizado para completed:', orderId)
            
            // Aguardar um pouco para garantir que a atualização foi persistida
            await new Promise(resolve => setTimeout(resolve, 800))
            
            // Recarregar dados do store para garantir sincronização
            await refreshData()
            
            toast({
              title: 'Pagamento aprovado!',
              description: 'Redirecionando para configuração do bot...',
            })
            
            // Redirecionar para página de configuração do bot (NÃO enviar automaticamente)
            // O bot só será enviado quando o usuário preencher token, server ID e nome do servidor
            setTimeout(() => {
              navigate(`/bot-setup/${orderId}`, { replace: true })
            }, 1500)
          } catch (updateError) {
            console.error('Erro ao atualizar pedido:', updateError)
            toast({
              title: 'Pagamento aprovado!',
              description: 'Seu pagamento foi confirmado, mas houve um erro ao atualizar o pedido.',
            })
            // Mesmo com erro, redirecionar para configuração
            setTimeout(() => {
              navigate(`/bot-setup/${orderId}`, { replace: true })
            }, 2000)
          }
        } else if (
          currentStatus === 'rejected' || 
          currentStatus === 'cancelled' || 
          currentStatus === 'refunded' ||
          (gateway === 'LivePix' && currentStatus === 'cancelled')
        ) {
          // Atualizar pedido para failed
          try {
            await updateOrder(orderId, { status: 'failed' })
            console.log('Pedido atualizado para failed:', orderId)
            toast({
              title: 'Pagamento rejeitado',
              description: 'O pagamento foi rejeitado ou cancelado.',
              variant: 'destructive',
            })
          } catch (updateError) {
            console.error('Erro ao atualizar pedido:', updateError)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error)
      }
    }

    // Verificar imediatamente e depois a cada 5 segundos
    checkPaymentStatus()
    const interval = setInterval(checkPaymentStatus, 5000)
    
    return () => {
      clearInterval(interval)
    }
  }, [paymentId, settings, orderId, updateOrder, navigate, toast, isRedirecting, refreshData, searchParams])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleCopy = () => {
    if (!pixCode) return
    
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    toast({
      title: 'Código copiado!',
      description: 'O código Pix foi copiado para sua área de transferência.',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white">Carregando dados do pagamento...</p>
        </div>
      </div>
    )
  }

  // Se estiver redirecionando, mostrar mensagem
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-pulse" />
          <h2 className="text-2xl font-bold text-white">Pagamento Aprovado!</h2>
          <p className="text-zinc-400">Redirecionando para configuração do bot...</p>
          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
        </div>
      </div>
    )
  }

  if (!pixQrCode && !pixCode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-950 border-zinc-800 max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-white">QR Code Pix não encontrado.</p>
            <Button onClick={() => navigate('/')}>Voltar para loja</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black bg-grid-pattern pt-24 pb-12 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-zinc-400 hover:text-white pl-0 self-start"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para loja
        </Button>

        {/* Main Payment Card */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-3xl shadow-2xl shadow-black/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-white">
              Concluir pagamento
            </CardTitle>
            <p className="text-zinc-400 text-sm">
              Use a câmera do seu celular para escanear o QR Code.
            </p>
            {paymentStatus && paymentStatus !== 'approved' && (
              <p className="text-yellow-400 text-xs mt-2">
                Status: {paymentStatus === 'pending' ? 'Aguardando pagamento' : paymentStatus === 'in_process' ? 'Processando...' : paymentStatus}
              </p>
            )}
            {paymentStatus === 'approved' && (
              <p className="text-green-400 text-xs mt-2 font-semibold">
                ✓ Pagamento aprovado! Redirecionando...
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            {/* QR Code Container */}
            {pixQrCode && (
              <div className="bg-white p-2 rounded-xl">
                <img
                  src={`data:image/png;base64,${pixQrCode}`}
                  alt="QR Code Pix"
                  className="w-48 h-48 md:w-56 md:h-56 object-contain"
                />
              </div>
            )}

            <div className="w-full space-y-4">
              <div className="relative flex items-center justify-center">
                <Separator className="bg-zinc-800 w-full absolute" />
                <span className="bg-zinc-950 px-3 text-xs text-zinc-500 relative z-10 font-medium">
                  Ou use o copia e cola
                </span>
              </div>

              {pixCode && (
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={pixCode}
                    className="bg-zinc-900/50 border-zinc-800 text-zinc-300 font-mono text-xs h-10 selection:bg-blue-500/30"
                  />
                  <Button
                    onClick={handleCopy}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shrink-0"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="bg-zinc-950 border-zinc-800 rounded-2xl shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-white">
              Como pagar com PIX?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <ScanLine className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Abra o aplicativo do seu banco e escaneie o QR Code acima.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Copy className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Copie o código Pix e cole no aplicativo do seu banco.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Após o pagamento, o pedido será processado automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

