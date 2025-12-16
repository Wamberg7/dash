import { Product, Order, CheckoutSettings, BotSettings } from '@/types'
import { supabase } from './supabase'
import { apiClient } from './api-client'
import { getApiUrl } from './api-config'

// Configuração: usar API centralizada ou Supabase direto
const USE_API = import.meta.env.VITE_USE_API === 'true' || false
const API_URL = getApiUrl()

// Mock Data Initial State
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'sales-bot',
    title: 'Bot de Vendas',
    description:
      'Automatize suas vendas com entrega imediata, controle de estoque e múltiplos métodos de pagamento.',
    price: 15.0,
    features: [
      'Entrega automática',
      'Pix e Cartão',
      'Controle de Estoque',
      'Cupom de Desconto',
    ],
    active: true,
    highlight: 'Mais Popular',
    iconType: 'shopping-cart',
  },
  {
    id: 'ticket-bot',
    title: 'Bot de Tickets com IA',
    description:
      'Atendimento automático e inteligente 24/7 com respostas geradas por IA para tirar dúvidas dos membros.',
    price: 15.0,
    features: [
      'Respostas com IA',
      'Atendimento 24/7',
      'Aprendizado Contínuo',
      'Triagem Automática',
    ],
    active: true,
    highlight: 'Inovação',
    iconType: 'bot',
  },
]

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_1',
    customerName: 'João Silva',
    customerEmail: 'joao@example.com',
    productId: 'sales-bot',
    productName: 'Bot de Vendas',
    amount: 15.0,
    status: 'completed',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    paymentMethod: 'pix',
  },
  {
    id: 'ord_2',
    customerName: 'Maria Santos',
    customerEmail: 'maria@example.com',
    productId: 'ticket-bot',
    productName: 'Bot de Tickets com IA',
    amount: 15.0,
    status: 'completed',
    date: new Date(Date.now() - 86400000).toISOString(),
    paymentMethod: 'credit_card',
  },
]

const INITIAL_SETTINGS: CheckoutSettings = {
  paymentGateway: 'MercadoPago',
  apiKey: '',
  enablePix: true,
  enableCreditCard: true,
  mercadoPagoClientId: '',
  mercadoPagoClientSecret: '',
  mercadoPagoPublicKey: '',
  mercadoPagoAccessToken: '',
  additionalFee: false,
  // Notification settings
  discordSalesPublic: false,
  discordSalesAdmin: false,
  discordStockOut: false,
  discordAffiliateWithdrawal: false,
  appSalesNotification: false,
  emailStoreExpiration: false,
}

// Local Storage Keys
const STORAGE_PRODUCTS = 'berg_products'
const STORAGE_ORDERS = 'berg_orders'
const STORAGE_VISITS = 'berg_visits'
const STORAGE_SETTINGS = 'berg_settings'

// Helper to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const api = {
  getProducts: async (): Promise<Product[]> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        return await apiClient.getProducts()
      } catch (e) {
        console.error('API fetch failed, usando fallback:', e)
        const stored = localStorage.getItem(STORAGE_PRODUCTS)
        return stored ? JSON.parse(stored) : INITIAL_PRODUCTS
      }
    }

    // Fallback para Supabase direto
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        // Converter formato do banco para formato do app
        return data.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          features: p.features,
          active: p.active,
          highlight: p.highlight || undefined,
          iconType: p.icon_type || undefined,
        }))
      }
    } catch (e) {
      console.error('Supabase fetch failed', e)
    }

    // Fallback to LocalStorage or Mock
    const stored = localStorage.getItem(STORAGE_PRODUCTS)
    return stored ? JSON.parse(stored) : INITIAL_PRODUCTS
  },

  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        return await apiClient.createProduct(product)
      } catch (e) {
        console.error('API create failed:', e)
        throw e
      }
    }

    // Fallback para Supabase direto
    const productId = `prod_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Converter formato do app para formato do banco
      const dbProduct: any = {
        id: productId,
        title: product.title,
        description: product.description,
        price: Number(product.price),
        features: Array.isArray(product.features) ? product.features : [],
        active: product.active !== undefined ? product.active : true,
        highlight: product.highlight || null,
        icon_type: product.iconType || null,
        // created_at e updated_at são gerados automaticamente pelo banco
      }

      // Validar que features é um array
      if (!Array.isArray(dbProduct.features)) {
        console.warn('Features não é um array, convertendo:', dbProduct.features)
        dbProduct.features = []
      }

      console.log('🔄 Criando produto no banco:', {
        id: productId,
        title: product.title,
        price: product.price,
      })

      const { data, error } = await supabase
        .from('products')
        .insert(dbProduct)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro do Supabase ao criar produto:', error)
        throw error
      }

      // Limpar cache do localStorage quando temos dados do banco
      localStorage.removeItem(STORAGE_PRODUCTS)

      console.log('✅ Produto criado com sucesso:', data)
      
      // Retornar no formato do app
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        price: data.price,
        features: data.features,
        active: data.active,
        highlight: data.highlight || undefined,
        iconType: data.icon_type || undefined,
      }
    } catch (e: any) {
      console.error('❌ Erro ao criar produto:', e)
      console.error('Detalhes do erro:', {
        message: e.message,
        code: e.code,
        details: e.details,
        hint: e.hint,
      })
      throw e
    }
  },

  updateProduct: async (
    id: string,
    updates: Partial<Product>,
  ): Promise<void> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        await apiClient.updateProduct(id, updates)
        return
      } catch (e) {
        console.error('API update failed:', e)
        throw e
      }
    }

    // Fallback para Supabase direto
    try {
      // Converter formato do app para formato do banco
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      }

      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.description !== undefined)
        dbUpdates.description = updates.description
      if (updates.price !== undefined) dbUpdates.price = updates.price
      if (updates.features !== undefined) dbUpdates.features = updates.features
      if (updates.active !== undefined) dbUpdates.active = updates.active
      if (updates.highlight !== undefined) dbUpdates.highlight = updates.highlight
      if (updates.iconType !== undefined) dbUpdates.icon_type = updates.iconType

      const { error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)

      if (error) throw error

      // Limpar cache do localStorage quando temos dados do banco
      localStorage.removeItem(STORAGE_PRODUCTS)
    } catch (e) {
      console.error('❌ Supabase update product failed', e)
      // Update Local Mock as fallback
      const products = await api.getProducts()
      const updatedProducts = products.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      )
      localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(updatedProducts))
      throw e
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        await apiClient.deleteProduct(id)
        return
      } catch (e) {
        console.error('API delete failed:', e)
        throw e
      }
    }

    // Fallback para Supabase direto
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Limpar cache do localStorage quando temos dados do banco
      localStorage.removeItem(STORAGE_PRODUCTS)
      
      console.log(`✅ Produto ${id} deletado com sucesso`)
    } catch (e) {
      console.error('❌ Supabase delete product failed', e)
      // Fallback to localStorage
      const products = await api.getProducts()
      const updatedProducts = products.filter((p) => p.id !== id)
      localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(updatedProducts))
      throw e
    }
  },

  getOrders: async (): Promise<Order[]> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        return await apiClient.getOrders()
      } catch (e) {
        console.error('API fetch orders failed:', e)
        const stored = localStorage.getItem(STORAGE_ORDERS)
        return stored ? JSON.parse(stored) : []
      }
    }

    // Fallback para Supabase direto
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar pedidos:', error)
        throw error
      }

      if (data && data.length > 0) {
        // Converter formato do banco para formato do app
        const orders = data.map((o: any) => {
          try {
            return {
              id: o.id,
              customerName: o.customer_name,
              customerEmail: o.customer_email,
              productId: o.product_id,
              productName: o.product_name,
              amount: o.amount,
              status: o.status as 'completed' | 'pending' | 'failed', // Garantir tipo correto
              date: o.date,
              paymentMethod: o.payment_method,
              paymentId: o.payment_id || undefined,
              botToken: o.bot_token || undefined,
              serverId: o.server_id || undefined,
              ownerId: o.owner_id || undefined,
              botStatus: (o.bot_status as 'waiting' | 'hosted' | 'active' | 'inactive' | 'online' | 'offline' | 'invalid_data') || 'waiting',
              subscriptionStartDate: o.subscription_start_date || undefined,
              subscriptionExpiryDate: o.subscription_expiry_date || undefined,
              userId: o.user_id || undefined,
              // Recursos do bot (campos opcionais - podem não existir se migration não foi executada)
              botCpuPercent: o.bot_cpu_percent != null ? Number(o.bot_cpu_percent) : undefined,
              botRamMb: o.bot_ram_mb != null ? Number(o.bot_ram_mb) : undefined,
              botRamUsedMb: o.bot_ram_used_mb != null ? Number(o.bot_ram_used_mb) : undefined,
              botNetworkTotalDown: o.bot_network_total_down != null ? Number(o.bot_network_total_down) : undefined,
              botNetworkTotalUp: o.bot_network_total_up != null ? Number(o.bot_network_total_up) : undefined,
              botNetworkCurrentDown: o.bot_network_current_down != null ? Number(o.bot_network_current_down) : undefined,
              botNetworkCurrentUp: o.bot_network_current_up != null ? Number(o.bot_network_current_up) : undefined,
              botServiceId: o.bot_service_id || undefined,
              botCluster: o.bot_cluster || undefined,
            }
          } catch (mapError) {
            console.error('❌ Erro ao mapear pedido:', mapError, o)
            // Retornar pedido básico mesmo com erro
            return {
              id: o.id || 'unknown',
              customerName: o.customer_name || '',
              customerEmail: o.customer_email || '',
              productId: o.product_id || '',
              productName: o.product_name || '',
              amount: o.amount || 0,
              status: (o.status as 'completed' | 'pending' | 'failed') || 'pending',
              date: o.date || new Date().toISOString(),
              paymentMethod: o.payment_method || '',
            }
          }
        })
        
        // Limpar cache do localStorage quando temos dados do banco
        localStorage.removeItem(STORAGE_ORDERS)
        
        console.log(`📦 Carregados ${orders.length} pedido(s) do banco de dados`)
        return orders
      }
      
      // Se não houver dados, retornar array vazio (não usar cache)
      return []
    } catch (e) {
      console.error('Supabase fetch orders failed', e)
      // Em caso de erro, tentar usar cache como fallback
      const stored = localStorage.getItem(STORAGE_ORDERS)
      return stored ? JSON.parse(stored) : []
    }
  },

  createOrder: async (order: Omit<Order, 'id' | 'date'>): Promise<Order> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        const newOrder = {
          ...order,
          id: `ord_${Math.random().toString(36).substr(2, 9)}`,
          date: new Date().toISOString(),
        }
        return await apiClient.createOrder(newOrder)
      } catch (e) {
        console.error('API create order failed:', e)
        throw e
      }
    }

    // Fallback para Supabase direto
    const newOrder: Order = {
      ...order,
      id: `ord_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
    }

    try {
      // Converter formato do app para formato do banco
      const dbOrder: any = {
        id: newOrder.id,
        customer_name: newOrder.customerName,
        customer_email: newOrder.customerEmail,
        product_id: newOrder.productId,
        product_name: newOrder.productName,
        amount: newOrder.amount,
        status: newOrder.status,
        date: newOrder.date,
        payment_method: newOrder.paymentMethod,
      }

      // Adicionar campos opcionais se existirem
      if (newOrder.paymentId) {
        dbOrder.payment_id = newOrder.paymentId
      }
      if (newOrder.botToken) {
        dbOrder.bot_token = newOrder.botToken
      }
      if (newOrder.serverId) {
        dbOrder.server_id = newOrder.serverId
      }
      if (newOrder.ownerId) {
        dbOrder.owner_id = newOrder.ownerId
      }
      if (newOrder.botStatus) {
        dbOrder.bot_status = newOrder.botStatus
      } else {
        // Se não tiver botStatus, definir como 'waiting' se tiver dados do bot
        if (newOrder.botToken && newOrder.serverId && newOrder.ownerId) {
          dbOrder.bot_status = 'waiting'
        }
      }
      if (newOrder.subscriptionStartDate) {
        dbOrder.subscription_start_date = newOrder.subscriptionStartDate
      }
      if (newOrder.subscriptionExpiryDate) {
        dbOrder.subscription_expiry_date = newOrder.subscriptionExpiryDate
      }
      if (newOrder.userId) {
        dbOrder.user_id = newOrder.userId
      }

      const { error } = await supabase.from('orders').insert(dbOrder)

      if (error) throw error
    } catch (e) {
      console.error('Supabase create order failed', e)
      // Fallback to localStorage
      const orders = await api.getOrders()
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify([newOrder, ...orders]))
    }

    return newOrder
  },

  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<void> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        await apiClient.updateOrder(orderId, updates)
        return
      } catch (e) {
        console.error('API update order failed:', e)
        throw e
      }
    }

    // Fallback para Supabase direto
    try {
      const dbUpdates: any = {}
      
      if (updates.status !== undefined) {
        dbUpdates.status = updates.status
      }
      if (updates.customerName !== undefined) {
        dbUpdates.customer_name = updates.customerName
      }
      if (updates.customerEmail !== undefined) {
        dbUpdates.customer_email = updates.customerEmail
      }
      if (updates.amount !== undefined) {
        dbUpdates.amount = updates.amount
      }
      if (updates.paymentId !== undefined) {
        dbUpdates.payment_id = updates.paymentId
      }
      if (updates.botToken !== undefined) {
        dbUpdates.bot_token = updates.botToken
      }
      if (updates.serverId !== undefined) {
        dbUpdates.server_id = updates.serverId
      }
      if (updates.ownerId !== undefined) {
        dbUpdates.owner_id = updates.ownerId
      }
      if (updates.botStatus !== undefined) {
        dbUpdates.bot_status = updates.botStatus
      }
      if (updates.botCpuPercent !== undefined) {
        dbUpdates.bot_cpu_percent = updates.botCpuPercent
      }
      if (updates.botRamMb !== undefined) {
        dbUpdates.bot_ram_mb = updates.botRamMb
      }
      if (updates.botRamUsedMb !== undefined) {
        dbUpdates.bot_ram_used_mb = updates.botRamUsedMb
      }
      if (updates.botNetworkTotalDown !== undefined) {
        dbUpdates.bot_network_total_down = updates.botNetworkTotalDown
      }
      if (updates.botNetworkTotalUp !== undefined) {
        dbUpdates.bot_network_total_up = updates.botNetworkTotalUp
      }
      if (updates.botNetworkCurrentDown !== undefined) {
        dbUpdates.bot_network_current_down = updates.botNetworkCurrentDown
      }
      if (updates.botNetworkCurrentUp !== undefined) {
        dbUpdates.bot_network_current_up = updates.botNetworkCurrentUp
      }
      if (updates.botServiceId !== undefined) {
        dbUpdates.bot_service_id = updates.botServiceId
      }
      if (updates.botCluster !== undefined) {
        dbUpdates.bot_cluster = updates.botCluster
      }
      if (updates.subscriptionStartDate !== undefined) {
        dbUpdates.subscription_start_date = updates.subscriptionStartDate
      }
      if (updates.subscriptionExpiryDate !== undefined) {
        dbUpdates.subscription_expiry_date = updates.subscriptionExpiryDate
      }

      // Verificar se há algo para atualizar
      if (Object.keys(dbUpdates).length === 0) {
        console.log(`ℹ️ Nenhuma atualização necessária para pedido ${orderId}`)
        return
      }

      console.log(`🔄 Atualizando pedido ${orderId} com:`, dbUpdates)

      // Atualizar o pedido diretamente (sem verificação prévia para evitar chamadas desnecessárias)
      const { data, error } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', orderId)
        .select()

      if (error) {
        console.error(`❌ Erro ao atualizar pedido ${orderId}:`, error)
        // Se o erro for "não encontrado", não lançar erro fatal
        if (error.code === 'PGRST116') {
          console.warn(`⚠️ Pedido ${orderId} não encontrado no banco de dados`)
          return // Retornar silenciosamente se não encontrado
        }
        throw error
      }

      // Verificar se a atualização foi bem-sucedida
      if (data && data.length > 0) {
        console.log(`✅ Pedido ${orderId} atualizado com sucesso`)
        // Limpar cache do localStorage para forçar recarregamento do banco
        localStorage.removeItem(STORAGE_ORDERS)
      } else {
        console.warn(`⚠️ Pedido ${orderId} não retornou dados após atualização`)
      }
    } catch (e) {
      console.error('❌ Supabase update order failed', e)
      // Não usar localStorage como fallback - deixar o erro ser tratado
      throw e
    }
  },

  getVisits: async (): Promise<number> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        return await apiClient.getVisits()
      } catch (e) {
        console.error('API fetch visits failed:', e)
        const visits = localStorage.getItem(STORAGE_VISITS)
        return visits ? parseInt(visits) : 1240
      }
    }

    // Fallback para Supabase direto
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('count')
        .eq('id', 'main')
        .single()

      if (error) throw error

      if (data) {
        return data.count || 0
      }
    } catch (e) {
      console.error('Supabase fetch visits failed', e)
    }

    const visits = localStorage.getItem(STORAGE_VISITS)
    return visits ? parseInt(visits) : 1240
  },

  incrementVisits: async (): Promise<void> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        await apiClient.incrementVisits()
        return
      } catch (e) {
        console.error('API increment visits failed:', e)
        const visits = await api.getVisits()
        localStorage.setItem(STORAGE_VISITS, (visits + 1).toString())
        return
      }
    }

    // Fallback para Supabase direto
    try {
      const currentVisits = await api.getVisits()
      const newCount = currentVisits + 1

      const { error } = await supabase
        .from('visits')
        .upsert(
          {
            id: 'main',
            count: newCount,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )

      if (error) throw error
    } catch (e) {
      console.error('Supabase increment visits failed', e)
      // Fallback to localStorage
      const visits = await api.getVisits()
      localStorage.setItem(STORAGE_VISITS, (visits + 1).toString())
    }
  },

  getSettings: async (): Promise<CheckoutSettings> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        return await apiClient.getSettings()
      } catch (e) {
        console.error('API fetch settings failed:', e)
        const stored = localStorage.getItem(STORAGE_SETTINGS)
        return stored ? JSON.parse(stored) : INITIAL_SETTINGS
      }
    }

    // Fallback para Supabase direto
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'main')
        .single()

      if (error) throw error

      if (data) {
        const settings = {
          paymentGateway: data.payment_gateway,
          apiKey: data.api_key,
          enablePix: data.enable_pix,
          enableCreditCard: data.enable_credit_card,
          mercadoPagoClientId: data.mercado_pago_client_id,
          mercadoPagoClientSecret: data.mercado_pago_client_secret,
          mercadoPagoPublicKey: data.mercado_pago_public_key,
          mercadoPagoAccessToken: data.mercado_pago_access_token?.trim() || data.mercado_pago_access_token, // Remover espaços
          livepixClientId: data.livepix_client_id,
          livepixClientSecret: data.livepix_client_secret,
          additionalFee: data.additional_fee,
          // Notification settings
          discordSalesPublic: data.discord_sales_public ?? false,
          discordSalesAdmin: data.discord_sales_admin ?? false,
          discordStockOut: data.discord_stock_out ?? false,
          discordAffiliateWithdrawal: data.discord_affiliate_withdrawal ?? false,
          appSalesNotification: data.app_sales_notification ?? false,
          emailStoreExpiration: data.email_store_expiration ?? false,
        }
        
        // Debug: verificar se Access Token foi carregado
        console.log('Settings carregadas:', {
          gateway: settings.paymentGateway,
          hasAccessToken: !!settings.mercadoPagoAccessToken,
          accessTokenLength: settings.mercadoPagoAccessToken?.length || 0,
          hasLivePixClientId: !!settings.livepixClientId,
          hasLivePixClientSecret: !!settings.livepixClientSecret,
        })
        
        return settings
      }
    } catch (e) {
      console.error('Supabase fetch settings failed', e)
    }

    const stored = localStorage.getItem(STORAGE_SETTINGS)
    return stored ? JSON.parse(stored) : INITIAL_SETTINGS
  },

  updateSettings: async (settings: CheckoutSettings): Promise<void> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        await apiClient.updateSettings(settings)
        return
      } catch (e) {
        console.error('API update settings failed:', e)
        throw e
      }
    }

    // Fallback para Supabase direto
    try {
      console.log('Salvando configurações:', {
        paymentGateway: settings.paymentGateway,
        hasClientId: !!settings.mercadoPagoClientId,
        hasClientSecret: !!settings.mercadoPagoClientSecret,
        hasAccessToken: !!settings.mercadoPagoAccessToken,
        accessTokenLength: settings.mercadoPagoAccessToken?.length || 0,
        accessTokenPrefix: settings.mercadoPagoAccessToken?.substring(0, 15) || 'N/A',
        hasLivePixClientId: !!settings.livepixClientId,
        hasLivePixClientSecret: !!settings.livepixClientSecret,
      })

      const { data, error } = await supabase
        .from('settings')
        .upsert(
          {
            id: 'main',
            payment_gateway: settings.paymentGateway,
            api_key: settings.apiKey || '',
            enable_pix: settings.enablePix,
            enable_credit_card: settings.enableCreditCard,
            mercado_pago_client_id: settings.mercadoPagoClientId || null,
            mercado_pago_client_secret: settings.mercadoPagoClientSecret || null,
            mercado_pago_public_key: settings.mercadoPagoPublicKey || null,
            mercado_pago_access_token: settings.mercadoPagoAccessToken?.trim() || null,
            livepix_client_id: settings.livepixClientId || null,
            livepix_client_secret: settings.livepixClientSecret || null,
            additional_fee: settings.additionalFee || false,
            // Notification settings
            discord_sales_public: settings.discordSalesPublic ?? false,
            discord_sales_admin: settings.discordSalesAdmin ?? false,
            discord_stock_out: settings.discordStockOut ?? false,
            discord_affiliate_withdrawal: settings.discordAffiliateWithdrawal ?? false,
            app_sales_notification: settings.appSalesNotification ?? false,
            email_store_expiration: settings.emailStoreExpiration ?? false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )

      if (error) {
        console.error('Erro do Supabase:', error)
        throw new Error(error.message || 'Erro ao salvar configurações no banco de dados')
      }

      // Verificar se o Access Token foi salvo
      console.log('Configurações salvas com sucesso:', {
        id: data?.[0]?.id || data?.id,
        gateway: data?.[0]?.payment_gateway || data?.payment_gateway,
        hasAccessToken: !!(data?.[0]?.mercado_pago_access_token || data?.mercado_pago_access_token),
        accessTokenLength: (data?.[0]?.mercado_pago_access_token || data?.mercado_pago_access_token)?.length || 0,
      })
    } catch (e: any) {
      console.error('Supabase update settings failed', e)
      // Fallback to localStorage
      localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings))
      // Re-throw para que o componente possa tratar o erro
      throw new Error(e?.message || 'Erro ao salvar configurações. Verifique o console para mais detalhes.')
    }
  },

  getBotSettings: async (): Promise<BotSettings> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        return await apiClient.getBotSettings()
      } catch (e) {
        console.error('API fetch bot_settings failed:', e)
        return {
          backendUrl: API_URL || '',
          useBackend: false,
        }
      }
    }

    // Fallback para Supabase direto
    try {
      const { data, error } = await supabase
        .from('bot_settings')
        .select('*')
        .eq('id', 'main')
        .single()

      if (error) throw error

      if (data) {
        return {
          id: data.id,
          discordToken: data.discord_token || '',
          squarecloudAccessToken: data.squarecloud_access_token || '',
          mercadoPagoAccessToken: data.mercado_pago_access_token || '',
          botId: data.bot_id || '',
          serverId: data.server_id || '',
          ownerId: data.owner_id || '',
          backendUrl: data.backend_url || API_URL || '',
          useBackend: data.use_backend ?? false,
          webhookUrl: data.webhook_url || '',
          carrinhosChannelId: data.carrinhos_channel_id || '',
          logsComprasChannelId: data.logs_compras_channel_id || '',
          logsBotEnviadosChannelId: data.logs_bot_enviados_channel_id || '',
          logsBotExpiradosChannelId: data.logs_bot_expirados_channel_id || '',
          logsQuebrarTermosChannelId: data.logs_quebrar_termos_channel_id || '',
          logsRenovacaoChannelId: data.logs_renovacao_channel_id || '',
          logsStartChannelId: data.logs_start_channel_id || '',
          imagemGen: data.imagem_gen || '',
          imagemMoney: data.imagem_money || '',
          imagemAuth: data.imagem_auth || '',
          imagemTicket: data.imagem_ticket || '',
          valorBotGen: data.valor_bot_gen || '',
          valorBotAuth: data.valor_bot_auth || '',
          valorBioPerso: data.valor_bio_perso || '',
          valorStockEx: data.valor_stock_ex || '',
          valorStockAuto: data.valor_stock_auto || '',
          valorStockMan: data.valor_stock_man || '',
          valorBotTicket: data.valor_bot_ticket || '',
        }
      }
    } catch (e) {
      console.error('Supabase fetch bot_settings failed', e)
    }

    // Retornar valores padrão se não encontrar
    return {
      backendUrl: API_URL || '',
      useBackend: false,
    }
  },

  updateBotSettings: async (settings: BotSettings): Promise<void> => {
    // Se usar API, fazer requisição para a API
    if (USE_API) {
      try {
        await apiClient.updateBotSettings(settings)
        return
      } catch (e) {
        console.error('API update bot_settings failed:', e)
        throw e
      }
    }

    // Fallback para Supabase direto
    try {
      const { error } = await supabase
        .from('bot_settings')
        .upsert(
          {
            id: 'main',
            discord_token: settings.discordToken || null,
            squarecloud_access_token: settings.squarecloudAccessToken || null,
            mercado_pago_access_token: settings.mercadoPagoAccessToken || null,
            bot_id: settings.botId || null,
            server_id: settings.serverId || null,
            owner_id: settings.ownerId || null,
            backend_url: settings.backendUrl || API_URL || '',
            use_backend: settings.useBackend ?? false,
            webhook_url: settings.webhookUrl || null,
            carrinhos_channel_id: settings.carrinhosChannelId || null,
            logs_compras_channel_id: settings.logsComprasChannelId || null,
            logs_bot_enviados_channel_id: settings.logsBotEnviadosChannelId || null,
            logs_bot_expirados_channel_id: settings.logsBotExpiradosChannelId || null,
            logs_quebrar_termos_channel_id: settings.logsQuebrarTermosChannelId || null,
            logs_renovacao_channel_id: settings.logsRenovacaoChannelId || null,
            logs_start_channel_id: settings.logsStartChannelId || null,
            imagem_gen: settings.imagemGen || null,
            imagem_money: settings.imagemMoney || null,
            imagem_auth: settings.imagemAuth || null,
            imagem_ticket: settings.imagemTicket || null,
            valor_bot_gen: settings.valorBotGen || null,
            valor_bot_auth: settings.valorBotAuth || null,
            valor_bio_perso: settings.valorBioPerso || null,
            valor_stock_ex: settings.valorStockEx || null,
            valor_stock_auto: settings.valorStockAuto || null,
            valor_stock_man: settings.valorStockMan || null,
            valor_bot_ticket: settings.valorBotTicket || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )

      if (error) {
        console.error('Erro do Supabase:', error)
        throw new Error(error.message || 'Erro ao salvar configurações do bot no banco de dados')
      }
    } catch (e: any) {
      console.error('Supabase update bot_settings failed', e)
      throw new Error(e?.message || 'Erro ao salvar configurações do bot. Verifique o console para mais detalhes.')
    }
  },

  // SquareCloud API functions
  // Nota: A API da SquareCloud não tem endpoint público para listar todas as aplicações
  // Por isso, vamos buscar os IDs das aplicações que estão nos pedidos e buscar cada uma
  async getSquareCloudBots(accessToken: string) {
    if (!accessToken) {
      throw new Error('Token da SquareCloud não configurado')
    }

    // Limpar espaços nas extremidades e quebras de linha
    const cleanToken = accessToken.trim().replace(/\n/g, '').replace(/\r/g, '')
    
    // Verificar se o token tem formato válido
    if (!cleanToken || cleanToken.length < 10) {
      throw new Error('Token da SquareCloud parece estar inválido. Verifique se copiou o token completo.')
    }

    // Buscar IDs das aplicações do banco de dados
    // Tentar primeiro na tabela 'applications', depois em outras tabelas possíveis
    try {
      let appIds: string[] = []
      let applicationsData: any[] = []
      
      // Tentar buscar da tabela 'applications'
      try {
        console.log('🔍 Buscando aplicações da tabela applications...')
        const { data: applications, error } = await supabase
          .from('applications')
          .select('id, subscription_start_date, subscription_expiry_date, expira')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('❌ Erro ao buscar da tabela applications:', error)
          console.error('Detalhes do erro:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          console.warn('💡 Tentando buscar de outras fontes...')
        } else {
          console.log(`📊 Resposta da query: ${applications?.length || 0} registros encontrados`)
          
          if (applications && applications.length > 0) {
            appIds = applications.map(app => app.id).filter((id): id is string => !!id && id.trim().length > 0)
            applicationsData = applications.map(app => ({
              id: app.id,
              subscription_start_date: app.subscription_start_date || (app.expira ? null : undefined),
              subscription_expiry_date: app.subscription_expiry_date || app.expira || undefined
            }))
            console.log(`✅ Encontradas ${appIds.length} aplicações na tabela 'applications'`)
            console.log('📋 IDs encontrados:', appIds)
          } else {
            console.warn('⚠️ Tabela applications existe mas está vazia ou RLS está bloqueando')
          }
        }
      } catch (e: any) {
        console.error('❌ Erro ao buscar da tabela applications:', e)
        console.error('Stack:', e.stack)
      }
      
      // Se não encontrou na tabela applications, tentar buscar dos pedidos (orders)
      if (appIds.length === 0) {
        console.log('🔍 Buscando aplicações da tabela orders...')
        try {
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('bot_service_id, subscription_start_date, subscription_expiry_date')
            .not('bot_service_id', 'is', null)
          
          if (!ordersError && orders && orders.length > 0) {
            const uniqueAppIds = [...new Set(orders.map(o => o.bot_service_id).filter((id): id is string => !!id && id.trim().length > 0))]
            appIds = uniqueAppIds
            
            // Criar applicationsData a partir dos pedidos
            applicationsData = uniqueAppIds.map(appId => {
              const order = orders.find(o => o.bot_service_id === appId)
              return {
                id: appId,
                subscription_start_date: order?.subscription_start_date || null,
                subscription_expiry_date: order?.subscription_expiry_date || null
              }
            })
            
            console.log(`✅ Encontradas ${appIds.length} aplicações na tabela 'orders'`)
          } else if (ordersError) {
            console.warn('⚠️ Erro ao buscar da tabela orders:', ordersError)
          }
        } catch (e) {
          console.warn('⚠️ Erro ao buscar da tabela orders:', e)
        }
      }
      
      // Se ainda não encontrou, verificar se há dados na tabela bot_settings (pode ter IDs lá)
      if (appIds.length === 0) {
        console.log('🔍 Verificando se há dados em outras tabelas...')
        // Não buscar de bot_settings pois essa tabela não armazena IDs de aplicações
      }
      
      // Se ainda não encontrou, tentar buscar de localStorage (fallback)
      if (appIds.length === 0) {
        console.log('🔍 Tentando buscar IDs salvos no localStorage...')
        try {
          const STORAGE_APP_IDS = 'squarecloud_app_ids'
          const saved = localStorage.getItem(STORAGE_APP_IDS)
          if (saved) {
            const savedIds = JSON.parse(saved)
            if (Array.isArray(savedIds) && savedIds.length > 0) {
              appIds = savedIds.filter((id): id is string => !!id && id.trim().length > 0)
              console.log(`✅ Encontrados ${appIds.length} IDs no localStorage`)
            }
          }
        } catch (e) {
          console.warn('⚠️ Erro ao buscar do localStorage:', e)
        }
      }
      
      console.log(`📋 IDs encontrados no banco de dados: ${appIds.length}`)
      
      if (appIds.length === 0) {
        console.warn('⚠️ Nenhuma aplicação encontrada no banco de dados. As aplicações precisam ser salvas na tabela "applications" para aparecer no dashboard.')
        console.warn('💡 Dica: Use o campo "Adicionar Aplicação" acima para adicionar IDs de aplicações manualmente.')
        return []
      }

      // Buscar informações de cada aplicação usando o endpoint correto
      // Processar em BATCHES PARALELOS para melhorar performance (3-4 por vez)
      const apps: any[] = []
      const batchSize = 4 // Processar 4 aplicações em paralelo
      const delayBetweenBatches = 300 // 300ms entre batches para evitar rate limiting
      
      console.log(`🔄 Processando ${appIds.length} aplicações em batches de ${batchSize} para melhorar performance...`)
      
      // Função para buscar informações de uma aplicação
      const fetchAppInfo = async (appId: string, index: number): Promise<any | null> => {
        try {
          console.log(`📥 Buscando aplicação ${index + 1}/${appIds.length}: ${appId}`)
          const appInfo = await api.getSquareCloudBotInfo(appId, cleanToken)
          
          // Buscar dados de assinatura do banco
          const appData = applicationsData.find(a => a.id === appId)
          
          // Converter para o formato esperado
          const result = {
            id: appInfo.id,
            name: appInfo.name,
            description: appInfo.custom || undefined,
            cluster: appInfo.cluster,
            ram: appInfo.ram,
            lang: appInfo.language || 'unknown',
            type: 'bot',
            subscriptionStartDate: appData?.subscription_start_date || undefined,
            subscriptionExpiryDate: appData?.subscription_expiry_date || undefined,
          }
          
          // Debug: verificar se os dados estão sendo carregados
          if (!result.subscriptionExpiryDate && appData) {
            console.log(`Bot ${result.name} não tem subscriptionExpiryDate:`, {
              appData,
              subscription_start_date: appData.subscription_start_date,
              subscription_expiry_date: appData.subscription_expiry_date
            })
          }
          
          console.log(`✅ Aplicação ${result.name} carregada com sucesso`)
          return result
        } catch (error: any) {
          // Para erros 404 (aplicação não encontrada), apenas logar e continuar
          if (error.message?.includes('404') || error.message?.includes('Not Found')) {
            console.warn(`⚠️ Aplicação ${appId} não encontrada na SquareCloud (404) - pode ter sido deletada`)
            return null
          }
          
          console.error(`❌ Erro ao buscar informações da aplicação ${appId}:`, error)
          
          // Se for erro 429, retornar null para tentar novamente depois
          if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
            console.warn(`⚠️ Rate limit atingido para aplicação ${appId}`)
            return null
          }
          
          return null
        }
      }
      
      // Processar em batches
      for (let i = 0; i < appIds.length; i += batchSize) {
        const batch = appIds.slice(i, i + batchSize)
        
        // Processar batch em paralelo
        const batchResults = await Promise.all(
          batch.map((appId, batchIndex) => fetchAppInfo(appId, i + batchIndex))
        )
        
        // Adicionar resultados válidos
        batchResults.forEach(result => {
          if (result) {
            apps.push(result)
          }
        })
        
        // Delay entre batches (exceto o último)
        if (i + batchSize < appIds.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
        }
      }
      
      // Se houver rate limiting, tentar novamente os que falharam sequencialmente com delay maior
      const failedIds = appIds.filter((appId, index) => {
        const found = apps.find(app => app.id === appId)
        return !found
      })
      
      if (failedIds.length > 0 && apps.length === 0) {
        // Se nenhuma aplicação foi carregada, pode ser rate limit - tentar sequencialmente
        console.warn(`⚠️ Possível rate limiting. Tentando ${failedIds.length} aplicações sequencialmente com delay maior...`)
        for (const appId of failedIds) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 segundos entre requisições
          const result = await fetchAppInfo(appId, appIds.indexOf(appId))
          if (result) {
            apps.push(result)
          }
        }
      }
      
      console.log(`✅ Processamento concluído: ${apps.length}/${appIds.length} aplicações carregadas`)

      // Filtrar nulls e retornar
      return apps.filter((app): app is any => app !== null)
    } catch (error: any) {
      console.error('Erro ao buscar aplicações:', error)
      throw error
    }
  },

  async checkApplicationExists(appId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('id', appId)
        .single()

      if (error) {
        // Se não encontrou, retorna false
        if (error.code === 'PGRST116') {
          return false
        }
        console.error('Erro ao verificar aplicação:', error)
        return false
      }

      return !!data
    } catch (e) {
      console.error('Erro ao verificar aplicação no banco:', e)
      return false
    }
  },

  async saveApplicationToDatabase(applicationData: {
    id: string
    discord_user_id?: string
    name: string
    valor_total?: string
    expira?: string
    tipo?: string
    adicionais?: string
    bot_id?: string
  }): Promise<any> {
    try {
      // Buscar informações do usuário atual se não fornecido
      let discordUserId = applicationData.discord_user_id
      let userId: string | undefined = undefined

      if (!discordUserId) {
        // Tentar buscar do contexto de autenticação
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            discordUserId = session.user.id
            
            // Buscar user_id (UUID) da tabela users
            const { data: userData } = await supabase
              .from('users')
              .select('id')
              .eq('discord_id', discordUserId)
              .single()
            
            if (userData) {
              userId = userData.id
            }
          }
        } catch (e) {
          console.warn('Não foi possível buscar informações do usuário:', e)
        }
      } else {
        // Buscar user_id (UUID) da tabela users pelo discord_id
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('discord_id', discordUserId)
            .single()
          
          if (userData) {
            userId = userData.id
          }
        } catch (e) {
          console.warn('Não foi possível buscar user_id:', e)
        }
      }

      // Preparar dados para inserção
      const insertData: any = {
        id: applicationData.id,
        discord_user_id: discordUserId || null,
        name: applicationData.name,
        valor_total: applicationData.valor_total || null,
        expira: applicationData.expira || null,
        tipo: applicationData.tipo || null,
        adicionais: applicationData.adicionais || null,
        bot_id: applicationData.bot_id || null,
      }

      if (userId) {
        insertData.user_id = userId
      }

      // Inserir ou atualizar (upsert) no Supabase
      const { data, error } = await supabase
        .from('applications')
        .upsert(insertData, { onConflict: 'id' })
        .select()
        .single()

      if (error) {
        console.error('Erro ao salvar aplicação no banco de dados:', error)
        throw error
      }

      return data
    } catch (error: any) {
      console.error('Erro ao salvar aplicação no banco de dados:', error)
      throw error
    }
  },

  async getSquareCloudBotStatus(appId: string, accessToken: string, retryCount = 0) {
    if (!accessToken) {
      throw new Error('Token da SquareCloud não configurado')
    }

    const cleanToken = accessToken.trim().replace(/\n/g, '').replace(/\r/g, '')

    const response = await fetch(`https://api.squarecloud.app/v2/apps/${appId}/status`, {
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        } else if (response.status === 429) {
          errorMessage = 'Muitas requisições. Aguarde alguns segundos antes de tentar novamente.'
        }
      } catch (e) {
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        } else if (response.status === 429) {
          errorMessage = 'Muitas requisições. Aguarde alguns segundos antes de tentar novamente.'
        }
      }
      
      // Retry automático para erro 429 (máximo 2 tentativas)
      if (response.status === 429 && retryCount < 2) {
        const waitTime = (retryCount + 1) * 3000 // 3s, 6s
        console.warn(`⚠️ Rate limit (429) ao buscar status do app ${appId}. Aguardando ${waitTime / 1000}s antes de tentar novamente...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.getSquareCloudBotStatus(appId, accessToken, retryCount + 1)
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Erro ao buscar status do bot')
    }
    
    const statusData = data.response || {}
    
    // Garantir que o status está correto
    // A API pode retornar 'running' como string ou boolean
    const isRunning = statusData.running === true || statusData.running === 'true' || statusData.status === 'running'
    
    return {
      ...statusData,
      running: isRunning,
      status: isRunning ? 'running' : 'stopped'
    }
  },

  async getSquareCloudBotInfo(appId: string, accessToken: string) {
    if (!accessToken) {
      throw new Error('Token da SquareCloud não configurado')
    }

    const cleanToken = accessToken.trim().replace(/\n/g, '').replace(/\r/g, '')

    // Criar um AbortController para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

    try {
      const response = await fetch(`https://api.squarecloud.app/v2/apps/${appId}`, {
        headers: {
          'Authorization': cleanToken,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          if (response.status === 401) {
            errorMessage = 'Token inválido. Verifique as configurações.'
          }
        } catch (e) {
          if (response.status === 401) {
            errorMessage = 'Token inválido. Verifique as configurações.'
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Erro ao buscar informações do bot')
      }
      
      return data.response
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Se foi abortado por timeout
      if (error.name === 'AbortError') {
        throw new Error('Timeout: A requisição demorou mais de 10 segundos')
      }
      
      // Re-throw outros erros
      throw error
    }
  },

  async controlSquareCloudBot(
    appId: string,
    action: 'start' | 'stop' | 'restart',
    accessToken: string
  ) {
    if (!accessToken) {
      throw new Error('Token da SquareCloud não configurado')
    }

    const cleanToken = accessToken.trim().replace(/\n/g, '').replace(/\r/g, '')

    const response = await fetch(`https://api.squarecloud.app/v2/apps/${appId}/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        }
      } catch (e) {
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        }
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    if (data.status === 'error') {
      throw new Error(data.message || `Erro ao ${action} bot`)
    }
    
    return data
  },

  async getSquareCloudBotLogs(appId: string, accessToken: string) {
    if (!accessToken) {
      throw new Error('Token da SquareCloud não configurado')
    }

    const cleanToken = accessToken.trim().replace(/\n/g, '').replace(/\r/g, '')

    console.log('Buscando logs do bot:', appId)
    
    const response = await fetch(`https://api.squarecloud.app/v2/apps/${appId}/logs`, {
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        } else if (response.status === 429) {
          errorMessage = 'Muitas requisições. Aguarde alguns segundos antes de tentar novamente.'
        }
      } catch (e) {
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        } else if (response.status === 429) {
          errorMessage = 'Muitas requisições. Aguarde alguns segundos antes de tentar novamente.'
        }
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('Resposta da API de logs:', data)
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Erro ao buscar logs do bot')
    }
    
    // A API pode retornar os logs em diferentes formatos
    // Verificar se é string direta, objeto com content, ou array
    let logsContent = ''
    
    if (typeof data.response === 'string') {
      logsContent = data.response
    } else if (data.response?.content) {
      logsContent = data.response.content
    } else if (data.response?.logs) {
      // Se for um objeto com propriedade logs (string JSON)
      if (typeof data.response.logs === 'string') {
        try {
          // Tentar fazer parse se for JSON string
          const parsed = JSON.parse(data.response.logs)
          if (typeof parsed === 'string') {
            logsContent = parsed
          } else if (parsed.logs) {
            logsContent = parsed.logs
          } else {
            logsContent = data.response.logs
          }
        } catch {
          // Se não for JSON válido, usar como string
          logsContent = data.response.logs
        }
      } else {
        logsContent = data.response.logs
      }
    } else if (Array.isArray(data.response)) {
      logsContent = data.response.join('\n')
    } else if (data.response) {
      // Tentar extrair logs de qualquer estrutura
      const responseStr = JSON.stringify(data.response)
      if (responseStr.includes('"logs"')) {
        try {
          const parsed = JSON.parse(responseStr)
          if (parsed.logs) {
            logsContent = typeof parsed.logs === 'string' ? parsed.logs : JSON.stringify(parsed.logs)
          }
        } catch {
          logsContent = responseStr
        }
      } else {
        logsContent = responseStr
      }
    }
    
    // Limpar caracteres de escape e formatar
    if (logsContent) {
      // Substituir \n por quebras de linha reais
      logsContent = logsContent.replace(/\\n/g, '\n')
      // Remover aspas extras no início e fim se for JSON string
      logsContent = logsContent.replace(/^["']|["']$/g, '')
    }
    
    return logsContent || ''
  },

  async getSquareCloudBotFiles(appId: string, accessToken: string, path: string = '') {
    if (!accessToken) {
      throw new Error('Token da SquareCloud não configurado')
    }

    const cleanToken = accessToken.trim().replace(/\n/g, '').replace(/\r/g, '')
    
    // A SquareCloud usa o endpoint /files para listar arquivos
    // Conforme documentação: GET /v2/apps/{app_id}/files?path={path}
    const url = `https://api.squarecloud.app/v2/apps/${appId}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Se 404, retornar array vazio ao invés de erro (arquivo/diretório não existe)
      if (response.status === 404) {
        return []
      }
      
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        }
      } catch (e) {
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        }
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Erro ao buscar arquivos')
    }
    
    return data.response || []
  },

  async getSquareCloudBotFileContent(appId: string, accessToken: string, filePath: string) {
    if (!accessToken) {
      throw new Error('Token da SquareCloud não configurado')
    }

    const cleanToken = accessToken.trim().replace(/\n/g, '').replace(/\r/g, '')

    // A SquareCloud usa GET /v2/apps/{app_id}/files/content?path={path} para obter conteúdo do arquivo
    // Conforme documentação: GET /v2/apps/{app_id}/files/content com query param path
    const url = `https://api.squarecloud.app/v2/apps/${appId}/files/content?path=${encodeURIComponent(filePath)}`
    
    console.log('Buscando arquivo:', filePath, 'URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // Se 404, retornar null (arquivo não existe) ao invés de lançar erro
      if (response.status === 404) {
        console.log('Arquivo não encontrado:', filePath)
        return null
      }
      
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        }
      } catch (e) {
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        }
      }
      console.error('Erro ao buscar arquivo:', errorMessage)
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('Resposta da API para', filePath, ':', data)
    
    if (data.status === 'error') {
      // Se erro, mas não é 404, lançar erro apenas se for erro crítico
      if (data.message?.includes('not found') || data.message?.includes('não encontrado')) {
        console.log('Arquivo não encontrado (erro na resposta):', filePath)
        return null
      }
      throw new Error(data.message || 'Erro ao buscar arquivo')
    }
    
    // A resposta geralmente tem a estrutura: { status: 'success', response: { type: 'Buffer', data: [...] } }
    const responseData = data.response || data
    
    console.log('ResponseData para', filePath, ':', responseData)
    
    // A SquareCloud retorna o conteúdo do arquivo como Buffer (array de bytes)
    // Formato: { type: 'Buffer', data: [112, 111, ...] }
    if (responseData && responseData.type === 'Buffer' && Array.isArray(responseData.data)) {
      console.log('Conteúdo é Buffer, convertendo bytes para string')
      try {
        // Converter array de bytes para string usando UTF-8
        const bytes = new Uint8Array(responseData.data)
        // Usar TextDecoder para garantir encoding UTF-8 correto
        const decoder = new TextDecoder('utf-8')
        const textContent = decoder.decode(bytes)
        console.log('Texto decodificado (primeiros 200 chars):', textContent.substring(0, 200))
        
        // Tentar fazer parse do JSON primeiro
        try {
          const parsed = JSON.parse(textContent)
          console.log('JSON parseado com sucesso')
          return parsed
        } catch (parseError) {
          console.log('Erro ao fazer parse do JSON, tentando decodificar Base64:', parseError)
          // Se não for JSON válido, pode ser Base64
          try {
            const decoded = atob(textContent.trim())
            console.log('Base64 decodificado (primeiros 200 chars):', decoded.substring(0, 200))
            // Tentar fazer parse do conteúdo decodificado
            try {
              const parsed = JSON.parse(decoded)
              console.log('JSON parseado após decodificar Base64')
              return parsed
            } catch {
              return decoded
            }
          } catch {
            // Se não conseguir decodificar Base64, retornar como texto
          return textContent
          }
        }
      } catch (error) {
        console.error('Erro ao converter Buffer para string:', error)
        throw new Error('Erro ao processar conteúdo do arquivo')
      }
    }
    
    // Se tiver propriedade content (formato alternativo)
    if (responseData.content) {
      if (typeof responseData.content === 'string') {
        try {
          return JSON.parse(responseData.content)
        } catch {
          return responseData.content
        }
      }
      return responseData.content
    }
    
    // Se for string direta
    if (typeof responseData === 'string') {
      // Verificar se é Base64 e tentar decodificar
      try {
        // Tentar fazer parse direto primeiro
        return JSON.parse(responseData)
      } catch {
        // Se não for JSON válido, pode ser Base64
        try {
          // Tentar decodificar Base64
          const decoded = atob(responseData)
          // Tentar fazer parse do conteúdo decodificado
          try {
            return JSON.parse(decoded)
          } catch {
            return decoded
          }
        } catch {
          // Se não conseguir decodificar, retornar como está
        return responseData
        }
      }
    }
    
    // Se for objeto, pode já ser o conteúdo parseado
    return responseData
  },

  async updateSquareCloudBotFile(
    appId: string,
    accessToken: string,
    filePath: string,
    content: string
  ) {
    if (!accessToken) {
      throw new Error('Token da SquareCloud não configurado')
    }

    const cleanToken = accessToken.trim().replace(/\n/g, '').replace(/\r/g, '')
    
    // Segundo a documentação da SquareCloud, o endpoint correto é:
    // PUT /v2/apps/{app_id}/files
    // Com o body contendo: { "path": "<string>", "content": "<string>" }
    const url = `https://api.squarecloud.app/v2/apps/${appId}/files`
    
    // A SquareCloud espera o conteúdo em Base64
    // Mas vamos tentar enviar diretamente primeiro para arquivos JSON
    // Se não funcionar, voltamos para Base64
    const isJsonFile = filePath.endsWith('.json')
    
    let finalContent: string
    if (isJsonFile) {
      // Para arquivos JSON, tentar enviar diretamente (sem Base64)
      // A SquareCloud pode aceitar JSON diretamente
      finalContent = content
      console.log('Enviando arquivo JSON diretamente (sem Base64)')
    } else {
      // Para outros arquivos, usar Base64
      finalContent = btoa(unescape(encodeURIComponent(content)))
      console.log('Enviando arquivo com Base64')
    }
    
    console.log('Salvando arquivo:', filePath, 'URL:', url)
    console.log('Tamanho do conteúdo original:', content.length)
    console.log('Tamanho do conteúdo final:', finalContent.length)
    console.log('Primeiros 200 chars do conteúdo original:', content.substring(0, 200))
    
    const requestBody = {
      path: filePath,
      content: finalContent,
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        } else if (response.status === 400) {
          errorMessage = errorData.message || 'Requisição inválida. Verifique o formato do conteúdo e o caminho do arquivo.'
        }
      } catch (e: any) {
        if (response.status === 401) {
          errorMessage = 'Token inválido. Verifique as configurações.'
        } else if (e.message) {
          errorMessage = e.message
        }
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Erro ao atualizar arquivo')
    }
    
    return data.response || data
  },

  async getUsers(): Promise<Array<{ id: string; discord_id: string; username: string; email: string | null }>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, discord_id, username, email')
        .order('username', { ascending: true })

      if (error) {
        console.error('Erro ao buscar usuários:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      throw error
    }
  },

  async deleteApplication(appId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', appId)

      if (error) {
        console.error('Erro ao excluir aplicação:', error)
        throw error
      }
    } catch (error) {
      console.error('Erro ao excluir aplicação:', error)
      throw error
    }
  },

  async uploadSquareCloudApplication(
    accessToken: string,
    file: File,
    options?: {
      name?: string
      description?: string
      memory?: number
      main?: string
      version?: string
      webPublish?: boolean
      startCommand?: string
      autoRestart?: boolean
      env?: Record<string, string>
      discordUserId?: string | null
      userId?: string | null
      valorTotal?: string | null
      tipo?: string | null
      adicionais?: string | null
      botId?: string | null
    }
  ): Promise<{ appId: string; message: string }> {
    if (!accessToken) {
      throw new Error('Token da SquareCloud não configurado')
    }

    if (!file) {
      throw new Error('Arquivo não selecionado')
    }

    const cleanToken = accessToken.trim().replace(/\n/g, '').replace(/\r/g, '')

    // SEMPRE tentar usar backend primeiro (evita CORS)
    // O upload direto não funciona devido a CORS da SquareCloud
    const backendUrl = getApiUrl()

    if (backendUrl && backendUrl.trim() !== '') {
      try {
        // Fazer upload através do backend
        const formData = new FormData()
        formData.append('file', file)
        formData.append('accessToken', cleanToken)
        
        if (options) {
          if (options.name) formData.append('name', options.name)
          if (options.description) formData.append('description', options.description)
          if (options.memory) formData.append('memory', options.memory.toString())
          if (options.discordUserId) formData.append('discordUserId', options.discordUserId)
          if (options.userId) formData.append('userId', options.userId)
          if (options.valorTotal) formData.append('valorTotal', options.valorTotal)
          if (options.tipo) formData.append('tipo', options.tipo)
          if (options.adicionais) formData.append('adicionais', options.adicionais)
          if (options.botId) formData.append('botId', options.botId)
        }

        const response = await fetch(`${backendUrl}/api/squarecloud/upload`, {
          method: 'POST',
          body: formData,
        })

        // Verificar se a resposta é JSON antes de fazer parse
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text()
          // Se recebeu HTML, provavelmente o servidor não está rodando ou a URL está errada
          if (text.includes('<!doctype') || text.includes('<html')) {
            throw new Error(
              `Backend não está respondendo corretamente. Verifique se o servidor está rodando em ${backendUrl}. ` +
              `A resposta recebida foi HTML em vez de JSON.`
            )
          }
          throw new Error(`Resposta inválida do servidor: ${text.substring(0, 100)}`)
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
        }

        const data = await response.json()
        return {
          appId: data.appId || data.id || '',
          message: data.message || 'Aplicação enviada com sucesso!',
        }
      } catch (error: any) {
        // Se o backend falhar, lançar erro explicativo
        console.error('❌ Erro ao conectar com backend:', {
          url: backendUrl,
          error: error.message,
          type: error.name
        })
        
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS') || error.message.includes('NetworkError') || error.message.includes('timeout')) {
          throw new Error(
            `Erro de conexão com o backend em ${backendUrl}. ` +
            `A API não está respondendo (timeout ou erro de rede). ` +
            `Verifique se a API na SquareCloud está online e se o deploy foi feito com o código atualizado (porta 80). ` +
            `Teste manualmente: ${backendUrl}/health`
          )
        }
        throw error
      }
    }

    // Se não houver backend configurado, mostrar erro claro
    throw new Error(
      'Backend não configurado. Configure VITE_API_URL nas variáveis de ambiente para fazer upload de aplicações. ' +
      'O upload direto não é possível devido a restrições de CORS da SquareCloud.'
    )
  },

  // Renovar assinatura de um bot (adiciona 1 mês ao tempo restante)
  renewSubscription: async (orderId: string): Promise<{ success: boolean; newExpiryDate: string }> => {
    const backendUrl = getApiUrl()
    
    if (!backendUrl) {
      throw new Error('Backend não configurado. Configure VITE_API_URL.')
    }

    const response = await fetch(`${backendUrl}/api/orders/renew-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || error.error || 'Erro ao renovar assinatura')
    }

    const data = await response.json()
    return {
      success: data.success,
      newExpiryDate: data.newExpiryDate,
    }
  },

  // Atualizar data de expiração (admin)
  updateExpiryDate: async (orderId: string, expiryDate: string): Promise<{ success: boolean; newExpiryDate: string }> => {
    const backendUrl = getApiUrl()
    
    if (!backendUrl) {
      throw new Error('Backend não configurado. Configure VITE_API_URL.')
    }

    const response = await fetch(`${backendUrl}/api/orders/update-expiry`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, expiryDate }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || error.error || 'Erro ao atualizar data de expiração')
    }

    const data = await response.json()
    return {
      success: data.success,
      newExpiryDate: data.newExpiryDate,
    }
  },
}

