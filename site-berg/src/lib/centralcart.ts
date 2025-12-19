/**
 * Integração com a API da CentralCart
 * Documentação: https://docs.centralcart.com.br
 */

export interface CentralCartCheckout {
  gateway: 'PIX' | 'MERCADOPAGO' | 'STRIPE' | 'PAYPAL' | 'PICPAY' | 'PAGSEGURO' | 'PAGARME' | 'OTHER'
  client_email: string
  client_name: string
  client_phone?: string
  client_document?: string
  client_discord?: string
  cart: Array<{
    package_id: number
    quantity: number
    options?: Record<string, any>
    fields?: Record<string, any>
  }>
  terms?: boolean
  fields?: Record<string, any>
  coupon?: string
}

export interface CentralCartCheckoutResponse {
  success: boolean
  checkout_url?: string
  checkout_id?: string
  // Dados do PIX (quando gateway é PIX)
  qr_code?: string
  qr_code_base64?: string
  pix_code?: string
  copy_paste?: string
  // Dados do pagamento
  payment_id?: string
  transaction_id?: string
  amount?: number
  expires_at?: string
  message?: string
  error?: string
}

export interface CentralCartProduct {
  id: number
  package_id: number
  name: string
  description?: string
  price?: number
  active?: boolean
}

export interface CentralCartProductsResponse {
  success: boolean
  products?: CentralCartProduct[]
  packages?: CentralCartProduct[]
  message?: string
  error?: string
}

export interface CentralCartPaymentStatus {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  qr_code_base64?: string
  pix_code?: string
  amount?: number
  expires_at?: string
  checkout_id?: string // ID do checkout na CentralCart para salvar no pedido
}

/**
 * Cria um checkout na CentralCart vinculado a um produto
 */
export async function createCentralCartCheckout(
  apiToken: string,
  checkout: CentralCartCheckout,
): Promise<CentralCartCheckoutResponse> {
  try {
    // Validar credenciais
    if (!apiToken || apiToken.trim().length < 10) {
      throw new Error('Token da API da CentralCart é obrigatório e deve ser válido.')
    }

    // Validar dados do checkout
    if (!checkout.cart || checkout.cart.length === 0) {
      throw new Error('É necessário pelo menos um produto no carrinho.')
    }

    // Validar package_id
    for (const item of checkout.cart) {
      if (!item.package_id || item.package_id <= 0) {
        throw new Error('Package ID inválido. Verifique se o produto está vinculado corretamente à CentralCart.')
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error('Quantidade deve ser maior que zero.')
      }
    }

    if (!checkout.client_email || !checkout.client_name) {
      throw new Error('Email e nome do cliente são obrigatórios.')
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(checkout.client_email)) {
      throw new Error('Email inválido.')
    }

    // Usar API diretamente da CentralCart
    const CENTRALCART_API_URL = 'https://api.centralcart.com.br/v1/app/checkout'

    const requestBody = {
      gateway: checkout.gateway,
      client_email: checkout.client_email,
      client_name: checkout.client_name,
      ...(checkout.client_phone && { client_phone: checkout.client_phone }),
      ...(checkout.client_document && { client_document: checkout.client_document }),
      ...(checkout.client_discord && { client_discord: checkout.client_discord }),
      terms: checkout.terms ?? true,
      ...(Object.keys(checkout.fields || {}).length > 0 && { fields: checkout.fields }),
      cart: checkout.cart.map(item => ({
        package_id: item.package_id,
        quantity: item.quantity,
        ...(Object.keys(item.options || {}).length > 0 && { options: item.options }),
        ...(Object.keys(item.fields || {}).length > 0 && { fields: item.fields }),
      })),
      ...(checkout.coupon && { coupon: checkout.coupon }),
    }

    console.log('🚀 Criando checkout CentralCart via API:', {
      apiUrl: CENTRALCART_API_URL,
      hasApiToken: !!apiToken,
      tokenLength: apiToken.trim().length,
      tokenPrefix: apiToken.trim().substring(0, 10) + '...',
      checkoutData: {
        gateway: checkout.gateway,
        client_email: checkout.client_email,
        client_name: checkout.client_name,
        cart_items: checkout.cart.length,
        package_ids: checkout.cart.map(item => item.package_id),
      },
      requestBody: JSON.stringify(requestBody, null, 2),
    })

    const response = await fetch(CENTRALCART_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken.trim()}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('Resposta recebida do backend:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    // Verificar se a requisição foi bem-sucedida
    if (!response.ok) {
      let errorData: any = {}
      try {
        const text = await response.text()
        errorData = text ? JSON.parse(text) : {}
      } catch {
        errorData = { message: `Erro HTTP ${response.status}` }
      }
      
      const errorMessage = errorData.message || errorData.error || errorData.detail || `Erro HTTP ${response.status}: ${response.statusText}`
      console.error('Erro na resposta da CentralCart:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        data: errorData,
      })
      throw new Error(errorMessage)
    }

    // Ler a resposta
    let data: any = {}
    try {
      const text = await response.text()
      data = text ? JSON.parse(text) : {}
    } catch (error) {
      console.error('Erro ao fazer parse da resposta:', error)
      throw new Error('Resposta inválida da API da CentralCart')
    }

    // Log completo da resposta para debug
    console.log('🔍 Resposta completa da CentralCart:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      dataKeys: Object.keys(data),
      dataComplete: JSON.stringify(data, null, 2),
      hasCheckoutUrl: !!data.checkout_url,
      hasUrl: !!data.url,
      hasCheckoutUrl2: !!data.checkoutUrl,
      hasData: !!data.data,
      hasInternalId: !!data.internal_id, // IMPORTANTE: Verificar se tem internal_id
      internal_id: data.internal_id, // ID principal da CentralCart
      data: data,
    })

    // Para PIX, a API pode retornar QR Code e código PIX diretamente
    // Para outros gateways, retorna checkout_url
    let checkoutUrl: string | undefined = undefined
    let qrCode: string | undefined = undefined
    let qrCodeBase64: string | undefined = undefined
    let pixCode: string | undefined = undefined
    let copyPaste: string | undefined = undefined
    
    // Se for PIX, procurar dados do PIX primeiro
    if (checkout.gateway === 'PIX') {
      // Tentar diferentes formatos de resposta para PIX
      qrCode = data.qr_code || data.qrCode || data.qrcode || data.qr_code_base64 || data.qrCodeBase64
      qrCodeBase64 = data.qr_code_base64 || data.qrCodeBase64 || data.qr_code || data.qrCode
      pixCode = data.pix_code || data.pixCode || data.pix || data.copy_paste || data.copyPaste || data.copia_cola
      copyPaste = data.copy_paste || data.copyPaste || data.copia_cola || data.pix_code || data.pixCode || data.pix
      
      // Se tiver point_of_interaction (formato Mercado Pago)
      if (data.point_of_interaction?.transaction_data) {
        qrCodeBase64 = data.point_of_interaction.transaction_data.qr_code_base64
        copyPaste = data.point_of_interaction.transaction_data.qr_code
        pixCode = copyPaste
      }
      
      // Se tiver transaction_data diretamente
      if (data.transaction_data) {
        qrCodeBase64 = data.transaction_data.qr_code_base64 || qrCodeBase64
        copyPaste = data.transaction_data.qr_code || copyPaste
        pixCode = copyPaste || pixCode
      }
      
      console.log('🔍 Dados PIX encontrados:', {
        hasQrCode: !!qrCode,
        hasQrCodeBase64: !!qrCodeBase64,
        hasPixCode: !!pixCode,
        hasCopyPaste: !!copyPaste,
      })
    }
    
    // Tentar diferentes formatos de resposta para checkout_url
    if (data.checkout_url) {
      checkoutUrl = data.checkout_url
    } else if (data.url) {
      checkoutUrl = data.url
    } else if (data.checkoutUrl) {
      checkoutUrl = data.checkoutUrl
    } else if (data.data?.checkout_url) {
      checkoutUrl = data.data.checkout_url
    } else if (data.data?.url) {
      checkoutUrl = data.data.url
    } else if (data.response?.checkout_url) {
      checkoutUrl = data.response.checkout_url
    } else if (data.result?.checkout_url) {
      checkoutUrl = data.result.checkout_url
    } else if (typeof data === 'string' && data.startsWith('http')) {
      checkoutUrl = data
    }
    
    // Se não encontrou URL, tentar regex
    if (!checkoutUrl && !qrCodeBase64) {
      const responseString = JSON.stringify(data)
      const urlMatches = responseString.match(/https?:\/\/[^\s"']+/g)
      if (urlMatches && urlMatches.length > 0) {
        checkoutUrl = urlMatches[0]
        console.log('⚠️ URL encontrada através de regex:', checkoutUrl)
      }
    }
    
    // Para PIX, se tiver QR Code, não precisa de URL
    if (checkout.gateway === 'PIX' && (qrCodeBase64 || pixCode)) {
      console.log('✅ Dados PIX encontrados na resposta, processando pagamento interno')
      
      // Tentar extrair checkout_id de diferentes campos
      // IMPORTANTE: A CentralCart retorna internal_id como identificador principal
      let checkoutId = data.internal_id || data.checkout_id || data.id || data.checkoutId || data.order_id || data.payment_id
      
      // Log detalhado
      console.log('📋 Dados PIX extraídos:', {
        internal_id: data.internal_id,
        checkout_id: checkoutId,
        todas_chaves: Object.keys(data),
        resposta_completa: JSON.stringify(data).substring(0, 500),
      })
      
      return {
        success: true,
        qr_code_base64: qrCodeBase64,
        qr_code: qrCode,
        pix_code: pixCode,
        copy_paste: copyPaste || pixCode,
        checkout_id: checkoutId || data.internal_id, // Priorizar internal_id
        payment_id: data.internal_id || data.payment_id || data.transaction_id || checkoutId, // Usar internal_id como payment_id
        amount: data.amount || data.transaction_amount,
        expires_at: data.expires_at || data.expiration_date,
      }
    }

    // Se for PIX e tiver checkout_url, tentar buscar dados do PIX da URL
    if (checkout.gateway === 'PIX' && checkoutUrl) {
      console.log('⚠️ PIX retornou apenas checkout_url, tentando extrair payment_id...')
      
      // Tentar extrair payment_id da URL
      const urlMatch = checkoutUrl.match(/[?&](?:payment_id|id|paymentId|transaction_id)=([^&]+)/i)
      const extractedPaymentId = urlMatch ? urlMatch[1] : null
      
      // Se conseguiu extrair payment_id, tentar buscar dados do PIX
      if (extractedPaymentId) {
        console.log('🔍 Payment ID extraído da URL:', extractedPaymentId)
        
        try {
          // Tentar buscar dados do pagamento usando o payment_id
          const paymentStatus = await getCentralCartPaymentStatus(apiToken, extractedPaymentId)
          
          if (paymentStatus.qr_code_base64 || paymentStatus.pix_code) {
            console.log('✅ Dados PIX obtidos através do payment_id')
            return {
              success: true,
              qr_code_base64: paymentStatus.qr_code_base64,
              pix_code: paymentStatus.pix_code,
              copy_paste: paymentStatus.pix_code,
              checkout_id: extractedPaymentId,
              payment_id: extractedPaymentId,
              amount: paymentStatus.amount,
              expires_at: paymentStatus.expires_at,
            }
          }
        } catch (error) {
          console.warn('⚠️ Não foi possível buscar dados PIX do payment_id:', error)
          // Continuar com checkout_url como fallback
        }
      }
      
      // Se não conseguiu obter dados PIX, retornar checkout_url
      // Mas avisar que será redirecionamento externo
      console.warn('⚠️ CentralCart retornou apenas checkout_url para PIX. O pagamento será processado na página da CentralCart.')
    }
    
    // Se não tem nem URL nem dados PIX, erro
    if (!checkoutUrl) {
      console.error('❌ Resposta da CentralCart não contém dados válidos:', {
        responseData: data,
        allKeys: Object.keys(data),
        status: response.status,
        responseString: JSON.stringify(data, null, 2),
      })
      
      const errorMessage = data.message || data.error || data.detail || data.msg || 
        (data.errors ? JSON.stringify(data.errors) : null) ||
        `Dados do checkout não foram retornados pela CentralCart. 
        
Verifique:
1. Se o token da API está correto
2. Se o package_id (${checkout.cart[0]?.package_id}) existe na CentralCart
3. Se o gateway "${checkout.gateway}" está habilitado na sua conta

Resposta da API: ${JSON.stringify(data).substring(0, 500)}`
      throw new Error(errorMessage)
    }

    console.log('✅ Checkout URL encontrada:', checkoutUrl)
    
    // Tentar extrair checkout_id da URL se não estiver na resposta
    // IMPORTANTE: A CentralCart retorna internal_id como identificador principal
    let extractedCheckoutId = data.internal_id || data.checkout_id || data.id || data.checkoutId || data.order_id
    
    // Se não encontrou na resposta, tentar extrair da URL
    if (!extractedCheckoutId && checkoutUrl) {
      // Tentar diferentes padrões de URL da CentralCart
      // Exemplo: https://centralcart.com.br/checkout/shhJzax8AURK
      // Exemplo: https://centralcart.com.br/order/shhJzax8AURK
      const urlPatterns = [
        /\/checkout\/([^\/\?]+)/i,
        /\/order\/([^\/\?]+)/i,
        /\/payment\/([^\/\?]+)/i,
        /[?&]id=([^&]+)/i,
        /[?&]checkout_id=([^&]+)/i,
        /[?&]order_id=([^&]+)/i,
      ]
      
      for (const pattern of urlPatterns) {
        const match = checkoutUrl.match(pattern)
        if (match && match[1]) {
          extractedCheckoutId = match[1]
          console.log('✅ Checkout ID extraído da URL:', extractedCheckoutId)
          break
        }
      }
    }
    
    // Log detalhado da resposta para debug
    console.log('📋 Dados extraídos da resposta CentralCart:', {
      checkout_id_da_resposta: data.checkout_id || data.id || data.checkoutId,
      checkout_id_extraido: extractedCheckoutId,
      checkout_url: checkoutUrl,
      todas_chaves: Object.keys(data),
      resposta_completa: JSON.stringify(data).substring(0, 500),
    })

    return {
      success: true,
      checkout_url: checkoutUrl,
      checkout_id: extractedCheckoutId || data.internal_id || data.payment_id || data.transaction_id,
      payment_id: data.internal_id || data.payment_id || data.transaction_id || extractedCheckoutId, // Priorizar internal_id
      qr_code_base64: qrCodeBase64,
      qr_code: qrCode,
      pix_code: pixCode,
      copy_paste: copyPaste,
      amount: data.amount || data.transaction_amount,
      expires_at: data.expires_at || data.expiration_date,
    }
  } catch (error: any) {
    console.error('Erro ao criar checkout CentralCart:', error)
    
    // Melhorar mensagens de erro
    let errorMessage = error.message || 'Erro ao criar checkout na CentralCart'
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS')) {
      errorMessage = 'Erro de conexão com a API da CentralCart. Verifique sua conexão com a internet e o token da API.'
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorMessage = 'Token da API inválido. Verifique se o token está correto nas Configurações.'
    } else if (errorMessage.includes('404')) {
      errorMessage = 'Endpoint não encontrado. Verifique se está usando a versão correta da API da CentralCart.'
    }

    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    }
  }
}

/**
 * Busca o status de um pagamento na CentralCart
 * Pode usar paymentId, checkoutId, orderId ou email do cliente
 */
export async function getCentralCartPaymentStatus(
  apiToken: string,
  paymentId: string,
  checkoutId?: string,
  orderId?: string,
  customerEmail?: string,
): Promise<CentralCartPaymentStatus> {
  try {
    if (!apiToken) {
      throw new Error('Token da API é obrigatório.')
    }

    // Se não tiver paymentId, tentar usar checkoutId ou orderId
    const idToUse = paymentId || checkoutId || orderId
    
    // Se não tiver ID mas tiver email, ainda podemos buscar pela lista de pedidos
    if ((!idToUse || idToUse === 'undefined') && !customerEmail) {
      console.warn('⚠️ Nenhum ID ou email fornecido para buscar status do pagamento CentralCart')
      // Retornar status pending como fallback
      return {
        status: 'pending',
      }
    }
    
    // Se não tiver ID mas tiver email, vamos buscar pela lista de pedidos
    if ((!idToUse || idToUse === 'undefined') && customerEmail) {
      console.log('ℹ️ Sem ID, mas temos email. Buscando pela lista de pedidos...')
    }

    console.log('🔍 Buscando status do pagamento CentralCart:', {
      paymentId,
      checkoutId,
      orderId,
      idToUse,
    })

    // Tentar diferentes endpoints possíveis
    // IMPORTANTE: Não usar orderId local (que começa com "ord_") para buscar na CentralCart
    // A CentralCart usa internal_id, não o orderId local
    const possibleEndpoints: string[] = []
    
    // Se o ID não começar com "ord_", pode ser um ID da CentralCart (internal_id)
    if (idToUse && idToUse !== 'undefined' && !idToUse.startsWith('ord_')) {
      possibleEndpoints.push(
        `https://api.centralcart.com.br/v1/app/order/${idToUse}`,
        `https://api.centralcart.com.br/v1/app/payment/${idToUse}`,
        `https://api.centralcart.com.br/v1/app/checkout/${idToUse}`,
      )
    } else if (idToUse && idToUse.startsWith('ord_')) {
      console.log('⚠️ ID local detectado (ord_*), pulando busca por ID. Vamos buscar pela lista de pedidos.')
    }

    let lastError: Error | null = null

    // Só tentar endpoints diretos se tiver endpoints válidos
    if (possibleEndpoints.length > 0) {
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Tentando endpoint: ${endpoint}`)
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken.trim()}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          
          console.log('✅ Status encontrado:', {
            endpoint,
            data: data,
            status: data.status,
          })
          
          // Normalizar status - verificar diferentes formatos possíveis
          const status = data.status || data.payment_status || data.order_status || data.state || 'pending'
          
          // Mapear status da CentralCart para formato padrão
          // CentralCart retorna status em MAIÚSCULAS: APPROVED, REJECTED, CANCELED, REFUNDED, CHARGEDBACK
          const statusUpper = String(status).toUpperCase().trim()
          const normalizedStatus: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' = 
            statusUpper === 'PAID' || statusUpper === 'APPROVED' || statusUpper === 'COMPLETED' || 
            statusUpper === 'PAGO' || status === 'paid' || status === 'approved' || status === 'completed' || 
            status === 'pago' ? 'approved' :
            statusUpper === 'PENDING' || statusUpper === 'WAITING' || statusUpper === 'PENDENTE' || 
            statusUpper === 'AGUARDANDO' || status === 'pending' || status === 'waiting' || 
            status === 'pendente' || status === 'aguardando' ? 'pending' :
            statusUpper === 'REJECTED' || statusUpper === 'FAILED' || statusUpper === 'REJEITADO' || 
            statusUpper === 'FALHOU' || status === 'rejected' || status === 'failed' || 
            status === 'rejeitado' || status === 'falhou' ? 'rejected' :
            statusUpper === 'CANCELLED' || statusUpper === 'CANCELED' || statusUpper === 'CANCELADO' || 
            status === 'cancelled' || status === 'canceled' || status === 'cancelado' ? 'cancelled' :
            statusUpper === 'REFUNDED' || statusUpper === 'REEMBOLSADO' || status === 'refunded' || 
            status === 'reembolsado' ? 'refunded' : 'pending'
          
          console.log('🔄 Normalização de status (endpoint direto):', {
            statusOriginal: status,
            statusUpper,
            normalizedStatus,
            isApproved: normalizedStatus === 'approved',
          })

          const result = {
            status: normalizedStatus,
            qr_code_base64: data.qr_code_base64 || data.qrCodeBase64,
            pix_code: data.pix_code || data.pixCode || data.copy_paste || data.copyPaste,
            amount: data.amount || data.transaction_amount || data.value,
            expires_at: data.expires_at || data.expiration_date,
            checkout_id: data.checkout_id || data.id || data.checkoutId, // Retornar checkout_id para salvar
          }
          
          console.log('✅ Status retornado (endpoint direto):', {
            normalizedStatus,
            isApproved: normalizedStatus === 'approved',
            result,
          })
          
          return result
        } else if (response.status !== 404) {
          // Se não for 404, pode ser outro erro válido
          const errorData = await response.json().catch(() => ({}))
          console.warn(`Endpoint ${endpoint} retornou ${response.status}:`, errorData)
        }
        } catch (err: any) {
          lastError = err
          continue
        }
      }
    }

    // Se nenhum endpoint funcionou, tentar buscar pela lista de pedidos
    // Isso é útil quando o checkout_id não está disponível diretamente
    try {
      console.log('🔄 Tentando buscar pela lista de pedidos da CentralCart...')
      
      // Tentar diferentes endpoints possíveis para listar pedidos
      // Conforme documentação: GET /v1/app/order (singular, não plural)
      const possibleOrdersEndpoints = [
        'https://api.centralcart.com.br/v1/app/order', // Endpoint correto conforme documentação
        'https://api.centralcart.com.br/v1/app/orders', // Fallback
        'https://api.centralcart.com.br/v1/orders', // Fallback
      ]
      
      let orders: any[] = []
      let response: Response | null = null
      
      for (const endpoint of possibleOrdersEndpoints) {
        try {
          console.log(`Tentando endpoint de pedidos: ${endpoint}`)
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiToken.trim()}`,
            },
          })

          if (response.ok) {
            const ordersData = await response.json()
            orders = ordersData.orders || ordersData.data || ordersData || []
            
            if (Array.isArray(orders) && orders.length > 0) {
              console.log(`✅ Endpoint funcionou: ${endpoint}`)
              break
            }
          } else if (response.status !== 404) {
            console.warn(`Endpoint ${endpoint} retornou ${response.status}`)
          }
        } catch (err) {
          console.warn(`Erro ao tentar endpoint ${endpoint}:`, err)
          continue
        }
      }

      if (response && response.ok && Array.isArray(orders) && orders.length > 0) {
        console.log(`📋 Encontrados ${orders.length} pedido(s) na CentralCart`)
        
        // Log dos primeiros pedidos para debug
        if (Array.isArray(orders) && orders.length > 0) {
          console.log('📋 Primeiros pedidos encontrados:', orders.slice(0, 3).map((o: any) => ({
            internal_id: o.internal_id,
            id: o.id,
            external_id: o.external_id,
            checkout_id: o.checkout_id,
            status: o.status || o.payment_status || o.order_status,
            email: o.client_email || o.email || o.customer_email,
            client: o.client,
          })))
        }
        
        // Procurar o pedido pelo ID primeiro (se tiver ID e não for orderId local)
        let foundOrder: any = null
        if (idToUse && idToUse !== 'undefined' && !idToUse.startsWith('ord_')) {
          // Buscar pelo internal_id (ID real da CentralCart)
          foundOrder = orders.find((o: any) => 
            o.internal_id === idToUse || 
            o.id === idToUse || 
            o.external_id === idToUse ||
            o.checkout_id === idToUse || 
            o.payment_id === idToUse ||
            o.order_id === idToUse ||
            String(o.internal_id) === String(idToUse) ||
            String(o.id) === String(idToUse)
          )
        }

        // Se não encontrou pelo ID e tem email, buscar pelo email
        if (!foundOrder && customerEmail) {
          console.log(`🔍 Buscando pedido pelo email: ${customerEmail}`)
          // Buscar por email exato ou parcial (case-insensitive)
          const emailLower = customerEmail.toLowerCase().trim()
          // Encontrar TODOS os pedidos com esse email (pode haver múltiplos)
          const matchingOrders = orders.filter((o: any) => {
            const orderEmail = (o.client_email || o.email || o.customer_email || (o.client && o.client.email) || '').toLowerCase().trim()
            return orderEmail === emailLower || orderEmail.includes(emailLower) || emailLower.includes(orderEmail)
          })
          
          if (matchingOrders.length > 0) {
            console.log(`📋 Encontrados ${matchingOrders.length} pedido(s) com o email ${customerEmail}`)
            
            // Log de todos os pedidos encontrados com seus status
            matchingOrders.forEach((o: any, index: number) => {
              console.log(`  Pedido ${index + 1}:`, {
                internal_id: o.internal_id,
                status: o.status,
                payment_status: o.payment_status,
                order_status: o.order_status,
                state: o.state,
                paid_at: o.paid_at, // IMPORTANTE: Verificar se tem paid_at
                created_at: o.created_at || o.createdAt || o.date,
                updated_at: o.updated_at || o.updatedAt,
              })
            })
            
            // Priorizar pedido aprovado (por status OU por paid_at), senão pegar o mais recente
            foundOrder = matchingOrders.find((o: any) => {
              const s = (o.status || o.payment_status || o.order_status || o.state || '').toUpperCase()
              const hasPaidAt = o.paid_at && o.paid_at !== null && o.paid_at !== 'null' && o.paid_at !== ''
              // Considerar aprovado se status for APPROVED/PAID OU se tem paid_at
              return s === 'APPROVED' || s === 'PAID' || s === 'COMPLETED' || s === 'PAGO' || s === 'PAGAMENTO CONCLUÍDO' || hasPaidAt
            }) || matchingOrders[0] // Se não encontrar aprovado, pegar o primeiro (mais recente)
            
            if (foundOrder) {
              const foundStatus = foundOrder.status || foundOrder.payment_status || foundOrder.order_status || foundOrder.state
              console.log(`✅ Selecionado pedido: ${foundOrder.internal_id} com status: ${foundStatus}`)
            }
          } else {
            console.warn('⚠️ Pedido não encontrado pelo email. Verificando todos os pedidos...')
            // Log de todos os emails encontrados para debug
            console.log('📧 Emails encontrados nos pedidos:', orders.slice(0, 10).map((o: any) => ({
              email: o.client_email || o.email || o.customer_email || (o.client && o.client.email) || 'N/A',
              internal_id: o.internal_id,
              status: o.status || o.payment_status || o.order_status || o.state,
            })))
          }
        }

        if (foundOrder) {
          // Log completo do pedido para debug
          console.log('📦 ESTRUTURA COMPLETA DO PEDIDO ENCONTRADO:', JSON.stringify(foundOrder, null, 2))
          console.log('✅ Pedido encontrado na lista da CentralCart:', {
            internal_id: foundOrder.internal_id,
            id: foundOrder.id,
            external_id: foundOrder.external_id,
            checkout_id: foundOrder.checkout_id,
            status: foundOrder.status,
            payment_status: foundOrder.payment_status,
            order_status: foundOrder.order_status,
            state: foundOrder.state,
            paymentStatus: foundOrder.paymentStatus,
            status_final: foundOrder.status || foundOrder.payment_status || foundOrder.order_status || foundOrder.state || foundOrder.paymentStatus,
            email: foundOrder.client_email || foundOrder.email || foundOrder.customer_email,
            // Verificar campos aninhados
            payment: foundOrder.payment,
            order: foundOrder.order,
            data: foundOrder.data,
          })
          
          // Buscar status em todos os campos possíveis, incluindo objetos aninhados
          let status = foundOrder.status || 
                      foundOrder.payment_status || 
                      foundOrder.order_status || 
                      foundOrder.state || 
                      foundOrder.paymentStatus ||
                      foundOrder.payment?.status ||
                      foundOrder.order?.status ||
                      foundOrder.data?.status ||
                      foundOrder.data?.payment_status ||
                      foundOrder.data?.order_status ||
                      'pending'
          
          // IMPORTANTE: Se paid_at não for null, o pedido foi pago (mesmo que status seja PENDING)
          // A CentralCart pode ter delay na atualização do campo status, mas paid_at é atualizado imediatamente
          // Verificar paid_at de várias formas possíveis
          const paidAtValue = foundOrder.paid_at || foundOrder.paidAt || foundOrder.paid_at_date || foundOrder.payment_date
          const hasPaidAt = paidAtValue && 
                           paidAtValue !== null && 
                           paidAtValue !== 'null' && 
                           paidAtValue !== '' &&
                           String(paidAtValue).trim() !== '' &&
                           String(paidAtValue).toLowerCase() !== 'null'
          
          // Também verificar status_display que pode indicar pagamento concluído
          const statusDisplay = foundOrder.status_display || foundOrder.statusDisplay || ''
          const isPaidByDisplay = statusDisplay && (
            statusDisplay.toUpperCase().includes('PAGAMENTO CONCLUÍDO') ||
            statusDisplay.toUpperCase().includes('PAGO') ||
            statusDisplay.toUpperCase().includes('CONCLUÍDO') ||
            statusDisplay.toUpperCase().includes('APPROVED') ||
            statusDisplay.toUpperCase().includes('PAID')
          )
          
          console.log('💰 Verificação de pagamento:', {
            status,
            paid_at: paidAtValue,
            hasPaidAt,
            status_display: statusDisplay,
            isPaidByDisplay,
            allFields: {
              paid_at: foundOrder.paid_at,
              paidAt: foundOrder.paidAt,
              paid_at_date: foundOrder.paid_at_date,
              payment_date: foundOrder.payment_date,
            },
          })
          
          // Se tem paid_at OU status_display indica pagamento, considerar como aprovado
          if (hasPaidAt || isPaidByDisplay) {
            console.log('✅ Pedido tem indicador de pagamento (paid_at ou status_display), considerando como APROVADO mesmo que status seja PENDING')
            status = 'APPROVED' // Forçar status como APPROVED se tem indicador de pagamento
          }
          
          // Normalizar status - CentralCart retorna em MAIÚSCULAS
          const statusUpper = String(status).toUpperCase().trim()
          const normalizedStatus = 
            statusUpper === 'PAID' || statusUpper === 'APPROVED' || statusUpper === 'COMPLETED' || 
            statusUpper === 'PAGO' || statusUpper === 'PAGAMENTO CONCLUÍDO' || statusUpper === 'PAGAMENTO CONCLUIDO' ||
            statusUpper === 'CONCLUÍDO' || statusUpper === 'CONCLUIDO' ||
            status === 'paid' || status === 'approved' || status === 'completed' || 
            status === 'pago' || status === 'pagamento concluído' || status === 'concluído' ||
            status === 'concluido' ? 'approved' :
            statusUpper === 'PENDING' || statusUpper === 'WAITING' || statusUpper === 'PENDENTE' || 
            statusUpper === 'AGUARDANDO' || status === 'pending' || status === 'waiting' || 
            status === 'pendente' || status === 'aguardando' ? 'pending' :
            statusUpper === 'REJECTED' || statusUpper === 'FAILED' || statusUpper === 'REJEITADO' || 
            statusUpper === 'FALHOU' || status === 'rejected' || status === 'failed' || 
            status === 'rejeitado' || status === 'falhou' ? 'rejected' :
            statusUpper === 'CANCELLED' || statusUpper === 'CANCELED' || statusUpper === 'CANCELADO' || 
            status === 'cancelled' || status === 'canceled' || status === 'cancelado' ? 'cancelled' :
            statusUpper === 'REFUNDED' || statusUpper === 'REEMBOLSADO' || status === 'refunded' || 
            status === 'reembolsado' ? 'refunded' : 'pending'
          
          console.log('🔄 Normalização de status (lista de pedidos):', {
            statusOriginal: status,
            statusUpper,
            normalizedStatus,
          })

          // Se encontrou o checkout_id, salvar no pedido local para próximas verificações
          if (foundOrder.checkout_id || foundOrder.id) {
            console.log('💾 Checkout ID encontrado:', foundOrder.checkout_id || foundOrder.id)
          }

          const result: CentralCartPaymentStatus = {
            status: normalizedStatus,
            qr_code_base64: foundOrder.qr_code_base64 || foundOrder.qrCodeBase64,
            pix_code: foundOrder.pix_code || foundOrder.pixCode || foundOrder.copy_paste || foundOrder.copyPaste,
            amount: foundOrder.amount || foundOrder.transaction_amount || foundOrder.value || foundOrder.price,
            expires_at: foundOrder.expires_at || foundOrder.expiration_date,
            checkout_id: foundOrder.internal_id || foundOrder.checkout_id || foundOrder.id, // Usar internal_id como checkout_id
          }
          
          console.log('✅ Status retornado (lista de pedidos):', {
            normalizedStatus,
            isApproved: normalizedStatus === 'approved',
            internal_id: foundOrder.internal_id,
            paid_at: paidAtValue,
            hasPaidAt,
            status_display: statusDisplay,
            isPaidByDisplay,
            statusOriginal: status,
            result,
          })
          
          // Log adicional se detectou aprovação via paid_at ou status_display
          if (normalizedStatus === 'approved') {
            console.log('🎉 APROVAÇÃO DETECTADA! Status normalizado como "approved"')
            if (hasPaidAt) {
              console.log('  → Detectado via paid_at:', paidAtValue)
            }
            if (isPaidByDisplay) {
              console.log('  → Detectado via status_display:', statusDisplay)
            }
            if (!hasPaidAt && !isPaidByDisplay) {
              console.log('  → Detectado via campo status:', status)
            }
          }
          
          return result
        } else {
          console.warn('⚠️ Pedido não encontrado na lista da CentralCart', {
            idToUse,
            customerEmail,
            totalOrders: orders.length,
          })
        }
      } else {
        console.warn(`⚠️ Erro ao buscar lista de pedidos: ${response ? `${response.status} ${response.statusText}` : 'Nenhum endpoint funcionou'}`)
      }
    } catch (listError: any) {
      console.error('❌ Erro ao buscar pela lista de pedidos:', listError)
      console.warn('⚠️ Não foi possível buscar pedidos da CentralCart. Verifique o token da API.')
    }

    // Se nenhum endpoint funcionou, retornar pending (não é erro crítico)
    console.warn('⚠️ Nenhum endpoint funcionou para buscar status. Retornando pending.')
    return {
      status: 'pending',
    }
  } catch (error: any) {
    console.error('Erro ao buscar status do pagamento CentralCart:', error)
    // Não lançar erro, apenas retornar pending
    return {
      status: 'pending',
    }
  }
}

/**
 * Busca a lista de produtos/packages da CentralCart
 * Nota: A API da CentralCart pode não ter um endpoint público para listar pacotes.
 * Esta função tenta alguns endpoints possíveis, mas se não funcionar,
 * o usuário pode digitar o Package ID manualmente.
 */
export async function getCentralCartProducts(
  apiToken: string,
): Promise<CentralCartProductsResponse> {
  try {
    // Validar credenciais
    if (!apiToken || apiToken.trim().length < 10) {
      throw new Error('Token da API da CentralCart é obrigatório e deve ser válido.')
    }

    // Lista de endpoints possíveis para tentar
    const possibleEndpoints = [
      'https://api.centralcart.com.br/v1/app/package',
      'https://api.centralcart.com.br/v1/app/packages',
      'https://api.centralcart.com.br/v1/package',
      'https://api.centralcart.com.br/v1/packages',
    ]

    let lastError: Error | null = null

    // Tentar cada endpoint possível
    for (const endpoint of possibleEndpoints) {
      try {
        console.log('Tentando buscar produtos CentralCart via API:', {
          apiUrl: endpoint,
          hasApiToken: !!apiToken,
        })

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken.trim()}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          
          // Normalizar resposta (pode vir como array direto ou objeto com propriedade)
          let products: any[] = []
          
          if (Array.isArray(data)) {
            products = data
          } else if (data.packages && Array.isArray(data.packages)) {
            products = data.packages
          } else if (data.data && Array.isArray(data.data)) {
            products = data.data
          } else if (data.products && Array.isArray(data.products)) {
            products = data.products
          } else if (data.items && Array.isArray(data.items)) {
            products = data.items
          }
          
          if (products.length > 0) {
            console.log(`✅ Endpoint funcionou: ${endpoint}`, { productsCount: products.length })
            
            return {
              success: true,
              products: products.map((p: any) => ({
                id: p.id || p.package_id,
                package_id: p.package_id || p.id,
                name: p.name || p.title || p.product_name || 'Produto sem nome',
                description: p.description || '',
                price: p.price || p.value || 0,
                active: p.active !== undefined ? p.active : (p.status === 'active' || p.status === 'enabled'),
              })),
            }
          }
        } else if (response.status !== 404) {
          // Se não for 404, pode ser outro erro (401, 500, etc)
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.message || errorData.error || `Erro HTTP ${response.status}`
          
          if (response.status === 401) {
            throw new Error('Token da API inválido. Verifique se o token está correto nas Configurações.')
          }
          
          lastError = new Error(errorMessage)
          continue
        }
      } catch (err: any) {
        if (err.message?.includes('Token da API inválido')) {
          throw err // Re-throw erros de autenticação imediatamente
        }
        lastError = err
        continue
      }
    }

    // Se chegou aqui, nenhum endpoint funcionou
    // Retornar erro amigável informando que o usuário pode digitar manualmente
    return {
      success: false,
      error: 'A API da CentralCart não possui um endpoint público para listar pacotes. Digite o Package ID manualmente no campo abaixo.',
      message: 'A API da CentralCart não possui um endpoint público para listar pacotes. Digite o Package ID manualmente no campo abaixo.',
    }
  } catch (error: any) {
    console.error('Erro ao buscar produtos CentralCart:', error)
    
    // Melhorar mensagens de erro
    let errorMessage = error.message || 'Erro ao buscar produtos da CentralCart'
    
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS')) {
      errorMessage = 'Erro de conexão com a API da CentralCart. Verifique sua conexão com a internet e o token da API.'
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      errorMessage = 'Token da API inválido. Verifique se o token está correto nas Configurações.'
    }

    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    }
  }
}
