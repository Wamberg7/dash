// Serviço de integração com Mercado Pago
// IMPORTANTE: Em produção, o processamento de pagamentos deve ser feito no backend
// Este arquivo contém funções auxiliares para integração frontend

export interface MercadoPagoPayment {
  transaction_amount: number
  description: string
  payment_method_id: string
  payer: {
    email: string
    identification?: {
      type: string
      number: string
    }
  }
  installments?: number
  token?: string // Para cartão de crédito
  issuer_id?: string
}

export interface MercadoPagoPixPayment {
  transaction_amount: number
  description: string
  payment_method_id: 'pix'
  payer: {
    email: string
    first_name?: string
    last_name?: string
  }
}

// Função para criar preferência de pagamento (via backend)
export async function createMercadoPagoPreference(
  accessToken: string,
  paymentData: {
    title: string
    quantity: number
    unit_price: number
    email: string
    name: string
  },
): Promise<string> {
  try {
    // Usar API centralizada
    const { getApiUrl } = await import('./api-config')
    const apiUrl = getApiUrl()
    
    const response = await fetch(
      `${apiUrl}/api/create-preference`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken.trim(),
          preferenceData: {
            title: paymentData.title,
            quantity: paymentData.quantity,
            unit_price: paymentData.unit_price,
            name: paymentData.name,
            email: paymentData.email,
            origin: window.location.origin,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = errorData.error || errorData.message || 'Erro ao criar preferência de pagamento'
      
      console.error('Erro do backend:', errorData)
      
      // Mensagens específicas para erros comuns
      if (errorMessage.includes('invalid') || errorMessage.includes('Invalid') || response.status === 401) {
        throw new Error('Access Token inválido ou expirado. Verifique se o token está correto nas Configurações.')
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    return data.init_point
  } catch (error: any) {
    console.error('Erro ao criar preferência Mercado Pago:', error)
    throw error
  }
}

// Função para processar pagamento Pix (via backend)
export async function createPixPayment(
  accessToken: string,
  payment: MercadoPagoPixPayment,
): Promise<any> {
  try {
    // Validar Access Token antes de fazer a requisição
    if (!accessToken || accessToken.trim().length < 10) {
      throw new Error('Access Token do Mercado Pago inválido ou não configurado.')
    }

    // Usar API centralizada
    const { getApiUrl } = await import('./api-config')
    const apiUrl = getApiUrl()
    
    // Garantir que transaction_amount é um número válido
    const transactionAmount = payment.transaction_amount ? Number(payment.transaction_amount) : null;
    
    if (!transactionAmount || transactionAmount <= 0 || isNaN(transactionAmount)) {
      throw new Error('Valor da transação inválido. Verifique o preço do produto.')
    }

    console.log('Criando pagamento Pix via API:', {
      apiUrl: `${apiUrl}/api/create-pix-payment`,
      hasToken: !!accessToken,
      paymentData: {
        transaction_amount: transactionAmount,
        description: payment.description,
        payer_email: payment.payer.email,
      },
    })

    const response = await fetch(
      `${apiUrl}/api/create-pix-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken.trim(),
          paymentData: {
            transaction_amount: Number(transactionAmount.toFixed(2)),
            description: payment.description || 'Pagamento via PIX',
            payer: {
              email: payment.payer.email.trim(),
              first_name: payment.payer.first_name || payment.payer.email.split('@')[0] || 'Cliente',
              last_name: payment.payer.last_name || payment.payer.first_name || payment.payer.email.split('@')[0] || 'Cliente',
            },
          },
        }),
      },
    )

    console.log('Resposta recebida do backend:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    // Verificar se a requisição foi bem-sucedida
    if (!response.ok) {
      let errorData: any = {}
      let errorMessage = 'Erro ao processar pagamento Pix'
      
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
          throw new Error('Access Token inválido ou expirado. Verifique se o token está correto nas Configurações e gere um novo se necessário.')
        }
        
        if (response.status === 400) {
          throw new Error(`Dados do pagamento inválidos: ${errorMessage}. Verifique os valores informados.`)
        }
        
        if (response.status === 403) {
          throw new Error('Acesso negado. Verifique se o Access Token tem permissões para criar pagamentos.')
        }
        
      } catch (parseError: any) {
        // Se não conseguir parsear o JSON, usar status da resposta
        console.error('Erro ao parsear resposta do backend:', parseError)
        if (response.status === 401) {
          errorMessage = 'Access Token inválido ou expirado. Verifique nas Configurações.'
        } else if (response.status === 400) {
          errorMessage = 'Dados do pagamento inválidos. Verifique os valores informados.'
        } else if (response.status === 403) {
          errorMessage = 'Acesso negado. Verifique as permissões do Access Token.'
        } else if (response.status === 0 || response.status === undefined) {
          errorMessage = 'Erro de conexão com o backend. Certifique-se de que o servidor está rodando (npm run server).'
        } else {
          errorMessage = `Erro ao processar pagamento (Status: ${response.status} ${response.statusText})`
        }
      }
      
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log('Pagamento Pix criado com sucesso:', {
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      hasQrCode: !!result.point_of_interaction?.transaction_data?.qr_code_base64,
    })
    
    return result
  } catch (error: any) {
    console.error('Erro ao processar pagamento Pix:', error)
    
    // Tratar erros de rede
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Erro de conexão com o backend. Certifique-se de que o servidor está rodando. Execute: npm run server')
    }
    
    // Se já for um Error com mensagem, apenas relançar
    if (error instanceof Error) {
      throw error
    }
    
    // Caso contrário, criar um novo erro
    throw new Error(error?.message || 'Erro desconhecido ao processar pagamento Pix')
  }
}

// Função para processar pagamento com cartão (deve ser feito no backend)
export async function createCardPayment(
  accessToken: string,
  payment: MercadoPagoPayment,
): Promise<any> {
  try {
    const response = await fetch(
      'https://api.mercadopago.com/v1/payments',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payment),
      },
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro ao processar pagamento com cartão')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Erro ao processar pagamento com cartão:', error)
    throw error
  }
}

// Função para validar Access Token
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error('Erro ao validar Access Token:', error)
    return false
  }
}

// Função para obter status de um pagamento (via backend)
export async function getPaymentStatus(
  accessToken: string,
  paymentId: string,
): Promise<any> {
  try {
    const { getApiUrl } = await import('./api-config')
    const apiUrl = getApiUrl()

    const response = await fetch(
      `${apiUrl}/api/payment-status/${paymentId}?accessToken=${encodeURIComponent(accessToken)}`,
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

