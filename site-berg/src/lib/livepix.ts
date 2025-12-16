// Serviço de integração com LivePix
// IMPORTANTE: O processamento de pagamentos é feito no backend

export interface LivePixPayment {
  amount: number
  description: string
  payer: {
    name?: string
    email: string
  }
  metadata?: Record<string, any>
  orderId?: string
  origin?: string
}

/**
 * Cria um pagamento PIX no LivePix (via backend)
 */
export async function createLivePixPayment(
  clientId: string,
  clientSecret: string,
  payment: LivePixPayment,
): Promise<any> {
  try {
    // Validar credenciais
    if (!clientId || !clientSecret || clientId.trim().length < 10 || clientSecret.trim().length < 10) {
      throw new Error('Client ID e Client Secret do LivePix são obrigatórios e devem ser válidos.')
    }

    // Usar API centralizada
    const { getApiUrl } = await import('./api-config')
    const apiUrl = getApiUrl()

    console.log('Criando pagamento LivePix via API:', {
      apiUrl: `${apiUrl}/api/livepix/create-payment`,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      paymentData: {
        amount: payment.amount,
        description: payment.description,
        payer_email: payment.payer.email,
      },
    })

    const response = await fetch(`${apiUrl}/api/livepix/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        paymentData: {
          amount: payment.amount ? Number(payment.amount.toFixed(2)) : null,
          description: payment.description,
          payer: {
            name: payment.payer.name || payment.payer.email.split('@')[0],
            email: payment.payer.email,
          },
          metadata: payment.metadata || {},
        },
      }),
    })

    console.log('Resposta recebida do backend:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    // Verificar se a requisição foi bem-sucedida
    if (!response.ok) {
      let errorData: any = {}
      let errorMessage = 'Erro ao processar pagamento LivePix'

      try {
        errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage

        console.error('Erro do backend:', {
          status: response.status,
          errorData,
          errorMessage,
        })

        // Mensagens específicas para erros comuns
        if (response.status === 401 || errorMessage.includes('invalid') || errorMessage.includes('Invalid') || errorMessage.includes('unauthorized')) {
          throw new Error('Credenciais do LivePix inválidas ou expiradas. Verifique se o Client ID e Client Secret estão corretos nas Configurações.')
        }

        if (response.status === 400) {
          throw new Error(`Dados do pagamento inválidos: ${errorMessage}. Verifique os valores informados.`)
        }

        if (response.status === 403) {
          throw new Error('Acesso negado. Verifique se as credenciais do LivePix têm permissões para criar pagamentos.')
        }
      } catch (parseError: any) {
        // Se não conseguir parsear o JSON, usar status da resposta
        console.error('Erro ao parsear resposta do backend:', parseError)
        if (response.status === 401) {
          errorMessage = 'Credenciais do LivePix inválidas ou expiradas. Verifique nas Configurações.'
        } else if (response.status === 400) {
          errorMessage = 'Dados do pagamento inválidos. Verifique os valores informados.'
        } else if (response.status === 403) {
          errorMessage = 'Acesso negado. Verifique as permissões das credenciais do LivePix.'
        } else if (response.status === 0 || response.status === undefined) {
          errorMessage = 'Erro de conexão com o backend. Certifique-se de que o servidor está rodando (npm run server).'
        } else {
          errorMessage = `Erro ao processar pagamento (Status: ${response.status} ${response.statusText})`
        }
      }

      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log('Pagamento LivePix criado com sucesso:', {
      id: result.id,
      status: result.status,
      hasQrCode: !!result.qr_code || !!result.qr_code_base64,
    })

    return result
  } catch (error: any) {
    console.error('Erro ao processar pagamento LivePix:', error)

    // Tratar erros de rede
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Erro de conexão com o backend. Certifique-se de que o servidor está rodando. Execute: npm run server')
    }

    // Se já for um Error com mensagem, apenas relançar
    if (error instanceof Error) {
      throw error
    }

    // Caso contrário, criar um novo erro
    throw new Error(error?.message || 'Erro desconhecido ao processar pagamento LivePix')
  }
}

/**
 * Obtém o status de um pagamento (via backend)
 */
export async function getLivePixPaymentStatus(
  clientId: string,
  clientSecret: string,
  paymentId: string,
): Promise<any> {
  try {
    const { getApiUrl } = await import('./api-config')
    const apiUrl = getApiUrl()

    const response = await fetch(
      `${apiUrl}/api/livepix/payment-status/${paymentId}?clientId=${encodeURIComponent(clientId)}&clientSecret=${encodeURIComponent(clientSecret)}`,
      {
        method: 'GET',
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao consultar status do pagamento')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Erro ao consultar status do pagamento:', error)
    throw error
  }
}

/**
 * Valida as credenciais do LivePix
 */
export async function validateLivePixCredentials(
  clientId: string,
  clientSecret: string,
): Promise<boolean> {
  try {
    // Tentar obter um token de acesso
    const { getApiUrl } = await import('./api-config')
    const apiUrl = getApiUrl()

    const response = await fetch(`${apiUrl}/api/livepix/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        paymentData: {
          amount: 0.01, // Valor mínimo para teste
          description: 'Teste de validação',
          payer: {
            email: 'teste@example.com',
          },
        },
      }),
    })

    // Se retornar 401 ou 403, as credenciais são inválidas
    // Se retornar 400 (dados inválidos), as credenciais podem estar corretas
    return response.status !== 401 && response.status !== 403
  } catch (error) {
    console.error('Erro ao validar credenciais LivePix:', error)
    return false
  }
}

