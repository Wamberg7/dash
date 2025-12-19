export interface Product {
  id: string
  title: string
  description: string
  price: number
  features: string[]
  active: boolean
  highlight?: string
  iconType?: 'shopping-cart' | 'bot'
  centralCartPackageId?: number // ID do produto na CentralCart
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  productId: string
  productName: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  date: string
  paymentMethod: string
  paymentId?: string // ID do pagamento no Mercado Pago
  botToken?: string // Token do bot Discord
  serverId?: string // ID do servidor Discord
  ownerId?: string // ID do dono do servidor
  botStatus?: 'waiting' | 'hosted' | 'active' | 'inactive' | 'online' | 'offline' | 'invalid_data' // Status do bot
  subscriptionStartDate?: string // Data de início da assinatura (quando bot foi configurado)
  subscriptionExpiryDate?: string // Data de expiração da assinatura
  userId?: string // ID do usuário que adquiriu o bot (UUID da tabela users)
  // Recursos do bot
  botCpuPercent?: number // Percentual de uso de CPU (0-100)
  botRamMb?: number // Quantidade total de RAM alocada em MB
  botRamUsedMb?: number // Quantidade de RAM utilizada em MB
  botNetworkTotalDown?: number // Total de dados baixados em bytes
  botNetworkTotalUp?: number // Total de dados enviados em bytes
  botNetworkCurrentDown?: number // Taxa atual de download em bytes
  botNetworkCurrentUp?: number // Taxa atual de upload em bytes
  botServiceId?: string // ID do serviço no sistema de hospedagem
  botCluster?: string // Cluster onde o bot está hospedado
}

export interface RamUpgradeOption {
  ramMb: number
  price: number
  label: string
}

export interface DashboardStats {
  totalVisits: number
  totalSales: number
  salesBotCount: number
  ticketBotCount: number
  totalRevenue: number
}

export interface CheckoutSettings {
  paymentGateway: string
  apiKey: string
  enablePix: boolean
  enableCreditCard: boolean
  // Mercado Pago specific
  mercadoPagoClientId?: string
  mercadoPagoClientSecret?: string
  mercadoPagoPublicKey?: string
  mercadoPagoAccessToken?: string
  // LivePix specific
  livepixClientId?: string
  livepixClientSecret?: string
  // CentralCart specific
  centralCartApiToken?: string
  // Taxa adicional
  additionalFee?: boolean
  // Notification settings
  discordSalesPublic?: boolean
  discordSalesAdmin?: boolean
  discordStockOut?: boolean
  discordAffiliateWithdrawal?: boolean
  appSalesNotification?: boolean
  emailStoreExpiration?: boolean
}

export interface User {
  id: string // Discord ID ou Supabase Auth ID
  userId?: string // UUID da tabela users (para associação com pedidos)
  username: string
  discriminator: string
  avatar: string | null
  email?: string
  verified?: boolean
  isAdmin?: boolean
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface BotSettings {
  id?: string
  // Tokens e credenciais
  discordToken?: string
  squarecloudAccessToken?: string
  mercadoPagoAccessToken?: string
  // IDs do Discord
  botId?: string
  serverId?: string
  ownerId?: string
  // URLs e configurações
  backendUrl?: string
  useBackend?: boolean
  webhookUrl?: string
  // Canais do Discord
  carrinhosChannelId?: string
  logsComprasChannelId?: string
  logsBotEnviadosChannelId?: string
  logsBotExpiradosChannelId?: string
  logsQuebrarTermosChannelId?: string
  logsRenovacaoChannelId?: string
  logsStartChannelId?: string
  // Imagens
  imagemGen?: string
  imagemMoney?: string
  imagemAuth?: string
  imagemTicket?: string
  // Valores dos produtos
  valorBotGen?: string
  valorBotAuth?: string
  valorBioPerso?: string
  valorStockEx?: string
  valorStockAuto?: string
  valorStockMan?: string
  valorBotTicket?: string
}
