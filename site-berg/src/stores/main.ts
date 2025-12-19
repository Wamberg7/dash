import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { Product, Order, DashboardStats, CheckoutSettings } from '@/types'
import { api } from '@/lib/api'
import { getPaymentStatus } from '@/lib/mercadopago'

interface AppState {
  products: Product[]
  orders: Order[]
  stats: DashboardStats
  settings: CheckoutSettings | null
  isLoading: boolean
  refreshData: () => Promise<void>
  createProduct: (product: Omit<Product, 'id'>) => Promise<Product>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  createOrder: (order: Omit<Order, 'id' | 'date'>) => Promise<Order>
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>
  incrementVisits: () => void
  updateSettings: (settings: CheckoutSettings) => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function useAppStore() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider')
  }
  return context
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [visits, setVisits] = useState<number>(0)
  const [settings, setSettings] = useState<CheckoutSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Limpar cache antes de recarregar para garantir dados atualizados do banco
      try {
        localStorage.removeItem('orders')
      } catch (e) {
        // Ignorar erro se localStorage não estiver disponível
      }
      
      const [fetchedProducts, fetchedOrders, fetchedVisits, fetchedSettings] =
        await Promise.all([
          api.getProducts().catch((err) => {
            console.error('❌ Erro ao carregar produtos:', err)
            return []
          }),
          api.getOrders().catch((err) => {
            console.error('❌ Erro ao carregar pedidos:', err)
            return []
          }),
          api.getVisits().catch((err) => {
            console.error('❌ Erro ao carregar visitas:', err)
            return 0
          }),
          api.getSettings().catch((err) => {
            console.error('❌ Erro ao carregar configurações:', err)
            return null
          }),
        ])
      setProducts(fetchedProducts)
      setOrders(fetchedOrders)
      setVisits(fetchedVisits)
      setSettings(fetchedSettings)
      
      // Calcular estatísticas para log
      const approvedOrders = fetchedOrders.filter((o) => o.status === 'completed')
      const pendingOrders = fetchedOrders.filter((o) => o.status === 'pending')
      const failedOrders = fetchedOrders.filter((o) => o.status === 'failed')
      
      console.log('✅✅✅ DADOS CARREGADOS DO BANCO ✅✅✅:', {
        products: fetchedProducts.length,
        orders: fetchedOrders.length,
        approvedOrders: approvedOrders.length,
        pendingOrders: pendingOrders.length,
        failedOrders: failedOrders.length,
        visits: fetchedVisits,
        hasSettings: !!fetchedSettings,
      })
      
      // Log detalhado dos status dos pedidos
      console.log('📊 Status dos pedidos:', {
        completed: fetchedOrders.filter((o) => o.status === 'completed').map((o) => ({ id: o.id, status: o.status })),
        pending: fetchedOrders.filter((o) => o.status === 'pending').map((o) => ({ id: o.id, status: o.status })),
        failed: fetchedOrders.filter((o) => o.status === 'failed').map((o) => ({ id: o.id, status: o.status })),
      })
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error)
      // Garantir que o loading pare mesmo com erro
      setProducts([])
      setOrders([])
      setVisits(0)
      setSettings(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Verificação automática desabilitada para evitar loops infinitos
  // A verificação deve ser feita manualmente pelo usuário ou na página de pagamento

  const createProduct = useCallback(async (product: Omit<Product, 'id'>): Promise<Product> => {
    try {
      const newProduct = await api.createProduct(product)
      setProducts((prev) => [newProduct, ...prev])
      return newProduct
    } catch (error) {
      console.error('Erro ao criar produto no store:', error)
      throw error
    }
  }, [])

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    await api.updateProduct(id, updates)
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    )
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    await api.deleteProduct(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const createOrder = useCallback(async (orderData: Omit<Order, 'id' | 'date'>): Promise<Order> => {
    const newOrder = await api.createOrder(orderData)
    setOrders((prev) => [newOrder, ...prev])
    return newOrder
  }, [])

  const updateOrder = useCallback(async (orderId: string, updates: Partial<Order>): Promise<void> => {
    try {
      // VALIDAR STATUS ANTES DE ENVIAR - GARANTIR QUE NÃO VENHA CONCATENADO
      if (updates.status !== undefined) {
        const statusValue = String(updates.status).trim()
        
        // Se o status tiver espaço ou múltiplos valores, normalizar
        if (statusValue.includes(' ')) {
          const firstStatus = statusValue.split(' ')[0].trim().toLowerCase()
          if (firstStatus === 'completed' || firstStatus === 'pending' || firstStatus === 'failed') {
            updates.status = firstStatus as 'completed' | 'pending' | 'failed'
            console.warn(`⚠️⚠️⚠️ STATUS CONCATENADO DETECTADO! Normalizando de "${statusValue}" para "${firstStatus}" ⚠️⚠️⚠️`)
          } else {
            console.error(`❌ Status inválido: "${statusValue}", não atualizando`)
            throw new Error(`Status inválido: "${statusValue}"`)
          }
        } else {
          const normalizedStatus = statusValue.toLowerCase()
          if (normalizedStatus === 'completed' || normalizedStatus === 'pending' || normalizedStatus === 'failed') {
            updates.status = normalizedStatus as 'completed' | 'pending' | 'failed'
          } else {
            console.error(`❌ Status inválido: "${statusValue}", não atualizando`)
            throw new Error(`Status inválido: "${statusValue}"`)
          }
        }
      }
      
      console.log(`🔄🔄🔄 updateOrder chamado para ${orderId} com:`, updates)
      await api.updateOrder(orderId, updates)
      console.log(`✅✅✅ Pedido ${orderId} atualizado no banco de dados com sucesso ✅✅✅`)
      
      // Atualizar apenas o pedido específico no estado local (não recarregar tudo)
      setOrders((prev) => {
        const updated = prev.map((o) => {
          if (o.id === orderId) {
            const newOrder = { ...o, ...updates }
            console.log(`🔄 Pedido atualizado no estado local:`, {
              id: newOrder.id,
              status: newOrder.status,
              oldStatus: o.status,
              isCompleted: newOrder.status === 'completed',
            })
            return newOrder
          }
          return o
        })
        
        // Log de quantos pedidos estão completed após atualização
        const completedCount = updated.filter((o) => o.status === 'completed').length
        console.log(`📊📊📊 Total de pedidos completed após atualização: ${completedCount} de ${updated.length} 📊📊📊`)
        
        return updated
      })
      
      console.log(`✅ Estado local atualizado para pedido ${orderId}`)
    } catch (error) {
      console.error('❌❌❌ Erro ao atualizar pedido no store:', error)
      console.error('❌ Detalhes do erro:', error)
      throw error
    }
  }, [])

  const incrementVisits = useCallback(() => {
    api.incrementVisits().then(() => {
      setVisits((v) => v + 1)
    })
  }, [])

  const updateSettings = useCallback(async (newSettings: CheckoutSettings) => {
    try {
      await api.updateSettings(newSettings)
      // Recarregar settings do banco para garantir sincronização
      const updatedSettings = await api.getSettings()
      setSettings(updatedSettings)
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      throw error
    }
  }, [])

  // Calculate Stats - apenas pedidos completed contam como vendas
  const approvedOrders = orders.filter((o) => o.status === 'completed')
  
  const stats: DashboardStats = {
    totalVisits: visits,
    totalSales: approvedOrders.length,
    salesBotCount: approvedOrders.filter((o) => o.productId === 'sales-bot').length,
    ticketBotCount: approvedOrders.filter((o) => o.productId === 'ticket-bot').length,
    totalRevenue: approvedOrders.reduce((acc, curr) => acc + curr.amount, 0),
  }

  const value = {
    products,
    orders,
    stats,
    settings,
    isLoading,
    refreshData: loadData,
    createProduct,
    updateProduct,
    deleteProduct,
    createOrder,
    updateOrder,
    incrementVisits,
    updateSettings,
  }

  return React.createElement(AppContext.Provider, { value }, children)
}
