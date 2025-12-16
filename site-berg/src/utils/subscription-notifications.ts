import { api } from '@/lib/api'
import { differenceInDays, isAfter } from 'date-fns'

/**
 * Verifica assinaturas que estão próximas de expirar (7 dias ou menos)
 * e envia notificações
 */
export async function checkSubscriptionExpiry() {
  try {
    const orders = await api.getOrders()
    const now = new Date()
    
    const expiringSoon = orders.filter((order) => {
      if (!order.subscriptionExpiryDate) return false
      const expiry = new Date(order.subscriptionExpiryDate)
      const daysUntilExpiry = differenceInDays(expiry, now)
      
      // Verificar se está expirado ou expira em 7 dias ou menos
      return (!isAfter(expiry, now) || daysUntilExpiry <= 7) && daysUntilExpiry >= -7
    })

    return expiringSoon
  } catch (error) {
    console.error('Erro ao verificar expiração de assinaturas:', error)
    return []
  }
}

/**
 * Verifica se uma assinatura precisa de notificação (7 dias ou menos, ou já expirada)
 */
export function needsRenewalNotification(expiryDate?: string): boolean {
  if (!expiryDate) return false
  
  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntilExpiry = differenceInDays(expiry, now)
  
  // Retorna true se faltar 7 dias ou menos, ou se já estiver expirado
  return daysUntilExpiry <= 7
}

/**
 * Obtém mensagem de notificação baseada nos dias restantes
 */
export function getRenewalMessage(expiryDate?: string): string | null {
  if (!expiryDate) return null
  
  const expiry = new Date(expiryDate)
  const now = new Date()
  const daysUntilExpiry = differenceInDays(expiry, now)
  
  if (daysUntilExpiry < 0) {
    return `Sua assinatura expirou há ${Math.abs(daysUntilExpiry)} dia${Math.abs(daysUntilExpiry) > 1 ? 's' : ''}. Renove agora!`
  } else if (daysUntilExpiry === 0) {
    return 'Sua assinatura expira hoje! Renove agora para continuar usando.'
  } else if (daysUntilExpiry <= 7) {
    return `Sua assinatura expira em ${daysUntilExpiry} dia${daysUntilExpiry > 1 ? 's' : ''}. Renove agora!`
  }
  
  return null
}

