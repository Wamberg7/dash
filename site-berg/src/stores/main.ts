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
      console.log('✅ Dados carregados com sucesso:', {
        products: fetchedProducts.length,
        orders: fetchedOrders.length,
        visits: fetchedVisits,
        hasSettings: !!fetchedSettings,
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
      await api.updateOrder(orderId, updates)
      console.log(`✅ Pedido ${orderId} atualizado no banco de dados`)
      
      // Atualizar apenas o pedido específico no estado local (não recarregar tudo)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
      )
    } catch (error) {
      console.error('❌ Erro ao atualizar pedido:', error)
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

  // Calculate Stats
  const stats: DashboardStats = {
    totalVisits: visits,
    totalSales: orders.length,
    salesBotCount: orders.filter((o) => o.productId === 'sales-bot').length,
    ticketBotCount: orders.filter((o) => o.productId === 'ticket-bot').length,
    totalRevenue: orders.reduce((acc, curr) => acc + curr.amount, 0),
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
