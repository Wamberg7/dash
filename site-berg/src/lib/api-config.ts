// Configuração centralizada da URL da API
// Remove dependência de localhost em produção

/**
 * Obtém a URL base da API
 * Prioridade:
 * 1. VITE_API_URL (variável de ambiente)
 * 2. VITE_BACKEND_URL (variável de ambiente alternativa)
 * 3. Em desenvolvimento: localhost:3001 (apenas se VITE_API_URL não estiver definida)
 * 4. Em produção: URL da SquareCloud (https://api-berg.squareweb.app)
 */
export function getApiUrl(): string {
  // Sempre verificar variáveis de ambiente primeiro
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL
  
  if (apiUrl) {
    console.log('🌐 URL da API (variável de ambiente):', apiUrl)
    return apiUrl
  }
  
  // Em desenvolvimento, usar localhost apenas se não houver variável de ambiente
  if (import.meta.env.DEV) {
    const devUrl = 'http://localhost:3001'
    console.log('🌐 URL da API (desenvolvimento local):', devUrl)
    return devUrl
  }
  
  // Em produção, SEMPRE usar URL da SquareCloud como padrão
  const squareCloudUrl = 'https://api-berg.squareweb.app'
  console.log('🌐 URL da API (produção - SquareCloud):', squareCloudUrl)
  return squareCloudUrl
}

/**
 * Obtém a URL da API ou lança erro se não configurada
 */
export function getApiUrlOrThrow(): string {
  const url = getApiUrl()
  if (!url) {
    throw new Error(
      'URL da API não configurada. Configure VITE_API_URL ou VITE_BACKEND_URL nas variáveis de ambiente.'
    )
  }
  return url
}

