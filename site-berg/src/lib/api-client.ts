// Cliente API para comunicação com o backend centralizado
// Substitui chamadas diretas ao Supabase por chamadas à API

import { getApiUrl } from './api-config'

const API_URL = getApiUrl()

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(error.error || error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const apiClient = {
  // Produtos
  getProducts: () => apiRequest<any[]>('/api/products'),
  createProduct: (product: any) => apiRequest<any>('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  updateProduct: (id: string, updates: any) => apiRequest<any>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),
  deleteProduct: (id: string) => apiRequest<any>(`/api/products/${id}`, {
    method: 'DELETE',
  }),

  // Pedidos
  getOrders: () => apiRequest<any[]>('/api/orders'),
  createOrder: (order: any) => apiRequest<any>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  }),
  updateOrder: (id: string, updates: any) => apiRequest<any>(`/api/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  }),

  // Configurações
  getSettings: () => apiRequest<any>('/api/settings'),
  updateSettings: (settings: any) => apiRequest<any>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),

  // Bot Settings
  getBotSettings: () => apiRequest<any>('/api/bot-settings'),
  updateBotSettings: (settings: any) => apiRequest<any>('/api/bot-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),

  // Pagamentos (para compatibilidade)
  createPixPayment: (accessToken: string, paymentData: any) => 
    apiRequest<any>('/api/create-pix-payment', {
      method: 'POST',
      body: JSON.stringify({ accessToken, paymentData }),
    }),
  createPreference: (accessToken: string, preferenceData: any) =>
    apiRequest<any>('/api/create-preference', {
      method: 'POST',
      body: JSON.stringify({ accessToken, preferenceData }),
    }),
  getPaymentStatus: (paymentId: string, accessToken: string) =>
    apiRequest<any>(`/api/payment-status/${paymentId}?accessToken=${encodeURIComponent(accessToken)}`),

  // Visitas
  getVisits: async () => {
    const data = await apiRequest<{ count: number }>('/api/visits')
    return data.count
  },
  incrementVisits: () => apiRequest<{ count: number }>('/api/visits/increment', {
    method: 'POST',
  }),
}

