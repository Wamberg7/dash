import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Copy, ScanLine, CheckCircle2, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/stores/main'
import { Separator } from '@/components/ui/separator'
import { getPaymentStatus } from '@/lib/mercadopago'
import { getLivePixPaymentStatus } from '@/lib/livepix'
import { getCentralCartPaymentStatus } from '@/lib/centralcart'
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
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const { orders, settings, updateOrder, refreshData } = useAppStore()

  // Buscar dados do pagamento Pix
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        // Tentar obter payment_id e gateway da URL
        const paymentIdFromUrl = searchParams.get('payment_id')
        const gateway = searchParams.get('gateway') || settings?.paymentGateway || 'MercadoPago'

        setPaymentId(paymentIdFromUrl)

        // CentralCart - buscar dados do localStorage ou da API
        if (gateway === 'CentralCart' || gateway === 'centralcart') {
          // Tentar buscar do localStorage primeiro
          const storedPixData = localStorage.getItem(`pix_payment_${orderId}`)
          if (storedPixData) {
            try {
              const pixData = JSON.parse(storedPixData)
              if (pixData.qr_code_base64) {
                setPixQrCode(pixData.qr_code_base64)
              }
              if (pixData.pix_code) {
                setPixCode(pixData.pix_code)
              }
              if (pixData.payment_id) {
                setPaymentId(pixData.payment_id)
              }
              setIsLoading(false)
              console.log('✅ Dados PIX carregados do localStorage')
              return
            } catch (error) {
              console.error('Erro ao ler dados do localStorage:', error)
            }
          }

          // Se não tiver no localStorage, tentar buscar da API
          // Primeiro tentar buscar o paymentId do pedido
          if (orderId && settings?.centralCartApiToken) {
            try {
              const orders = await api.getOrders()
              const currentOrder = orders.find(o => o.id === orderId)
              const checkoutId = currentOrder?.paymentId
              
              // Usar paymentId da URL ou do pedido
              const idToUse = paymentIdFromUrl || checkoutId
              
              if (idToUse) {
                const paymentStatus = await getCentralCartPaymentStatus(
                  settings.centralCartApiToken,
                  idToUse,
                  checkoutId,
                  orderId
                )
                
                if (paymentStatus.qr_code_base64) {
                  setPixQrCode(paymentStatus.qr_code_base64)
                }
                if (paymentStatus.pix_code) {
                  setPixCode(paymentStatus.pix_code)
                }
                setPaymentStatus(paymentStatus.status)
                
                // Atualizar paymentId se não estava definido
                if (!paymentIdFromUrl && checkoutId) {
                  setPaymentId(checkoutId)
                }
              } else {
                console.warn('⚠️ Nenhum ID disponível para buscar status do pagamento CentralCart')
              }
            } catch (error: any) {
              console.error('Erro ao buscar status do pagamento CentralCart:', error)
              // Não mostrar toast de erro aqui, apenas log
            }
          }

          setIsLoading(false)
          return
        }

        if (!paymentIdFromUrl) {
          toast({
            title: 'Erro',
            description: 'ID do pagamento não encontrado na URL.',
            variant: 'destructive',
          })
          setIsLoading(false)
          return
        }

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
    } else if (gateway === 'CentralCart' || gateway === 'centralcart') {
      // Para CentralCart, precisamos pelo menos do orderId e do token
      // O paymentId pode vir do pedido se não estiver na URL
      if (!settings?.centralCartApiToken || !orderId || isRedirecting) return
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
        } else if (gateway === 'CentralCart' || gateway === 'centralcart') {
          // Buscar orderId para usar como fallback se paymentId não funcionar
          let checkoutId: string | undefined
          let customerEmail: string | undefined
          try {
            const orders = await api.getOrders()
            const currentOrder = orders.find(o => o.id === orderId)
            checkoutId = currentOrder?.paymentId
            customerEmail = currentOrder?.customerEmail
          } catch (err) {
            console.warn('Erro ao buscar pedidos:', err)
          }
          
          // Usar paymentId da URL, ou do pedido, ou orderId como último recurso
          const idToCheck = paymentId || checkoutId || orderId
          
          console.log('🔍 Verificando status CentralCart:', {
            paymentIdFromUrl: paymentId,
            paymentIdFromOrder: checkoutId,
            orderId,
            customerEmail,
            idToCheck,
          })
          
          payment = await getCentralCartPaymentStatus(
            settings!.centralCartApiToken!,
            idToCheck || '',
            checkoutId,
            orderId || undefined,
            customerEmail
          )
          currentStatus = payment.status
          
          console.log('📊 Status retornado da CentralCart:', {
            status: currentStatus,
            isApproved: currentStatus === 'approved',
            payment,
          })
          
          // Se encontrou checkout_id na resposta, salvar no pedido
          if (payment.checkout_id && !checkoutId && orderId) {
            try {
              await updateOrder(orderId, { paymentId: payment.checkout_id })
              console.log(`✅ Checkout ID salvo no pedido: ${payment.checkout_id}`)
            } catch (err) {
              console.warn('Erro ao salvar checkout_id:', err)
            }
          }
          
          // Se o status for approved, atualizar o pedido imediatamente
          if (currentStatus === 'approved' && orderId) {
            console.log('🚀 Status é APPROVED! Atualizando pedido agora...')
            console.log('🚀 Dados antes da atualização:', {
              orderId,
              currentStatus,
              paymentStatus: payment.status,
            })
            try {
              console.log('🔄 Chamando updateOrder com status: completed')
              await updateOrder(orderId, { status: 'completed' })
              console.log('✅ updateOrder concluído, recarregando dados...')
              
              // Aguardar um pouco para garantir que a atualização foi persistida
              await new Promise(resolve => setTimeout(resolve, 500))
              
              await refreshData()
              console.log('✅ Pedido atualizado para completed e dados recarregados!')
              
              // Verificar se realmente foi atualizado
              const ordersAfter = await api.getOrders()
              const updatedOrder = ordersAfter.find(o => o.id === orderId)
              console.log('🔍 Verificação pós-atualização:', {
                orderId,
                statusNoBanco: updatedOrder?.status,
                foiAtualizado: updatedOrder?.status === 'completed',
              })
            } catch (err: any) {
              console.error('❌ Erro ao atualizar pedido:', err)
              console.error('❌ Detalhes do erro:', {
                message: err?.message,
                stack: err?.stack,
                error: err,
              })
              toast({
                title: 'Erro ao atualizar pedido',
                description: err?.message || 'Não foi possível atualizar o status do pedido.',
                variant: 'destructive',
              })
            }
          }
        } else {
          payment = await getPaymentStatus(
            settings!.mercadoPagoAccessToken!,
            paymentId!
          )
          currentStatus = payment.status
        }

        setPaymentStatus(currentStatus)
        
        // Log importante para debug
        console.log('🔔 Status atualizado no estado:', {
          currentStatus,
          isApproved: currentStatus === 'approved',
          gateway,
        })

        console.log('Status do pagamento verificado:', {
          paymentId,
          status: currentStatus,
          orderId,
        })

        // Mapear status para o formato esperado
        const isApproved = gateway === 'LivePix' 
          ? (currentStatus === 'paid' || currentStatus === 'approved')
          : gateway === 'CentralCart' || gateway === 'centralcart'
          ? (currentStatus === 'approved' || currentStatus === 'paid')
          : (currentStatus === 'approved')
        
        console.log('✅ Verificação de aprovação:', {
          gateway,
          currentStatus,
          isApproved,
        })

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
            console.log('🔄 Atualizando pedido para completed:', orderId)
            await updateOrder(orderId, { status: 'completed' })
            console.log('✅ Pedido atualizado para completed:', orderId)
            
            // Recarregar dados imediatamente para garantir sincronização
            await refreshData()
            
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
              <div className="flex flex-col items-center gap-2 mt-2">
                <p className="text-yellow-400 text-xs">
                Status: {paymentStatus === 'pending' ? 'Aguardando pagamento' : paymentStatus === 'in_process' ? 'Processando...' : paymentStatus}
              </p>
                {settings?.paymentGateway === 'CentralCart' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsCheckingPayment(true)
                      try {
                        const gateway = searchParams.get('gateway') || settings?.paymentGateway || 'MercadoPago'
                        
                        if (gateway === 'CentralCart' || gateway === 'centralcart') {
                          // Buscar pedido local para obter email
                          const currentOrder = orders.find(o => o.id === orderId)
                          const customerEmail = currentOrder?.customerEmail
                          
                          if (!settings?.centralCartApiToken) {
                            toast({
                              title: 'Erro',
                              description: 'Token da API da CentralCart não configurado.',
                              variant: 'destructive',
                            })
                            return
                          }
                          
                          if (!customerEmail) {
                            toast({
                              title: 'Erro',
                              description: 'Email do cliente não encontrado no pedido.',
                              variant: 'destructive',
                            })
                            return
                          }
                          
                          console.log('🔍 Verificação manual do pagamento CentralCart:', {
                            orderId,
                            customerEmail,
                          })
                          
                          // Buscar status diretamente na API da CentralCart
                          const payment = await getCentralCartPaymentStatus(
                            settings.centralCartApiToken,
                            '', // Sem ID, vai buscar pela lista de pedidos
                            undefined,
                            undefined,
                            customerEmail
                          )
                          
                          console.log('📊 Status retornado da verificação manual:', payment)
                          
                          setPaymentStatus(payment.status)
                          
                          // Se encontrou checkout_id, salvar no pedido
                          if (payment.checkout_id && orderId) {
                            try {
                              await updateOrder(orderId, { paymentId: payment.checkout_id })
                              console.log(`✅ Checkout ID salvo: ${payment.checkout_id}`)
                            } catch (err) {
                              console.warn('Erro ao salvar checkout_id:', err)
                            }
                          }
                          
                          // Se aprovado, atualizar pedido
                          if (payment.status === 'approved' && orderId) {
                            try {
                              await updateOrder(orderId, { status: 'completed' })
                              await refreshData()
                              toast({
                                title: 'Pagamento aprovado!',
                                description: 'Seu pagamento foi confirmado.',
                              })
                              setTimeout(() => {
                                navigate(`/bot-setup/${orderId}`, { replace: true })
                              }, 1500)
                            } catch (err) {
                              console.error('Erro ao atualizar pedido:', err)
                            }
                          } else {
                            toast({
                              title: 'Status verificado',
                              description: `Status atual: ${payment.status === 'pending' ? 'Aguardando pagamento' : payment.status}`,
                            })
                          }
                        }
                      } catch (error: any) {
                        console.error('Erro ao verificar pagamento:', error)
                        toast({
                          title: 'Erro ao verificar pagamento',
                          description: error.message || 'Não foi possível verificar o status do pagamento.',
                          variant: 'destructive',
                        })
                      } finally {
                        setIsCheckingPayment(false)
                      }
                    }}
                    disabled={isCheckingPayment}
                    className="text-xs h-7"
                  >
                    {isCheckingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Verificar Pagamento
                      </>
                    )}
                  </Button>
                )}
              </div>
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

