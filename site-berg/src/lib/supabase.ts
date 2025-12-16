import { createClient } from '@supabase/supabase-js'
import { User } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL ou Anon Key não configurados. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env',
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
)

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          features: string[]
          active: boolean
          highlight: string | null
          icon_type: 'shopping-cart' | 'bot' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          features: string[]
          active?: boolean
          highlight?: string | null
          icon_type?: 'shopping-cart' | 'bot' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          features?: string[]
          active?: boolean
          highlight?: string | null
          icon_type?: 'shopping-cart' | 'bot' | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_email: string
          product_id: string
          product_name: string
          amount: number
          status: 'completed' | 'pending' | 'failed'
          date: string
          payment_method: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email: string
          product_id: string
          product_name: string
          amount: number
          status?: 'completed' | 'pending' | 'failed'
          date?: string
          payment_method: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_email?: string
          product_id?: string
          product_name?: string
          amount?: number
          status?: 'completed' | 'pending' | 'failed'
          date?: string
          payment_method?: string
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          payment_gateway: string
          api_key: string
          enable_pix: boolean
          enable_credit_card: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_gateway: string
          api_key: string
          enable_pix?: boolean
          enable_credit_card?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_gateway?: string
          api_key?: string
          enable_pix?: boolean
          enable_credit_card?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      visits: {
        Row: {
          id: string
          count: number
          updated_at: string
        }
        Insert: {
          id?: string
          count?: number
          updated_at?: string
        }
        Update: {
          id?: string
          count?: number
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          discord_id: string
          username: string
          discriminator: string
          avatar: string | null
          email: string | null
          verified: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          discord_id: string
          username: string
          discriminator: string
          avatar?: string | null
          email?: string | null
          verified?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          discord_id?: string
          username?: string
          discriminator?: string
          avatar?: string | null
          email?: string | null
          verified?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper para converter User do Supabase para User do app
export function mapSupabaseUserToAppUser(
  supabaseUser: any,
  isAdmin: boolean = false,
  userRecord?: any, // Registro completo da tabela users (com UUID)
): User {
  // Se supabaseUser é um objeto de auth (tem id do Supabase)
  if (supabaseUser.id && !supabaseUser.discord_id) {
    // Se temos userRecord, usar os dados dele (já salvos no banco)
    if (userRecord) {
      return {
        id: supabaseUser.id,
        userId: userRecord.id,
        username: userRecord.username || 'Usuario',
        discriminator: userRecord.discriminator || '0',
        avatar: userRecord.avatar || null,
        email: userRecord.email || supabaseUser.email || supabaseUser.user_metadata?.email,
        verified: userRecord.verified || (supabaseUser.email_confirmed_at ? true : false),
        isAdmin,
      }
    }
    
    // Caso contrário, pegar dos metadados do Supabase
    const discordUsername = 
      supabaseUser.user_metadata?.custom_claims?.global_name ||
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.preferred_username ||
      supabaseUser.user_metadata?.name?.split('#')[0] ||
      supabaseUser.user_metadata?.username ||
      supabaseUser.email?.split('@')[0] ||
      'Usuario'
    
    const discordAvatar = 
      supabaseUser.user_metadata?.avatar_url ||
      supabaseUser.user_metadata?.picture ||
      supabaseUser.user_metadata?.avatar ||
      null
    
    return {
      id: supabaseUser.id,
      userId: userRecord?.id || undefined,
      username: discordUsername,
      discriminator: '0',
      avatar: discordAvatar,
      email: supabaseUser.email || supabaseUser.user_metadata?.email,
      verified: supabaseUser.email_confirmed_at ? true : false,
      isAdmin,
    }
  }

  // Se supabaseUser é um registro da tabela users
  return {
    id: supabaseUser.discord_id || supabaseUser.id,
    userId: supabaseUser.id || undefined, // UUID da tabela users
    username: supabaseUser.username || '',
    discriminator: supabaseUser.discriminator || '0',
    avatar: supabaseUser.avatar || null,
    email: supabaseUser.email || null,
    verified: supabaseUser.verified || false,
    isAdmin,
  }
}

